document.addEventListener("DOMContentLoaded", () => {
    const BotonCerrarSesionAdmin = document.getElementById("BotonCerrarSesionAdmin");
    const MensajeAdmin = document.getElementById("MensajeAdmin");

    InicializarAdmin();

    async function InicializarAdmin() {
        if (BotonCerrarSesionAdmin) {
            BotonCerrarSesionAdmin.addEventListener("click", CerrarSesionAdmin);
        }

        await ValidarAccesoAdmin();
    }

    async function ValidarAccesoAdmin() {
        LimpiarMensaje(MensajeAdmin);

        try {
            const Respuesta = await fetch("php/Auth/ValidarSesion.php", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            const Resultado = await Respuesta.json();

            if (Respuesta.status === 401) {
                window.location.href = "AccesoCuenta.html";
                return;
            }

            if (!Respuesta.ok || !Resultado.success || !Resultado.data?.Usuario) {
                MostrarMensaje(
                    MensajeAdmin,
                    Resultado.message || "No fue posible validar la sesión.",
                    "error"
                );
                return;
            }

            const Usuario = Resultado.data.Usuario;
            const Rol = Usuario.ROL ?? "";

            if (Rol !== "ADMIN") {
                window.location.href = "MiCuenta.html";
                return;
            }

            MostrarMensaje(
                MensajeAdmin,
                `Bienvenido al panel administrativo, ${Usuario.NOMBRE}.`,
                "exito"
            );
        } catch (Error) {
            console.error("Error al validar acceso admin:", Error);

            MostrarMensaje(
                MensajeAdmin,
                "Ocurrió un error inesperado al validar el acceso administrativo.",
                "error"
            );
        }
    }

    async function CerrarSesionAdmin() {
        try {
            if (BotonCerrarSesionAdmin) {
                BotonCerrarSesionAdmin.disabled = true;
                BotonCerrarSesionAdmin.textContent = "Cerrando...";
            }

            const Respuesta = await fetch("php/Auth/CerrarSesion.php", {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                }
            });

            const Resultado = await Respuesta.json();

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeAdmin,
                    Resultado.message || "No fue posible cerrar la sesión.",
                    "error"
                );
                return;
            }

            window.location.href = Resultado.data?.Redireccion || "AccesoCuenta.html";
        } catch (Error) {
            console.error("Error al cerrar sesión admin:", Error);

            MostrarMensaje(
                MensajeAdmin,
                "Ocurrió un error inesperado al cerrar la sesión.",
                "error"
            );
        } finally {
            if (BotonCerrarSesionAdmin) {
                BotonCerrarSesionAdmin.disabled = false;
                BotonCerrarSesionAdmin.textContent = "Cerrar sesión";
            }
        }
    }

    function MostrarMensaje(Contenedor, Texto, Tipo = "info") {
        if (!Contenedor) {
            return;
        }

        Contenedor.textContent = Texto;
        Contenedor.style.display = "block";

        if (Tipo === "error") {
            Contenedor.style.color = "#8B1E1E";
            Contenedor.style.backgroundColor = "#FCE8E6";
            Contenedor.style.border = "1px solid #F4C7C3";
        } else if (Tipo === "exito") {
            Contenedor.style.color = "#1E5E3A";
            Contenedor.style.backgroundColor = "#E6F4EA";
            Contenedor.style.border = "1px solid #B7DFBE";
        } else {
            Contenedor.style.color = "#243238";
            Contenedor.style.backgroundColor = "#F5EFE6";
            Contenedor.style.border = "1px solid #D9C3A3";
        }

        Contenedor.style.padding = "0.85rem 1rem";
        Contenedor.style.borderRadius = "12px";
        Contenedor.style.marginBottom = "1rem";
    }

    function LimpiarMensaje(Contenedor) {
        if (!Contenedor) {
            return;
        }

        Contenedor.textContent = "";
        Contenedor.style.display = "none";
        Contenedor.style.color = "";
        Contenedor.style.backgroundColor = "";
        Contenedor.style.border = "";
        Contenedor.style.padding = "";
        Contenedor.style.borderRadius = "";
        Contenedor.style.marginBottom = "";
    }
});