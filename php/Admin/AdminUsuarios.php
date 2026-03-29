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

    if (!empty($_POST)) {
        return $_POST;
    }

    parse_str($Contenido, $DatosParseados);

    return is_array($DatosParseados) ? $DatosParseados : [];
}

function ValidarSesionAdmin(): array
{
    Sesion::Iniciar();

    if (!Sesion::HaySesion()) {
        ResponderJson(false, "Acceso no autorizado.", [], 401);
    }

    $UsuarioSesion = Sesion::ObtenerUsuario();

    if (!$UsuarioSesion || ($UsuarioSesion["ROL"] ?? "") !== "ADMIN") {
        ResponderJson(false, "No tienes permisos para usar este módulo.", [], 403);
    }

    return $UsuarioSesion;
}

function ValidarRol(string $Rol): bool
{
    return in_array($Rol, ["CLIENTE", "ADMIN"], true);
}

function ValidarEstado(string $Estado): bool
{
    return in_array($Estado, ["ACTIVO", "INACTIVO", "BLOQUEADO"], true);
}

function ValidarCorreo(string $Correo): bool
{
    return filter_var($Correo, FILTER_VALIDATE_EMAIL) !== false;
}

function NormalizarTexto(?string $Valor): string
{
    return trim((string) $Valor);
}

