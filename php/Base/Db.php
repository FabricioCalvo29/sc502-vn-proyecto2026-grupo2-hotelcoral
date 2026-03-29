<?php

class Db
{
    private string $Host = "db";
    private string $BaseDatos = "appdb";
    private string $Usuario = "appuser";
    private string $Contrasena = "apppass";

    public function Conectar(): mysqli
    {
        $Conexion = new mysqli(
            $this->Host,
            $this->Usuario,
            $this->Contrasena,
            $this->BaseDatos
        );

        if ($Conexion->connect_error) {
            throw new Exception("No fue posible conectar con la base de datos.");
        }

        $Conexion->set_charset("utf8mb4");

        return $Conexion;
    }
}
