"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fechaCorta, panelFetch, TIPOS_PREVENTIVO, whatsappA,
  type Paginado, type Preventivo, type Resumen, type SolicitudCita,
} from "@/lib/clinica";
import { useSesion } from "@/components/panel/SesionContext";
import { Aviso, Cargando, Encabezado, Etiqueta, Tarjeta } from "@/components/panel/ui";

function estadoVencimiento(dias: number | null) {
  if (dias === null) return <Etiqueta>Sin fecha</Etiqueta>;
  if (dias < 0) return <Etiqueta color="rojo">Vencida hace {-dias} {dias === -1 ? "día" : "días"}</Etiqueta>;
  if (dias === 0) return <Etiqueta color="rojo">Vence hoy</Etiqueta>;
  if (dias <= 7) return <Etiqueta color="ambar">En {dias} {dias === 1 ? "día" : "días"}</Etiqueta>;
  return <Etiqueta color="azul">En {dias} días</Etiqueta>;
}

export default function TableroPage() {
  const yo = useSesion();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [vencimientos, setVencimientos] = useState<Preventivo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      panelFetch<Resumen>("clinica/resumen"),
      panelFetch<Preventivo[]>("clinica/preventivos/vencimientos", { query: { dias: "30" } }),
      panelFetch<Paginado<SolicitudCita>>("clinica/solicitudes-cita", { query: { estado: "PENDIENTE" } }),
    ])
      .then(([r, v, s]) => {
        setResumen(r);
        setVencimientos(v);
        setSolicitudes(s.results);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Aviso>{error}</Aviso>;
  if (!resumen) return <Cargando />;

  const tarjetas = [
    { valor: resumen.pacientes, texto: "Pacientes activos", icono: "🐾", href: "/panel/pacientes" },
    { valor: resumen.solicitudes_pendientes, texto: "Citas por confirmar", icono: "📅", href: "/panel/citas" },
    { valor: resumen.vencen_30_dias, texto: "Vacunas por vencer (30 días)", icono: "💉", href: "#vencimientos" },
    ...(yo.rol === "veterinario"
      ? [{ valor: resumen.consultas_abiertas ?? 0, texto: "Consultas sin firmar", icono: "📝", href: "/panel/pacientes" }]
      : [{ valor: resumen.tutores, texto: "Tutores registrados", icono: "👤", href: "/panel/pacientes" }]),
  ];

  return (
    <>
      <Encabezado titulo={`Hola, ${yo.nombre.split(" ")[0]} 👋`} subtitulo="Esto es lo que necesita atención hoy." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.texto} href={t.href}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-2xl">{t.icono}</span>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">{t.valor}</p>
            <p className="text-sm text-black/55">{t.texto}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta titulo={<span id="vencimientos">💉 Vacunas y desparasitaciones por vencer</span>}>
          {vencimientos.length === 0 ? (
            <p className="text-sm text-black/45">Nada vence en los próximos 30 días. 🎉</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {vencimientos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/panel/pacientes/${v.paciente}`} className="font-semibold hover:text-brand">
                      {v.paciente_nombre}
                    </Link>
                    <p className="text-xs text-black/50">
                      {TIPOS_PREVENTIVO[v.tipo]}: {v.producto} · {fechaCorta(v.proxima_dosis)} · {v.tutor_nombre}
                    </p>
                  </div>
                  {estadoVencimiento(v.dias_para_vencer)}
                  <a
                    href={whatsappA(v.tutor_telefono,
                      `Hola ${v.tutor_nombre} 👋, te escribimos de la clínica PataVida. ` +
                      `A ${v.paciente_nombre} le corresponde ${v.producto} el ${fechaCorta(v.proxima_dosis)}. ` +
                      `¿Te agendamos la cita? 🐾`)}
                    target="_blank" rel="noopener noreferrer"
                    className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#20bd5a]"
                  >
                    Recordar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="📅 Solicitudes de cita pendientes"
          accion={<Link href="/panel/citas" className="text-sm font-semibold text-brand-dark hover:underline">Ver todas</Link>}>
          {solicitudes.length === 0 ? (
            <p className="text-sm text-black/45">No hay solicitudes nuevas.</p>
          ) : (
            <ul className="space-y-3">
              {solicitudes.slice(0, 5).map((s) => (
                <li key={s.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-semibold">{s.nombre_mascota} · {s.nombre_tutor}</p>
                  <p className="text-xs text-black/50">Prefiere el {fechaCorta(s.fecha_preferida)} · {s.telefono}</p>
                  {s.motivo && <p className="mt-1 text-xs text-black/60">“{s.motivo}”</p>}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
