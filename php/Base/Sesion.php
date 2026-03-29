<?php

class Sesion
{
    public static function Iniciar(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function GuardarUsuario(array $Usuario): void
    {
        self::Iniciar();

        $_SESSION["Usuario"] = [
            "ID_USUARIO" => (int) $Usuario["ID_USUARIO"],
            "NOMBRE" => $Usuario["NOMBRE"],
            "APELLIDO" => $Usuario["APELLIDO"],
            "CORREO" => $Usuario["CORREO"],
            "ROL" => $Usuario["ROL"],
            "ESTADO_USUARIO" => $Usuario["ESTADO_USUARIO"]
        ];
    }

    public static function HaySesion(): bool
    {
        self::Iniciar();
        return isset($_SESSION["Usuario"]);
    }

    public static function ObtenerUsuario(): ?array
    {
        self::Iniciar();
        return $_SESSION["Usuario"] ?? null;
    }

    public static function EsAdmin(): bool
    {
        self::Iniciar();

        return isset($_SESSION["Usuario"]["ROL"]) &&
            $_SESSION["Usuario"]["ROL"] === "ADMIN";
    }

    public static function Cerrar(): void
    {
        self::Iniciar();

        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $Parametros = session_get_cookie_params();

            setcookie(
                session_name(),
                "",
                time() - 42000,
                $Parametros["path"],
                $Parametros["domain"],
                $Parametros["secure"],
                $Parametros["httponly"]
            );
        }

        session_destroy();
    }
}
