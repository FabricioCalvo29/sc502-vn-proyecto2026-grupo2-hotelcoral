document.addEventListener("DOMContentLoaded", () => {
    InicializarDesplazamientoHero();
    InicializarCarruselComentarios();
    InicializarFormularioSuscripcion();
    InicializarBotonesHabitaciones();
});

function InicializarDesplazamientoHero() {
    const BotonExplorarHabitaciones = document.getElementById("BotonExplorarHabitaciones");

    if (!BotonExplorarHabitaciones) return;

    BotonExplorarHabitaciones.addEventListener("click", () => {
        const SeccionHabitaciones = document.getElementById("Habitaciones");

        if (SeccionHabitaciones) {
            SeccionHabitaciones.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

function InicializarCarruselComentarios() {
    const CarruselComentarios = document.getElementById("CarruselComentarios");
    const BotonComentarioAnterior = document.getElementById("BotonComentarioAnterior");
    const BotonComentarioSiguiente = document.getElementById("BotonComentarioSiguiente");

    if (!CarruselComentarios || !BotonComentarioAnterior || !BotonComentarioSiguiente) return;

    const DistanciaScroll = 380;

    BotonComentarioAnterior.addEventListener("click", () => {
        CarruselComentarios.scrollBy({
            left: -DistanciaScroll,
            behavior: "smooth"
        });
    });

    BotonComentarioSiguiente.addEventListener("click", () => {
        CarruselComentarios.scrollBy({
            left: DistanciaScroll,
            behavior: "smooth"
        });
    });
}



function InicializarBotonesHabitaciones() {
    const BotonesDetalles = document.querySelectorAll('[data-accion="VerDetallesHabitacion"]');

    BotonesDetalles.forEach((Boton) => {
        Boton.addEventListener("click", () => {
            const TarjetaHabitacion = Boton.closest(".TarjetaHabitacion");
            const IdHabitacion = TarjetaHabitacion?.dataset.idHabitacion || "SinId";
            const Categoria = TarjetaHabitacion?.dataset.categoria || "SinCategoria";

            console.log("Habitación seleccionada:", {
                IdHabitacion,
                Categoria
            });

        });
    });
}

