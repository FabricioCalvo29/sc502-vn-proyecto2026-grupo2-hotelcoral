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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    ResponderJson(false, "Método no permitido.", [], 405);
}

Sesion::Cerrar();

ResponderJson(
    true,
    "Sesión cerrada correctamente.",
    [
        "Redireccion" => "AccesoCuenta.html"
    ]
);
