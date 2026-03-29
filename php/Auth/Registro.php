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

    $Nombre = trim($Datos["Nombre"] ?? "");
    $Apellido = trim($Datos["Apellido"] ?? "");
    $Correo = trim($Datos["Correo"] ?? "");
    $Telefono = trim($Datos["Telefono"] ?? "");
    $Contrasena = (string) ($Datos["Contrasena"] ?? "");
    $ConfirmarContrasena = (string) ($Datos["ConfirmarContrasena"] ?? "");

    if ($Nombre === "") {
        ResponderJson(false, "El nombre es obligatorio.", [], 422);
    }

    if ($Apellido === "") {
        ResponderJson(false, "El apellido es obligatorio.", [], 422);
    }

    if ($Correo === "" || !filter_var($Correo, FILTER_VALIDATE_EMAIL)) {
        ResponderJson(false, "Debes indicar un correo válido.", [], 422);
    }

    if ($Contrasena === "") {
        ResponderJson(false, "La contraseña es obligatoria.", [], 422);
    }

    if (strlen($Contrasena) < 8) {
        ResponderJson(false, "La contraseña debe tener al menos 8 caracteres.", [], 422);
    }

    if ($Contrasena !== $ConfirmarContrasena) {
        ResponderJson(false, "Las contraseñas no coinciden.", [], 422);
    }

    $Db = new Db();
    $Conexion = $Db->Conectar();

    $ConsultaCorreo = $Conexion->prepare("
        SELECT ID_USUARIO
        FROM COR_USUARIOS_TB
        WHERE CORREO = ?
        LIMIT 1
    ");

    if (!$ConsultaCorreo) {
        throw new Exception("No fue posible preparar la validación de correo.");
    }

    $ConsultaCorreo->bind_param("s", $Correo);
    $ConsultaCorreo->execute();
    $ResultadoCorreo = $ConsultaCorreo->get_result();

    if ($ResultadoCorreo->num_rows > 0) {
        $ConsultaCorreo->close();
        $Conexion->close();
        ResponderJson(false, "El correo ya existe.", [], 409);
    }

    $ConsultaCorreo->close();

    $ContrasenaHash = password_hash($Contrasena, PASSWORD_DEFAULT);
    $Rol = "CLIENTE";
    $EstadoUsuario = "ACTIVO";

    $Insercion = $Conexion->prepare("
        INSERT INTO COR_USUARIOS_TB
        (
            NOMBRE,
            APELLIDO,
            CORREO,
            CONTRASENA,
            TELEFONO,
            ESTADO_USUARIO,
            ROL
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$Insercion) {
        throw new Exception("No fue posible preparar el registro.");
    }

    $TelefonoFinal = $Telefono !== "" ? $Telefono : null;

    $Insercion->bind_param(
        "sssssss",
        $Nombre,
        $Apellido,
        $Correo,
        $ContrasenaHash,
        $TelefonoFinal,
        $EstadoUsuario,
        $Rol
    );

    if (!$Insercion->execute()) {
        throw new Exception("No fue posible registrar el usuario.");
    }

    $IdUsuario = $Insercion->insert_id;
    $Insercion->close();

    $ConsultaUsuario = $Conexion->prepare("
        SELECT
            ID_USUARIO,
            NOMBRE,
            APELLIDO,
            CORREO,
            ESTADO_USUARIO,
            ROL
        FROM COR_USUARIOS_TB
        WHERE ID_USUARIO = ?
        LIMIT 1
    ");

    if (!$ConsultaUsuario) {
        throw new Exception("No fue posible obtener el usuario registrado.");
    }

    $ConsultaUsuario->bind_param("i", $IdUsuario);
    $ConsultaUsuario->execute();
    $ResultadoUsuario = $ConsultaUsuario->get_result();
    $Usuario = $ResultadoUsuario->fetch_assoc();

    $ConsultaUsuario->close();
    $Conexion->close();

    Sesion::GuardarUsuario($Usuario);

    ResponderJson(
        true,
        "Cuenta creada correctamente.",
        [
            "Rol" => $Usuario["ROL"],
            "Redireccion" => $Usuario["ROL"] === "ADMIN" ? "Admin.html" : "MiCuenta.html"
        ]
    );
} catch (Throwable $Error) {
    ResponderJson(false, $Error->getMessage(), [], 500);
}
