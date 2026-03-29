document.addEventListener("DOMContentLoaded", async () => {
    await InicializarHeader();
});

async function InicializarHeader() {
    const EncabezadoCargado = await EsperarEncabezado();

    if (!EncabezadoCargado) {
        console.warn("No se encontró el encabezado cargado.");
        return;
    }

    ConfigurarMenuMovil();
    ConfigurarSubmenusMoviles();
    await ConfigurarAccionesSegunSesion();
}

function EsperarEncabezado() {
    return new Promise((resolve) => {
        let Intentos = 0;
        const MaximoIntentos = 100;

        const Intervalo = setInterval(() => {
            const Encabezado = document.querySelector(".EncabezadoPrincipal");
            const Navegacion = document.getElementById("NavegacionEncabezado");

            if (Encabezado && Navegacion) {
                clearInterval(Intervalo);
                resolve(true);
                return;
            }

            Intentos++;

            if (Intentos >= MaximoIntentos) {
                clearInterval(Intervalo);
                resolve(false);
            }
        }, 100);
    });
}

function ConfigurarMenuMovil() {
    const BotonMenuMovil = document.getElementById("BotonMenuMovil");
    const NavegacionEncabezado = document.getElementById("NavegacionEncabezado");

    if (!BotonMenuMovil || !NavegacionEncabezado) {
        return;
    }

    if (BotonMenuMovil.children.length === 0) {
        BotonMenuMovil.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
    }

    BotonMenuMovil.setAttribute("aria-expanded", "false");

    BotonMenuMovil.addEventListener("click", () => {
        NavegacionEncabezado.classList.toggle("MenuAbierto");

        const EstaAbierto = NavegacionEncabezado.classList.contains("MenuAbierto");

        BotonMenuMovil.setAttribute("aria-expanded", EstaAbierto ? "true" : "false");
        BotonMenuMovil.setAttribute("aria-label", EstaAbierto ? "Cerrar menú" : "Abrir menú");
    });
}

function ConfigurarSubmenusMoviles() {
    const ItemsConSubmenu = document.querySelectorAll(".ItemConSubmenu");

    if (!ItemsConSubmenu.length) {
        return;
    }

    ItemsConSubmenu.forEach((ItemActual) => {
        const EnlaceNavegacion = ItemActual.querySelector(".EnlaceNavegacion");

        if (!EnlaceNavegacion) {
            return;
        }

        EnlaceNavegacion.addEventListener("click", (Evento) => {
            if (window.innerWidth > 900) {
                return;
            }

            Evento.preventDefault();

            ItemsConSubmenu.forEach((OtroItem) => {
                if (OtroItem !== ItemActual) {
                    OtroItem.classList.remove("SubmenuAbierto");
                }
            });

            ItemActual.classList.toggle("SubmenuAbierto");
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            const NavegacionEncabezado = document.getElementById("NavegacionEncabezado");
            const BotonMenuMovil = document.getElementById("BotonMenuMovil");

            ItemsConSubmenu.forEach((Item) => {
                Item.classList.remove("SubmenuAbierto");
            });

            if (NavegacionEncabezado) {
                NavegacionEncabezado.classList.remove("MenuAbierto");
            }

            if (BotonMenuMovil) {
                BotonMenuMovil.setAttribute("aria-expanded", "false");
                BotonMenuMovil.setAttribute("aria-label", "Abrir menú");
            }
        }
    });
}

async function ConfigurarAccionesSegunSesion() {
    const EnlaceAdmin = document.getElementById("EnlaceAdmin");
    const BotonMiCuenta = document.getElementById("BotonMiCuenta");

    if (!EnlaceAdmin || !BotonMiCuenta) {
        return;
    }

    EnlaceAdmin.hidden = true;
    BotonMiCuenta.href = "AccesoCuenta.html";
    BotonMiCuenta.textContent = "Mi Cuenta";

    try {
        const Respuesta = await fetch("php/Auth/ValidarSesion.php", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const Resultado = await Respuesta.json();

        if (!Respuesta.ok || !Resultado.success || !Resultado.data || !Resultado.data.Usuario) {
            EnlaceAdmin.hidden = true;
            BotonMiCuenta.href = "AccesoCuenta.html";
            return;
        }

        const Usuario = Resultado.data.Usuario;
        const Rol = Usuario.ROL ?? "";

        BotonMiCuenta.href = "MiCuenta.html";
        BotonMiCuenta.textContent = "Mi Cuenta";

        if (Rol === "ADMIN") {
            EnlaceAdmin.hidden = false;
        } else {
            EnlaceAdmin.hidden = true;
        }
    } catch (Error) {
        console.error("No fue posible validar la sesión desde el header.", Error);
        EnlaceAdmin.hidden = true;
        BotonMiCuenta.href = "AccesoCuenta.html";
    }
}