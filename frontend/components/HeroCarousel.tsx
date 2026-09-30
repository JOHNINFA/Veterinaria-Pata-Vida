"use client";

// CARRUSEL DEL HERO
// - 3 banners que cambian solos cada 5 segundos con transición suave (fade)
// - Flechas + puntitos para navegar manualmente
// - Responsive: alto y tipografía se adaptan a celular / tablet / pantallas grandes

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DURACION = 5000; // 5 segundos por banner

const SLIDES = [
  {
    img: "/banners/banner1.jpg",
    alt: "Perro Golden Retriever junto a un tazón de alimento premium",
    posicion: "object-[72%_center] md:object-[center_10%]",
    etiqueta: "🥇 Alimento premium",
    titulo: "Nutrición que se nota",
    resalte: "en cada paso",
    texto: "Croquetas y alimento balanceado de las mejores marcas para todas las etapas de tu mascota.",
    cta: { label: "Ver alimentos", href: "/productos?categoria=perros" },
  },
  {
    img: "/banners/banner2.jpg",
    alt: "Veterinaria profesional sosteniendo un gato en consultorio",
    posicion: "object-[72%_center] md:object-[center_10%]",
    etiqueta: "🩺 Servicios veterinarios",
    titulo: "Cuidamos su salud",
    resalte: "como familia",
    texto: "Consultas, vacunación, desparasitación y peluquería con veterinarios certificados.",
    cta: { label: "Agendar cita", href: "/veterinaria#cita" },
  },
  {
    img: "/banners/banner3.jpg",
    alt: "Cachorro beagle jugando rodeado de accesorios y juguetes",
    posicion: "object-[72%_center] md:object-center",
    etiqueta: "🎾 Accesorios y juguetes",
    titulo: "Más juego,",
    resalte: "más felicidad",
    texto: "Camas, collares, comederos y juguetes que hacen feliz a tu mejor amigo.",
    cta: { label: "Ver accesorios", href: "/productos?categoria=accesorios" },
  },
];

export default function HeroCarousel() {
  const [actual, setActual] = useState(0);

  const siguiente = useCallback(() => {
    setActual((i) => (i + 1) % SLIDES.length);
  }, []);

  const anterior = useCallback(() => {
    setActual((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Cambio automático cada 5s, incluso si el cursor está sobre el banner.
  useEffect(() => {
    const t = setInterval(siguiente, DURACION);
    return () => clearInterval(t); // limpiamos el temporizador al desmontar
  }, [siguiente]);

  // Navegación con teclado (accesibilidad)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [siguiente, anterior]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      className="relative w-full overflow-hidden bg-brand-dark
                 h-[420px] sm:h-[460px] md:h-[520px] lg:h-[560px] xl:h-[620px]"
    >
      {/* --- Slides apilados: solo el activo es visible (fade) --- */}
      {SLIDES.map((s, i) => (
        <div
          key={s.img}
          aria-hidden={i !== actual}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === actual ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Cada slide ajusta su punto focal para evitar recortes importantes. */}
          <Image
            src={s.img}
            alt={s.alt}
            fill
            loading="eager"
            sizes="100vw"
            className={`object-cover ${s.posicion}`}
          />

          {/* Degradado para que el texto siempre se lea sobre la foto */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent md:from-black/65 md:via-black/25" />
        </div>
      ))}

      {/* --- Contenido de texto (encima de la imagen) --- */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-5 sm:px-8 2xl:max-w-7xl">
        <div className="max-w-lg text-white lg:max-w-xl">
          {SLIDES.map((s, i) => (
            <div
              key={s.titulo}
              className={`transition-all duration-700 ${
                i === actual
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none absolute translate-y-4 opacity-0"
              }`}
            >
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-sm sm:text-sm">
                {s.etiqueta}
              </span>

              <h1 className="mt-3 text-3xl font-extrabold leading-tight drop-shadow-lg sm:text-4xl md:text-5xl xl:text-6xl">
                {s.titulo}{" "}
                <span className="text-accent">{s.resalte}</span>
              </h1>

              <p className="mt-3 max-w-md text-sm text-white/85 drop-shadow sm:text-base xl:text-lg">
                {s.texto}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={s.cta.href}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-95 sm:px-6 sm:py-3 sm:text-base"
                >
                  {s.cta.label}
                </Link>
                <Link
                  href="/productos"
                  className="rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/10 sm:px-6 sm:py-3 sm:text-base"
                >
                  Ver toda la tienda
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Flechas (ocultas en celular para no estorbar) --- */}
      <button
        onClick={anterior}
        aria-label="Banner anterior"
        className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/35 md:flex"
      >
        ‹
      </button>
      <button
        onClick={siguiente}
        aria-label="Banner siguiente"
        className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/35 md:flex"
      >
        ›
      </button>

      {/* --- Indicadores (puntitos) --- */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.img}
            onClick={() => setActual(i)}
            aria-label={`Ir al banner ${i + 1}`}
            aria-current={i === actual}
            className={`h-2 rounded-full transition-all ${
              i === actual ? "w-7 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
