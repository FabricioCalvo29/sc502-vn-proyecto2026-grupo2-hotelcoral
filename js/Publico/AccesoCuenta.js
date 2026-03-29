document.addEventListener("DOMContentLoaded", () => {
    const FormularioLogin = document.getElementById("FormularioLogin");
    const FormularioRegistro = document.getElementById("FormularioRegistro");

    const MensajeLogin = document.getElementById("MensajeLogin");
    const MensajeRegistro = document.getElementById("MensajeRegistro");

    const BotonIngresar = document.getElementById("BotonIngresar");
    const BotonRegistrarse = document.getElementById("BotonRegistrarse");

    const InputCorreoLogin = document.getElementById("InputCorreoLogin");
    const InputContrasenaLogin = document.getElementById("InputContrasenaLogin");

    const InputNombre = document.getElementById("InputNombre");
    const InputApellido = document.getElementById("InputApellido");
    const InputCorreoRegistro = document.getElementById("InputCorreoRegistro");
    const InputTelefono = document.getElementById("InputTelefono");
    const InputContrasenaRegistro = document.getElementById("InputContrasenaRegistro");
    const InputConfirmarContrasena = document.getElementById("InputConfirmarContrasena");

    InicializarModulo();

    async function InicializarModulo() {
        await ValidarSesionActiva();

        if (FormularioLogin) {
            FormularioLogin.addEventListener("submit", ManejarLogin);
        }

        if (FormularioRegistro) {
            FormularioRegistro.addEventListener("submit", ManejarRegistro);
        }
    }

    async function ValidarSesionActiva() {
        try {
            const Respuesta = await fetch("php/Auth/ValidarSesion.php", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            const Resultado = await Respuesta.json();

            if (Respuesta.ok && Resultado.success && Resultado.data?.Usuario) {
                const Rol = Resultado.data.Usuario.ROL ?? "";

                if (Rol === "ADMIN") {
                    window.location.href = "Admin.html";
                    return;
                }

                window.location.href = "MiCuenta.html";
            }
        } catch (Error) {
            console.error("No fue posible validar la sesión actual.", Error);
        }
    }

    async function ManejarLogin(Evento) {
        Evento.preventDefault();
        LimpiarMensaje(MensajeLogin);

        const Correo = InputCorreoLogin?.value.trim() ?? "";
        const Contrasena = InputContrasenaLogin?.value ?? "";

        if (Correo === "") {
            MostrarMensaje(MensajeLogin, "Debes ingresar tu correo electrónico.", "error");
            return;
        }

        if (!EsCorreoValido(Correo)) {
            MostrarMensaje(MensajeLogin, "Debes ingresar un correo válido.", "error");
            return;
        }

        if (Contrasena === "") {
            MostrarMensaje(MensajeLogin, "Debes ingresar tu contraseña.", "error");
            return;
        }

        try {
            CambiarEstadoBoton(BotonIngresar, true, "Ingresando...");

            const Respuesta = await fetch("php/Auth/Login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    Correo,
                    Contrasena
                })
            });

            const Resultado = await Respuesta.json();

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeLogin,
                    Resultado.message || "No fue posible iniciar sesión.",
                    "error"
                );
                return;
            }

            MostrarMensaje(
                MensajeLogin,
                Resultado.message || "Inicio de sesión correcto.",
                "exito"
            );

            const Redireccion = Resultado.data?.Redireccion || "MiCuenta.html";

            setTimeout(() => {
                window.location.href = Redireccion;
            }, 700);
        } catch (Error) {
            console.error("Error al iniciar sesión:", Error);
            MostrarMensaje(
                MensajeLogin,
                "Ocurrió un error inesperado al iniciar sesión.",
                "error"
            );
        } finally {
            CambiarEstadoBoton(BotonIngresar, false, "Ingresar");
        }
    }

    async function ManejarRegistro(Evento) {
        Evento.preventDefault();
        LimpiarMensaje(MensajeRegistro);

        const Nombre = InputNombre?.value.trim() ?? "";
        const Apellido = InputApellido?.value.trim() ?? "";
        const Correo = InputCorreoRegistro?.value.trim() ?? "";
        const Telefono = InputTelefono?.value.trim() ?? "";
        const Contrasena = InputContrasenaRegistro?.value ?? "";
        const ConfirmarContrasena = InputConfirmarContrasena?.value ?? "";

        if (Nombre === "") {
            MostrarMensaje(MensajeRegistro, "Debes ingresar tu nombre.", "error");
            return;
        }

        if (Apellido === "") {
            MostrarMensaje(MensajeRegistro, "Debes ingresar tu apellido.", "error");
            return;
        }

        if (Correo === "") {
            MostrarMensaje(MensajeRegistro, "Debes ingresar tu correo electrónico.", "error");
            return;
        }

        if (!EsCorreoValido(Correo)) {
            MostrarMensaje(MensajeRegistro, "Debes ingresar un correo válido.", "error");
            return;
        }

        if (Contrasena === "") {
            MostrarMensaje(MensajeRegistro, "Debes ingresar una contraseña.", "error");
            return;
        }

        if (Contrasena.length < 8) {
            MostrarMensaje(
                MensajeRegistro,
                "La contraseña debe tener al menos 8 caracteres.",
                "error"
            );
            return;
        }

        if (ConfirmarContrasena === "") {
            MostrarMensaje(
                MensajeRegistro,
                "Debes confirmar la contraseña.",
                "error"
            );
            return;
        }

        if (Contrasena !== ConfirmarContrasena) {
            MostrarMensaje(
                MensajeRegistro,
                "Las contraseñas no coinciden.",
                "error"
            );
            return;
        }

        try {
            CambiarEstadoBoton(BotonRegistrarse, true, "Registrando...");

            const Respuesta = await fetch("php/Auth/Registro.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    Nombre,
                    Apellido,
                    Correo,
                    Telefono,
                    Contrasena,
                    ConfirmarContrasena
                })
            });

            const Resultado = await Respuesta.json();

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeRegistro,
                    Resultado.message || "No fue posible crear la cuenta.",
                    "error"
                );
                return;
            }

            MostrarMensaje(
                MensajeRegistro,
                Resultado.message || "Cuenta creada correctamente.",
                "exito"
            );

            FormularioRegistro.reset();

            const Redireccion = Resultado.data?.Redireccion || "MiCuenta.html";

            setTimeout(() => {
                window.location.href = Redireccion;
            }, 900);
        } catch (Error) {
            console.error("Error al registrar usuario:", Error);
            MostrarMensaje(
                MensajeRegistro,
                "Ocurrió un error inesperado al registrar la cuenta.",
                "error"
            );
        } finally {
            CambiarEstadoBoton(BotonRegistrarse, false, "Registrarme");
        }
    }

    function EsCorreoValido(Correo) {
        const PatronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return PatronCorreo.test(Correo);
    }

    function MostrarMensaje(Contenedor, Texto, Tipo = "info") {
        if (!Contenedor) {
            return;
        }

        Contenedor.textContent = Texto;
        Contenedor.style.display = "block";
        Contenedor.dataset.tipo = Tipo;

        if (Tipo === "error") {
            Contenedor.style.color = "#8B1E1E";
            Contenedor.style.backgroundColor = "#FCE8E6";
            Contenedor.style.border = "1px solid #F4C7C3";
            Contenedor.style.padding = "0.85rem 1rem";
            Contenedor.style.borderRadius = "12px";
            Contenedor.style.marginBottom = "1rem";
        } else if (Tipo === "exito") {
            Contenedor.style.color = "#1E5E3A";
            Contenedor.style.backgroundColor = "#E6F4EA";
            Contenedor.style.border = "1px solid #B7DFBE";
            Contenedor.style.padding = "0.85rem 1rem";
            Contenedor.style.borderRadius = "12px";
            Contenedor.style.marginBottom = "1rem";
        } else {
            Contenedor.style.color = "#243238";
            Contenedor.style.backgroundColor = "#F5EFE6";
            Contenedor.style.border = "1px solid #D9C3A3";
            Contenedor.style.padding = "0.85rem 1rem";
            Contenedor.style.borderRadius = "12px";
            Contenedor.style.marginBottom = "1rem";
        }
    }

    function LimpiarMensaje(Contenedor) {
        if (!Contenedor) {
            return;
        }

        Contenedor.textContent = "";
        Contenedor.style.display = "none";
        Contenedor.removeAttribute("data-tipo");
        Contenedor.style.color = "";
        Contenedor.style.backgroundColor = "";
        Contenedor.style.border = "";
        Contenedor.style.padding = "";
        Contenedor.style.borderRadius = "";
        Contenedor.style.marginBottom = "";
    }

    function CambiarEstadoBoton(Boton, EstaCargando, TextoNormal) {
        if (!Boton) {
            return;
        }

        if (EstaCargando) {
            Boton.disabled = true;
            Boton.dataset.textoOriginal = Boton.textContent;
        } else {
            Boton.disabled = false;
        }

        if (EstaCargando) {
            Boton.textContent = Boton.id === "BotonIngresar" ? "Ingresando..." : "Registrando...";
        } else {
            Boton.textContent = TextoNormal || Boton.dataset.textoOriginal || Boton.textContent;
        }
    }
});