import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quiénes somos | PataVida",
  description:
    "Conoce el propósito de PataVida: bienestar, prevención y productos seleccionados para cada mascota.",
};

export default function QuienesSomosPage() {
  return (
    <>
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1fr_1.05fr] md:py-16">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-brand">Quiénes somos</span>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
              Bienestar para cada etapa de su vida
            </h1>
            <p className="mt-5 max-w-xl leading-relaxed text-black/60">
              PataVida reúne alimentación, accesorios y atención veterinaria en un solo lugar. Seleccionamos cada producto pensando en la salud, comodidad y felicidad de perros y gatos.
            </p>
            <Link href="/productos" className="mt-7 inline-block rounded-full bg-accent px-6 py-3 font-bold text-black transition hover:brightness-95">
              Conocer el catálogo
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/categorias/veterinaria.jpg"
              alt="Veterinaria de PataVida atendiendo a una mascota"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            ["🩺", "Cuidado responsable", "Promovemos la prevención y el acompañamiento veterinario oportuno."],
            ["✓", "Selección consciente", "Elegimos productos útiles, durables y adecuados para cada necesidad."],
            ["💚", "Atención cercana", "Escuchamos a cada familia para ayudarle a elegir con confianza."],
          ].map(([icono, titulo, texto]) => (
            <div key={titulo} className="border-t-2 border-brand pt-5">
              <span className="text-3xl" aria-hidden="true">{icono}</span>
              <h2 className="mt-3 text-lg font-bold">{titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/55">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Estamos para ayudarte</h2>
            <p className="mt-1 text-white/70">Cuéntanos qué necesita tu mascota.</p>
          </div>
          <Link href="/contacto" className="rounded-full bg-accent px-6 py-3 font-bold text-black">
            Hablar con PataVida
          </Link>
        </div>
      </section>
    </>
  );
}
