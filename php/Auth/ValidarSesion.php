<?php

header("Content-Type: application/json; charset=utf-8");

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

Sesion::Iniciar();

if (!Sesion::HaySesion()) {
    ResponderJson(false, "No hay sesión activa.", [], 401);
}

$Usuario = Sesion::ObtenerUsuario();

ResponderJson(
    true,
    "Sesión activa.",
    [
        "Usuario" => $Usuario,
        "Autenticado" => true
    ]
);
