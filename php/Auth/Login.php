<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../Base/Db.php";
require_once __DIR__ . "/../Base/Sesion.php";

function ResponderJson(bool $Exito, string $Mensaje, array $Datos = [], int $Codigo = 200): void
{
    http_response_code($Codigo);
    echo json_encode([
        "success" => $Exito,
        "message" => $Mensaje,
        "data" => $Datos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function ObtenerDatosEntrada(): array
{
    $Contenido = file_get_contents("php://input");
    $Json = json_decode($Contenido, true);

    if (is_array($Json) && !empty($Json)) {
        return $Json;
    }

    return $_POST;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    ResponderJson(false, "Método no permitido.", [], 405);
}

try {
    $Datos = ObtenerDatosEntrada();

    $Correo = trim($Datos["Correo"] ?? "");
    $Contrasena = (string) ($Datos["Contrasena"] ?? "");

    if ($Correo === "" || !filter_var($Correo, FILTER_VALIDATE_EMAIL)) {
        ResponderJson(false, "Debes indicar un correo válido.", [], 422);
    }

    if ($Contrasena === "") {
        ResponderJson(false, "La contraseña es obligatoria.", [], 422);
    }

    $Db = new Db();
    $Conexion = $Db->Conectar();

    $Consulta = $Conexion->prepare("
        SELECT
            ID_USUARIO,
            NOMBRE,
            APELLIDO,
            CORREO,
            CONTRASENA,
            ESTADO_USUARIO,
            ROL
        FROM COR_USUARIOS_TB
        WHERE CORREO = ?
        LIMIT 1
    ");

    if (!$Consulta) {
        throw new Exception("No fue posible preparar el inicio de sesión.");
    }

    $Consulta->bind_param("s", $Correo);
    $Consulta->execute();
    $Resultado = $Consulta->get_result();
    $Usuario = $Resultado->fetch_assoc();

    $Consulta->close();
    $Conexion->close();

    if (!$Usuario) {
        ResponderJson(false, "Correo o contraseña incorrectos.", [], 401);
    }

    if (!password_verify($Contrasena, $Usuario["CONTRASENA"])) {
        ResponderJson(false, "Correo o contraseña incorrectos.", [], 401);
    }

    if ($Usuario["ESTADO_USUARIO"] === "BLOQUEADO") {
        ResponderJson(false, "Tu usuario está bloqueado.", [], 403);
    }

    if ($Usuario["ESTADO_USUARIO"] === "INACTIVO") {
        ResponderJson(false, "Tu usuario está inactivo.", [], 403);
    }

    Sesion::GuardarUsuario($Usuario);

    ResponderJson(
        true,
        "Inicio de sesión correcto.",
        [
            "Rol" => $Usuario["ROL"],
            "Redireccion" => $Usuario["ROL"] === "ADMIN" ? "Admin.html" : "MiCuenta.html"
        ]
    );
} catch (Throwable $Error) {
    ResponderJson(false, $Error->getMessage(), [], 500);
}
