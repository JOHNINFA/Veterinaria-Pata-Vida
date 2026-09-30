import type { Metadata } from "next";
import Link from "next/link";
import SolicitudCitaForm from "@/components/SolicitudCitaForm";
import VeterinarioFoto from "@/components/VeterinarioFoto";
import { getVeterinarios, type Veterinario } from "@/lib/api";

export const metadata: Metadata = {
  title: "Clínica veterinaria | PataVida",
  description: "Solicita una cita veterinaria para tu mascota en PataVida.",
};

const SERVICIOS = [
  ["🩺", "Consulta general", "Valoración integral y orientación para cuidar su salud."],
  ["💉", "Vacunación", "Esquemas de vacunación según la edad y necesidades de tu mascota."],
  ["🛡️", "Desparasitación", "Prevención y control responsable de parásitos internos y externos."],
  ["🛁", "Baño y peluquería", "Cuidado de piel y pelaje con un trato amable y profesional."],
  ["🩹", "Urgencias leves", "Atención inicial de situaciones que no comprometen la vida."],
];

export default async function VeterinariaPage() {
  let veterinarios: Veterinario[] = [];
  let apiDisponible = true;

  try {
    veterinarios = await getVeterinarios();
  } catch {
    apiDisponible = false;
  }

  return (
    <>
      <section className="bg-gradient-to-br from-brand-dark via-brand to-teal-600 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24 2xl:max-w-7xl">
          <div>
            <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">🩺 Cuidado cercano y profesional</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">Clínica veterinaria PataVida</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              Acompañamos cada etapa de la vida de tu mascota con atención cálida, prevención y un equipo que la trata como parte de la familia.
            </p>
            <a href="#cita" className="mt-7 inline-flex rounded-full bg-accent px-7 py-3 font-bold text-black transition hover:brightness-95">Solicitar una cita</a>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm"><div className="text-3xl">🐾</div><p className="mt-2 text-sm font-semibold">Atención con cariño</p></div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm"><div className="text-3xl">🌿</div><p className="mt-2 text-sm font-semibold">Enfoque preventivo</p></div>
            <div className="col-span-2 rounded-2xl bg-white/10 p-5 backdrop-blur-sm"><p className="font-bold">Lunes a sábado</p><p className="mt-1 text-sm text-white/75">8:00 a. m. – 7:00 p. m.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 2xl:max-w-7xl">
        <div className="mb-9 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">Nuestro equipo</span>
          <h2 className="mt-1 text-3xl font-extrabold">Tu mascota, en buenas manos</h2>
        </div>

        {!apiDisponible ? (
          <p className="rounded-2xl bg-amber-50 p-5 text-center text-sm text-amber-900">
            Estamos actualizando la información de nuestro equipo. Puedes solicitar tu cita normalmente y te atenderemos muy pronto. 🐾
          </p>
        ) : veterinarios.length === 0 ? (
          <p className="rounded-2xl bg-teal-50 p-5 text-center text-sm text-brand-dark">Pronto conocerás aquí a nuestro equipo veterinario.</p>
        ) : (
          <div className="space-y-8">
            {veterinarios.map((veterinario) => (
              <article key={veterinario.id} className="grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 md:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
                <VeterinarioFoto src={veterinario.foto} nombre={veterinario.nombre} />
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <span className="text-sm font-semibold uppercase tracking-wider text-brand">{veterinario.especialidad}</span>
                  <h3 className="mt-2 text-3xl font-extrabold">{veterinario.nombre}</h3>
                  <p className="mt-4 leading-relaxed text-black/65">{veterinario.bio}</p>
                  <p className="mt-5 inline-flex w-fit rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-brand-dark">Matrícula profesional: {veterinario.matricula}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 2xl:max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">Servicios veterinarios</span>
              <h2 className="mt-1 text-3xl font-extrabold">Bienestar en cada visita</h2>
            </div>
            <Link href="/productos?categoria=veterinaria" className="font-semibold text-brand hover:text-brand-dark">Ver precios →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS.map(([icono, titulo, descripcion]) => (
              <article key={titulo} className="rounded-2xl bg-background p-6 ring-1 ring-black/5">
                <div className="text-3xl" aria-hidden="true">{icono}</div>
                <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cita" className="scroll-mt-24 mx-auto max-w-4xl px-4 py-16 2xl:max-w-5xl">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">Agenda tu visita</span>
          <h2 className="mt-1 text-3xl font-extrabold">Solicita una cita</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-black/55">Cuéntanos cuándo prefieres venir. Nuestro equipo se comunicará contigo para confirmar la disponibilidad.</p>
        </div>
        <SolicitudCitaForm />
      </section>
    </>
  );
}