try {
    ValidarSesionAdmin();

    $Metodo = $_SERVER["REQUEST_METHOD"] ?? "GET";
    $Db = new Db();
    $Conexion = $Db->Conectar();

    if ($Metodo === "GET") {
        $IdUsuario = isset($_GET["id"]) ? (int) $_GET["id"] : 0;

        if ($IdUsuario > 0) {
            $Consulta = $Conexion->prepare("
                SELECT
                    ID_USUARIO,
                    NOMBRE,
                    APELLIDO,
                    CORREO,
                    TELEFONO,
                    FECHA_REGISTRO,
                    ESTADO_USUARIO,
                    ROL
                FROM COR_USUARIOS_TB
                WHERE ID_USUARIO = ?
                LIMIT 1
            ");

            if (!$Consulta) {
                throw new Exception("No fue posible preparar la consulta del usuario.");
            }

            $Consulta->bind_param("i", $IdUsuario);
            $Consulta->execute();

            $Resultado = $Consulta->get_result();
            $Usuario = $Resultado->fetch_assoc();

            $Consulta->close();
            $Conexion->close();

            if (!$Usuario) {
                ResponderJson(false, "Usuario no encontrado.", [], 404);
            }

            ResponderJson(true, "Usuario cargado correctamente.", [
                "Usuario" => $Usuario
            ]);
        }

        $Consulta = $Conexion->prepare("
            SELECT
                ID_USUARIO,
                NOMBRE,
                APELLIDO,
                CORREO,
                TELEFONO,
                FECHA_REGISTRO,
                ESTADO_USUARIO,
                ROL
            FROM COR_USUARIOS_TB
            ORDER BY FECHA_REGISTRO DESC, ID_USUARIO DESC
        ");

        if (!$Consulta) {
            throw new Exception("No fue posible preparar la lista de usuarios.");
        }

        $Consulta->execute();
        $Resultado = $Consulta->get_result();

        $Usuarios = [];

        while ($Fila = $Resultado->fetch_assoc()) {
            $Usuarios[] = $Fila;
        }

        $Consulta->close();
        $Conexion->close();

        ResponderJson(true, "Usuarios cargados correctamente.", [
            "Usuarios" => $Usuarios
        ]);
    }

    if ($Metodo === "POST") {
        $Datos = ObtenerDatosEntrada();

        $Nombre = NormalizarTexto($Datos["Nombre"] ?? "");
        $Apellido = NormalizarTexto($Datos["Apellido"] ?? "");
        $Correo = NormalizarTexto($Datos["Correo"] ?? "");
        $Telefono = NormalizarTexto($Datos["Telefono"] ?? "");
        $Rol = strtoupper(NormalizarTexto($Datos["Rol"] ?? ""));
        $EstadoUsuario = strtoupper(NormalizarTexto($Datos["EstadoUsuario"] ?? ""));
        $Contrasena = (string) ($Datos["Contrasena"] ?? "");
        $ConfirmarContrasena = (string) ($Datos["ConfirmarContrasena"] ?? "");

        if ($Nombre === "") {
            ResponderJson(false, "El nombre es obligatorio.", [], 422);
        }

        if ($Apellido === "") {
            ResponderJson(false, "El apellido es obligatorio.", [], 422);
        }

        if ($Correo === "" || !ValidarCorreo($Correo)) {
            ResponderJson(false, "Debes indicar un correo válido.", [], 422);
        }

        if (!ValidarRol($Rol)) {
            ResponderJson(false, "El rol indicado no es válido.", [], 422);
        }

        if (!ValidarEstado($EstadoUsuario)) {
            ResponderJson(false, "El estado indicado no es válido.", [], 422);
        }

        if ($Contrasena === "") {
            ResponderJson(false, "La contraseña es obligatoria para crear el usuario.", [], 422);
        }

        if (strlen($Contrasena) < 8) {
            ResponderJson(false, "La contraseña debe tener al menos 8 caracteres.", [], 422);
        }

        if ($Contrasena !== $ConfirmarContrasena) {
            ResponderJson(false, "Las contraseñas no coinciden.", [], 422);
        }

        $ConsultaCorreo = $Conexion->prepare("
            SELECT ID_USUARIO
            FROM COR_USUARIOS_TB
            WHERE CORREO = ?
            LIMIT 1
        ");

        if (!$ConsultaCorreo) {
            throw new Exception("No fue posible validar el correo.");
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
        $TelefonoFinal = $Telefono !== "" ? $Telefono : null;

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
            throw new Exception("No fue posible preparar la creación del usuario.");
        }

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
            throw new Exception("No fue posible crear el usuario.");
        }

        $IdNuevoUsuario = $Insercion->insert_id;

        $Insercion->close();
        $Conexion->close();

        ResponderJson(true, "Usuario creado correctamente.", [
            "ID_USUARIO" => $IdNuevoUsuario
        ]);
    }

    if ($Metodo === "PUT") {
        $Datos = ObtenerDatosEntrada();

        $IdUsuario = (int) ($Datos["ID_USUARIO"] ?? 0);
        $Nombre = NormalizarTexto($Datos["Nombre"] ?? "");
        $Apellido = NormalizarTexto($Datos["Apellido"] ?? "");
        $Correo = NormalizarTexto($Datos["Correo"] ?? "");
        $Telefono = NormalizarTexto($Datos["Telefono"] ?? "");
        $Rol = strtoupper(NormalizarTexto($Datos["Rol"] ?? ""));
        $EstadoUsuario = strtoupper(NormalizarTexto($Datos["EstadoUsuario"] ?? ""));
        $Contrasena = (string) ($Datos["Contrasena"] ?? "");
        $ConfirmarContrasena = (string) ($Datos["ConfirmarContrasena"] ?? "");

        if ($IdUsuario <= 0) {
            ResponderJson(false, "El ID del usuario es obligatorio.", [], 422);
        }

        if ($Nombre === "") {
            ResponderJson(false, "El nombre es obligatorio.", [], 422);
        }

        if ($Apellido === "") {
            ResponderJson(false, "El apellido es obligatorio.", [], 422);
        }

        if ($Correo === "" || !ValidarCorreo($Correo)) {
            ResponderJson(false, "Debes indicar un correo válido.", [], 422);
        }

        if (!ValidarRol($Rol)) {
            ResponderJson(false, "El rol indicado no es válido.", [], 422);
        }

        if (!ValidarEstado($EstadoUsuario)) {
            ResponderJson(false, "El estado indicado no es válido.", [], 422);
        }

        if ($Contrasena !== "" && strlen($Contrasena) < 8) {
            ResponderJson(false, "La nueva contraseña debe tener al menos 8 caracteres.", [], 422);
        }

        if ($Contrasena !== "" && $Contrasena !== $ConfirmarContrasena) {
            ResponderJson(false, "Las contraseñas no coinciden.", [], 422);
        }

        $ConsultaExistencia = $Conexion->prepare("
            SELECT ID_USUARIO
            FROM COR_USUARIOS_TB
            WHERE ID_USUARIO = ?
            LIMIT 1
        ");

        if (!$ConsultaExistencia) {
            throw new Exception("No fue posible validar la existencia del usuario.");
        }

        $ConsultaExistencia->bind_param("i", $IdUsuario);
        $ConsultaExistencia->execute();
        $ResultadoExistencia = $ConsultaExistencia->get_result();

        if ($ResultadoExistencia->num_rows === 0) {
            $ConsultaExistencia->close();
            $Conexion->close();
            ResponderJson(false, "El usuario no existe.", [], 404);
        }

        $ConsultaExistencia->close();

        $ConsultaCorreo = $Conexion->prepare("
            SELECT ID_USUARIO
            FROM COR_USUARIOS_TB
            WHERE CORREO = ? AND ID_USUARIO <> ?
            LIMIT 1
        ");

        if (!$ConsultaCorreo) {
            throw new Exception("No fue posible validar el correo.");
        }

        $ConsultaCorreo->bind_param("si", $Correo, $IdUsuario);
        $ConsultaCorreo->execute();
        $ResultadoCorreo = $ConsultaCorreo->get_result();

        if ($ResultadoCorreo->num_rows > 0) {
            $ConsultaCorreo->close();
            $Conexion->close();
            ResponderJson(false, "El correo ya existe en otro usuario.", [], 409);
        }

        $ConsultaCorreo->close();

        $TelefonoFinal = $Telefono !== "" ? $Telefono : null;

        if ($Contrasena !== "") {
            $ContrasenaHash = password_hash($Contrasena, PASSWORD_DEFAULT);

            $Actualizacion = $Conexion->prepare("
                UPDATE COR_USUARIOS_TB
                SET
                    NOMBRE = ?,
                    APELLIDO = ?,
                    CORREO = ?,
                    TELEFONO = ?,
                    ESTADO_USUARIO = ?,
                    ROL = ?,
                    CONTRASENA = ?
                WHERE ID_USUARIO = ?
            ");

            if (!$Actualizacion) {
                throw new Exception("No fue posible preparar la actualización del usuario.");
            }

            $Actualizacion->bind_param(
                "sssssssi",
                $Nombre,
                $Apellido,
                $Correo,
                $TelefonoFinal,
                $EstadoUsuario,
                $Rol,
                $ContrasenaHash,
                $IdUsuario
            );
        } else {
            $Actualizacion = $Conexion->prepare("
                UPDATE COR_USUARIOS_TB
                SET
                    NOMBRE = ?,
                    APELLIDO = ?,
                    CORREO = ?,
                    TELEFONO = ?,
                    ESTADO_USUARIO = ?,
                    ROL = ?
                WHERE ID_USUARIO = ?
            ");

            if (!$Actualizacion) {
                throw new Exception("No fue posible preparar la actualización del usuario.");
            }

            $Actualizacion->bind_param(
                "ssssssi",
                $Nombre,
                $Apellido,
                $Correo,
                $TelefonoFinal,
                $EstadoUsuario,
                $Rol,
                $IdUsuario
            );
        }

        if (!$Actualizacion->execute()) {
            throw new Exception("No fue posible actualizar el usuario.");
        }

        $Actualizacion->close();
        $Conexion->close();

        ResponderJson(true, "Usuario actualizado correctamente.");
    }

    $Conexion->close();
    ResponderJson(false, "Método no permitido.", [], 405);
} catch (Throwable $Error) {
    ResponderJson(false, $Error->getMessage(), [], 500);
}
