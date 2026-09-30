"use client";

import { useEffect, useState } from "react";
import {
  ESPECIES, fechaCorta, fechaHora, panelFetch, whatsappA, type Paginado, type SolicitudCita,
} from "@/lib/clinica";
import { Aviso, Cargando, Encabezado, Etiqueta } from "@/components/panel/ui";

const PESTANAS = [
  { valor: "PENDIENTE", label: "Pendientes" },
  { valor: "CONFIRMADA", label: "Confirmadas" },
  { valor: "CANCELADA", label: "Canceladas" },
] as const;

export default function CitasPage() {
  const [estado, setEstado] = useState<SolicitudCita["estado"]>("PENDIENTE");
  const [lista, setLista] = useState<SolicitudCita[] | null>(null);
  const [error, setError] = useState("");

  const [recarga, setRecarga] = useState(0); // subirlo vuelve a pedir la lista

  useEffect(() => {
    let vigente = true; // evita pintar una respuesta vieja si cambiaste de pestaña
    panelFetch<Paginado<SolicitudCita>>("clinica/solicitudes-cita", { query: { estado } })
      .then((d) => vigente && setLista(d.results))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [estado, recarga]);

  async function cambiar(s: SolicitudCita, nuevo: SolicitudCita["estado"]) {
    try {
      await panelFetch(`clinica/solicitudes-cita/${s.id}`, { method: "PATCH", body: { estado: nuevo } });
      setRecarga((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <Encabezado titulo="Solicitudes de cita" subtitulo="Llegan desde el formulario público de la web." />
      <div className="mb-5 flex gap-2">
        {PESTANAS.map((p) => (
          <button key={p.valor} onClick={() => { setLista(null); setEstado(p.valor); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              estado === p.valor ? "bg-brand text-white" : "bg-white text-black/70 hover:bg-teal-50"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <Aviso>{error}</Aviso>}
      {!lista ? <Cargando /> : lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/45">No hay solicitudes en este estado.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lista.map((s) => (
            <div key={s.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{s.nombre_mascota} <span className="font-normal text-black/50">· {ESPECIES[s.especie]}</span></p>
                  <p className="text-sm text-black/60">{s.nombre_tutor} · {s.telefono}</p>
                </div>
                <Etiqueta color={s.estado === "PENDIENTE" ? "ambar" : s.estado === "CONFIRMADA" ? "verde" : "gris"}>
                  {fechaCorta(s.fecha_preferida)}
                </Etiqueta>
              </div>
              {s.motivo && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">“{s.motivo}”</p>}
              <p className="mt-2 text-xs text-black/40">Recibida {fechaHora(s.creado)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={whatsappA(s.telefono, `Hola ${s.nombre_tutor} 👋, te escribimos de la clínica PataVida sobre la cita de ${s.nombre_mascota} para el ${fechaCorta(s.fecha_preferida)}.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white hover:bg-[#20bd5a]">
                  💬 WhatsApp
                </a>
                {s.estado !== "CONFIRMADA" && (
                  <button onClick={() => cambiar(s, "CONFIRMADA")}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark">✓ Confirmar</button>
                )}
                {s.estado !== "CANCELADA" && (
                  <button onClick={() => cambiar(s, "CANCELADA")}
                    className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold hover:bg-gray-50">Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
