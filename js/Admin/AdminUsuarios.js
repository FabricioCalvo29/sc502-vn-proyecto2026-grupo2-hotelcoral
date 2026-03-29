document.addEventListener("DOMContentLoaded", () => {
    const MensajeAdminUsuarios = document.getElementById("MensajeAdminUsuarios");

    const FormularioAdminUsuarios = document.getElementById("FormularioAdminUsuarios");
    const TituloFormularioUsuarios = document.getElementById("TituloFormularioUsuarios");
    const TextoModoFormulario = document.getElementById("TextoModoFormulario");

    const InputIdUsuario = document.getElementById("InputIdUsuario");
    const InputNombreUsuario = document.getElementById("InputNombreUsuario");
    const InputApellidoUsuario = document.getElementById("InputApellidoUsuario");
    const InputCorreoUsuario = document.getElementById("InputCorreoUsuario");
    const InputTelefonoUsuario = document.getElementById("InputTelefonoUsuario");
    const SelectRolUsuario = document.getElementById("SelectRolUsuario");
    const SelectEstadoUsuario = document.getElementById("SelectEstadoUsuario");
    const InputContrasenaUsuario = document.getElementById("InputContrasenaUsuario");
    const InputConfirmarContrasenaUsuario = document.getElementById("InputConfirmarContrasenaUsuario");

    const BotonGuardarUsuario = document.getElementById("BotonGuardarUsuario");
    const BotonCancelarEdicion = document.getElementById("BotonCancelarEdicion");
    const BotonLimpiarFormulario = document.getElementById("BotonLimpiarFormulario");

    const InputBuscarUsuario = document.getElementById("InputBuscarUsuario");
    const SelectFiltroRol = document.getElementById("SelectFiltroRol");
    const CuerpoTablaUsuarios = document.getElementById("CuerpoTablaUsuarios");

    let ListaUsuarios = [];
    let ModoEdicion = false;

    InicializarModulo();

    async function InicializarModulo() {
        if (FormularioAdminUsuarios) {
            FormularioAdminUsuarios.addEventListener("submit", GuardarUsuario);
        }

        if (BotonCancelarEdicion) {
            BotonCancelarEdicion.addEventListener("click", CancelarEdicion);
        }

        if (BotonLimpiarFormulario) {
            BotonLimpiarFormulario.addEventListener("click", () => {
                setTimeout(() => {
                    RestablecerFormulario();
                }, 0);
            });
        }

        if (InputBuscarUsuario) {
            InputBuscarUsuario.addEventListener("input", AplicarFiltros);
        }

        if (SelectFiltroRol) {
            SelectFiltroRol.addEventListener("change", AplicarFiltros);
        }

        await CargarUsuarios();
    }

    async function CargarUsuarios() {
        LimpiarMensaje(MensajeAdminUsuarios);
        MostrarFilaCarga("Cargando usuarios...");

        try {
            const Respuesta = await fetch("php/Admin/AdminUsuarios.php", {
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

            if (Respuesta.status === 403) {
                window.location.href = "MiCuenta.html";
                return;
            }

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeAdminUsuarios,
                    Resultado.message || "No fue posible cargar los usuarios.",
                    "error"
                );
                MostrarFilaCarga("No fue posible cargar los usuarios.");
                return;
            }

            ListaUsuarios = Array.isArray(Resultado.data?.Usuarios)
                ? Resultado.data.Usuarios
                : [];

            AplicarFiltros();
        } catch (Error) {
            console.error("Error al cargar usuarios:", Error);

            MostrarMensaje(
                MensajeAdminUsuarios,
                "Ocurrió un error inesperado al cargar los usuarios.",
                "error"
            );

            MostrarFilaCarga("No fue posible cargar los usuarios.");
        }
    }

    function AplicarFiltros() {
        const TextoBusqueda = (InputBuscarUsuario?.value || "").trim().toLowerCase();
        const RolFiltro = (SelectFiltroRol?.value || "").trim().toUpperCase();

        let UsuariosFiltrados = [...ListaUsuarios];

        if (TextoBusqueda !== "") {
            UsuariosFiltrados = UsuariosFiltrados.filter((Usuario) => {
                const NombreCompleto = `${Usuario.NOMBRE ?? ""} ${Usuario.APELLIDO ?? ""}`.toLowerCase();
                const Correo = String(Usuario.CORREO ?? "").toLowerCase();

                return NombreCompleto.includes(TextoBusqueda) || Correo.includes(TextoBusqueda);
            });
        }

        if (RolFiltro !== "") {
            UsuariosFiltrados = UsuariosFiltrados.filter((Usuario) => {
                return String(Usuario.ROL ?? "").toUpperCase() === RolFiltro;
            });
        }

        RenderizarTablaUsuarios(UsuariosFiltrados);
    }

    function RenderizarTablaUsuarios(Usuarios) {
        if (!CuerpoTablaUsuarios) {
            return;
        }

        CuerpoTablaUsuarios.innerHTML = "";

        if (!Array.isArray(Usuarios) || Usuarios.length === 0) {
            CuerpoTablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="7">No se encontraron usuarios.</td>
                </tr>
            `;
            return;
        }

        Usuarios.forEach((Usuario) => {
            const Fila = document.createElement("tr");

            const NombreCompleto = `${Usuario.NOMBRE ?? ""} ${Usuario.APELLIDO ?? ""}`.trim();
            const Correo = EscapeHtml(Usuario.CORREO ?? "No disponible");
            const Telefono = EscapeHtml(Usuario.TELEFONO ?? "No registrado");
            const Rol = String(Usuario.ROL ?? "").toUpperCase();
            const EstadoUsuario = String(Usuario.ESTADO_USUARIO ?? "").toUpperCase();
            const FechaRegistro = FormatearFechaHora(Usuario.FECHA_REGISTRO);

            const ClaseRol = Rol === "ADMIN" ? "RolAdmin" : "RolCliente";
            const TextoCambioEstado = ObtenerTextoBotonEstado(EstadoUsuario);

            Fila.innerHTML = `
                <td class="NombreUsuario">${EscapeHtml(NombreCompleto || "No disponible")}</td>
                <td>${Correo}</td>
                <td>${Telefono}</td>
                <td>
                    <span class="EtiquetaRol ${ClaseRol}">
                        ${EscapeHtml(Rol)}
                    </span>
                </td>
                <td>
                    <span class="EtiquetaRol">
                        ${EscapeHtml(EstadoUsuario)}
                    </span>
                </td>
                <td>${EscapeHtml(FechaRegistro)}</td>
                <td>
                    <div class="FilaAcciones">
                        <button type="button" class="BotonEditar" data-id="${Usuario.ID_USUARIO}">
                            Editar
                        </button>
                        <button type="button" class="BotonSecundario BotonEstadoUsuario" data-id="${Usuario.ID_USUARIO}">
                            ${EscapeHtml(TextoCambioEstado)}
                        </button>
                    </div>
                </td>
            `;

            const BotonEditar = Fila.querySelector(".BotonEditar");
            const BotonEstadoUsuario = Fila.querySelector(".BotonEstadoUsuario");

            if (BotonEditar) {
                BotonEditar.addEventListener("click", () => {
                    CargarUsuarioEnFormulario(Usuario.ID_USUARIO);
                });
            }

            if (BotonEstadoUsuario) {
                BotonEstadoUsuario.addEventListener("click", () => {
                    CambiarEstadoRapido(Usuario.ID_USUARIO);
                });
            }

            CuerpoTablaUsuarios.appendChild(Fila);
        });
    }

    async function CargarUsuarioEnFormulario(IdUsuario) {
        LimpiarMensaje(MensajeAdminUsuarios);

        try {
            const Respuesta = await fetch(`php/Admin/AdminUsuarios.php?id=${encodeURIComponent(IdUsuario)}`, {
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

            if (Respuesta.status === 403) {
                window.location.href = "MiCuenta.html";
                return;
            }

            if (!Respuesta.ok || !Resultado.success || !Resultado.data?.Usuario) {
                MostrarMensaje(
                    MensajeAdminUsuarios,
                    Resultado.message || "No fue posible cargar el usuario.",
                    "error"
                );
                return;
            }

            const Usuario = Resultado.data.Usuario;

            InputIdUsuario.value = Usuario.ID_USUARIO ?? "";
            InputNombreUsuario.value = Usuario.NOMBRE ?? "";
            InputApellidoUsuario.value = Usuario.APELLIDO ?? "";
            InputCorreoUsuario.value = Usuario.CORREO ?? "";
            InputTelefonoUsuario.value = Usuario.TELEFONO ?? "";
            SelectRolUsuario.value = (Usuario.ROL ?? "").toUpperCase();
            SelectEstadoUsuario.value = (Usuario.ESTADO_USUARIO ?? "").toUpperCase();
            InputContrasenaUsuario.value = "";
            InputConfirmarContrasenaUsuario.value = "";

            ModoEdicion = true;
            ActualizarModoFormulario();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } catch (Error) {
            console.error("Error al cargar usuario:", Error);

            MostrarMensaje(
                MensajeAdminUsuarios,
                "Ocurrió un error inesperado al cargar el usuario.",
                "error"
            );
        }
    }

    async function GuardarUsuario(Evento) {
        Evento.preventDefault();
        LimpiarMensaje(MensajeAdminUsuarios);

        const DatosUsuario = {
            ID_USUARIO: InputIdUsuario?.value.trim() || "",
            Nombre: InputNombreUsuario?.value.trim() || "",
            Apellido: InputApellidoUsuario?.value.trim() || "",
            Correo: InputCorreoUsuario?.value.trim() || "",
            Telefono: InputTelefonoUsuario?.value.trim() || "",
            Rol: SelectRolUsuario?.value.trim() || "",
            EstadoUsuario: SelectEstadoUsuario?.value.trim() || "",
            Contrasena: InputContrasenaUsuario?.value || "",
            ConfirmarContrasena: InputConfirmarContrasenaUsuario?.value || ""
        };

        const ErrorValidacion = ValidarFormulario(DatosUsuario, ModoEdicion);

        if (ErrorValidacion) {
            MostrarMensaje(MensajeAdminUsuarios, ErrorValidacion, "error");
            return;
        }

        const Metodo = ModoEdicion ? "PUT" : "POST";
        const TextoCarga = ModoEdicion ? "Actualizando..." : "Guardando...";
        const TextoNormal = "Guardar usuario";

        try {
            CambiarEstadoBoton(BotonGuardarUsuario, true, TextoCarga);

            const Respuesta = await fetch("php/Admin/AdminUsuarios.php", {
                method: Metodo,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(DatosUsuario)
            });

            const Resultado = await Respuesta.json();

            if (Respuesta.status === 401) {
                window.location.href = "AccesoCuenta.html";
                return;
            }

            if (Respuesta.status === 403) {
                window.location.href = "MiCuenta.html";
                return;
            }

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeAdminUsuarios,
                    Resultado.message || "No fue posible guardar el usuario.",
                    "error"
                );
                return;
            }

            MostrarMensaje(
                MensajeAdminUsuarios,
                Resultado.message || "Usuario guardado correctamente.",
                "exito"
            );

            RestablecerFormulario();
            await CargarUsuarios();
        } catch (Error) {
            console.error("Error al guardar usuario:", Error);

            MostrarMensaje(
                MensajeAdminUsuarios,
                "Ocurrió un error inesperado al guardar el usuario.",
                "error"
            );
        } finally {
            CambiarEstadoBoton(BotonGuardarUsuario, false, TextoNormal);
        }
    }

    async function CambiarEstadoRapido(IdUsuario) {
        const Usuario = ListaUsuarios.find((Item) => Number(Item.ID_USUARIO) === Number(IdUsuario));

        if (!Usuario) {
            MostrarMensaje(MensajeAdminUsuarios, "No se encontró el usuario seleccionado.", "error");
            return;
        }

        const EstadoActual = String(Usuario.ESTADO_USUARIO ?? "").toUpperCase();
        const NuevoEstado = ObtenerSiguienteEstado(EstadoActual);

        if (!NuevoEstado) {
            MostrarMensaje(MensajeAdminUsuarios, "No fue posible determinar el nuevo estado.", "error");
            return;
        }

        const Confirmado = window.confirm(
            `¿Deseas cambiar el estado de ${Usuario.NOMBRE} ${Usuario.APELLIDO} a ${NuevoEstado}?`
        );

        if (!Confirmado) {
            return;
        }

        const DatosActualizados = {
            ID_USUARIO: Usuario.ID_USUARIO,
            Nombre: Usuario.NOMBRE ?? "",
            Apellido: Usuario.APELLIDO ?? "",
            Correo: Usuario.CORREO ?? "",
            Telefono: Usuario.TELEFONO ?? "",
            Rol: Usuario.ROL ?? "",
            EstadoUsuario: NuevoEstado,
            Contrasena: "",
            ConfirmarContrasena: ""
        };

        try {
            const Respuesta = await fetch("php/Admin/AdminUsuarios.php", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(DatosActualizados)
            });

            const Resultado = await Respuesta.json();

            if (Respuesta.status === 401) {
                window.location.href = "AccesoCuenta.html";
                return;
            }

            if (Respuesta.status === 403) {
                window.location.href = "MiCuenta.html";
                return;
            }

            if (!Respuesta.ok || !Resultado.success) {
                MostrarMensaje(
                    MensajeAdminUsuarios,
                    Resultado.message || "No fue posible cambiar el estado.",
                    "error"
                );
                return;
            }

            MostrarMensaje(
                MensajeAdminUsuarios,
                `Estado actualizado a ${NuevoEstado}.`,
                "exito"
            );

            await CargarUsuarios();
        } catch (Error) {
            console.error("Error al cambiar estado:", Error);

            MostrarMensaje(
                MensajeAdminUsuarios,
                "Ocurrió un error inesperado al cambiar el estado.",
                "error"
            );
        }
    }

    function CancelarEdicion() {
        RestablecerFormulario();
        LimpiarMensaje(MensajeAdminUsuarios);
    }

    function RestablecerFormulario() {
        if (FormularioAdminUsuarios) {
            FormularioAdminUsuarios.reset();
        }

        if (InputIdUsuario) {
            InputIdUsuario.value = "";
        }

        if (InputContrasenaUsuario) {
            InputContrasenaUsuario.value = "";
        }

        if (InputConfirmarContrasenaUsuario) {
            InputConfirmarContrasenaUsuario.value = "";
        }

        ModoEdicion = false;
        ActualizarModoFormulario();
    }

    function ActualizarModoFormulario() {
        if (ModoEdicion) {
            if (TituloFormularioUsuarios) {
                TituloFormularioUsuarios.textContent = "Editar usuario";
            }

            if (TextoModoFormulario) {
                TextoModoFormulario.textContent = "Modifica la información del usuario seleccionado.";
            }

            if (BotonGuardarUsuario) {
                BotonGuardarUsuario.textContent = "Actualizar usuario";
            }

            if (BotonCancelarEdicion) {
                BotonCancelarEdicion.style.display = "inline-flex";
            }
        } else {
            if (TituloFormularioUsuarios) {
                TituloFormularioUsuarios.textContent = "Crear usuario";
            }

            if (TextoModoFormulario) {
                TextoModoFormulario.textContent = "Completa el formulario para registrar un nuevo usuario.";
            }

            if (BotonGuardarUsuario) {
                BotonGuardarUsuario.textContent = "Guardar usuario";
            }

            if (BotonCancelarEdicion) {
                BotonCancelarEdicion.style.display = "none";
            }
        }
    }

    function ValidarFormulario(DatosUsuario, EsEdicion) {
        if (DatosUsuario.Nombre === "") {
            return "Debes ingresar el nombre del usuario.";
        }

        if (DatosUsuario.Apellido === "") {
            return "Debes ingresar el apellido del usuario.";
        }

        if (DatosUsuario.Correo === "") {
            return "Debes ingresar el correo electrónico.";
        }

        if (!EsCorreoValido(DatosUsuario.Correo)) {
            return "Debes ingresar un correo válido.";
        }

        if (DatosUsuario.Rol === "") {
            return "Debes seleccionar un rol.";
        }

        if (DatosUsuario.EstadoUsuario === "") {
            return "Debes seleccionar un estado.";
        }

        if (!EsEdicion && DatosUsuario.Contrasena === "") {
            return "Debes ingresar una contraseña para crear el usuario.";
        }

        if (DatosUsuario.Contrasena !== "" && DatosUsuario.Contrasena.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres.";
        }

        if (DatosUsuario.Contrasena !== "" || DatosUsuario.ConfirmarContrasena !== "") {
            if (DatosUsuario.Contrasena !== DatosUsuario.ConfirmarContrasena) {
                return "Las contraseñas no coinciden.";
            }
        }

        return "";
    }

    function EsCorreoValido(Correo) {
        const PatronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return PatronCorreo.test(Correo);
    }

    function ObtenerTextoBotonEstado(EstadoUsuario) {
        if (EstadoUsuario === "ACTIVO") {
            return "Bloquear";
        }

        if (EstadoUsuario === "BLOQUEADO") {
            return "Activar";
        }

        if (EstadoUsuario === "INACTIVO") {
            return "Activar";
        }

        return "Cambiar estado";
    }

    function ObtenerSiguienteEstado(EstadoActual) {
        if (EstadoActual === "ACTIVO") {
            return "BLOQUEADO";
        }

        if (EstadoActual === "BLOQUEADO") {
            return "ACTIVO";
        }

        if (EstadoActual === "INACTIVO") {
            return "ACTIVO";
        }

        return "";
    }

    function MostrarFilaCarga(Texto) {
        if (!CuerpoTablaUsuarios) {
            return;
        }

        CuerpoTablaUsuarios.innerHTML = `
            <tr>
                <td colspan="7">${EscapeHtml(Texto)}</td>
            </tr>
        `;
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

    function CambiarEstadoBoton(Boton, Deshabilitado, Texto) {
        if (!Boton) {
            return;
        }

        Boton.disabled = Deshabilitado;
        Boton.textContent = Texto;
    }

    function FormatearFechaHora(ValorFechaHora) {
        if (!ValorFechaHora) {
            return "No disponible";
        }

        const Fecha = new Date(String(ValorFechaHora).replace(" ", "T"));

        if (Number.isNaN(Fecha.getTime())) {
            return ValorFechaHora;
        }

        return Fecha.toLocaleString("es-CR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function EscapeHtml(Valor) {
        const Texto = String(Valor ?? "");

        return Texto
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});