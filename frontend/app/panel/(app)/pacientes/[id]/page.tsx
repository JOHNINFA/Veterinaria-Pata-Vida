"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  EMOJI_ESPECIE, ESPECIES, fechaCorta, fechaHora, panelFetch, SEXOS, TIPOS_CONSULTA, TIPOS_PREVENTIVO,
  type Consulta, type HistoriaClinica, type Paciente, type Paginado, type Preventivo,
} from "@/lib/clinica";
import { useSesion } from "@/components/panel/SesionContext";
import {
  Aviso, Campo, Cargando, claseBoton, claseBotonSecundario, claseInput, Etiqueta, Tarjeta,
} from "@/components/panel/ui";

type Evento =
  | { clase: "consulta"; fecha: string; dato: Consulta }
  | { clase: "preventivo"; fecha: string; dato: Preventivo };

export default function FichaPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const yo = useSesion();
  const esVet = yo.rol === "veterinario";

  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [basico, setBasico] = useState<{ paciente: Paciente; preventivos: Preventivo[] } | null>(null);
  const [error, setError] = useState("");
  const [formVacuna, setFormVacuna] = useState(false);

  const [recarga, setRecarga] = useState(0); // subirlo vuelve a pedir la ficha

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        if (esVet) {
          // El veterinario ve la historia clínica completa.
          const h = await panelFetch<HistoriaClinica>(`clinica/pacientes/${id}/historia`);
          if (vigente) setHistoria(h);
        } else {
          // Recepción: datos del paciente y vacunas, pero NO las consultas (reserva, Ley 576).
          const [paciente, prev] = await Promise.all([
            panelFetch<Paciente>(`clinica/pacientes/${id}`),
            panelFetch<Paginado<Preventivo>>("clinica/preventivos", { query: { paciente: id } }),
          ]);
          if (vigente) setBasico({ paciente, preventivos: prev.results });
        }
      } catch (e) {
        if (vigente) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => { vigente = false; };
  }, [esVet, id, recarga]);

  if (error) return <Aviso>{error}</Aviso>;
  const p = historia ?? basico?.paciente;
  if (!p) return <Cargando />;

  const tutor = historia
    ? { nombre: `${historia.tutor.nombres} ${historia.tutor.apellidos}`, telefono: historia.tutor.telefono,
        documento: `${historia.tutor.tipo_documento} ${historia.tutor.numero_documento}`, email: historia.tutor.email }
    : { nombre: basico!.paciente.tutor_nombre, telefono: basico!.paciente.tutor_telefono, documento: "", email: "" };

  const preventivos = historia?.preventivos ?? basico?.preventivos ?? [];
  const eventos: Evento[] = [
    ...(historia?.consultas ?? []).map((c) => ({ clase: "consulta" as const, fecha: c.fecha, dato: c })),
    ...preventivos.map((v) => ({ clase: "preventivo" as const, fecha: `${v.aplicado_el}T12:00:00`, dato: v })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <Link href="/panel/pacientes" className="text-sm text-brand-dark hover:underline">← Pacientes</Link>

      {/* Cabecera del paciente */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
            {EMOJI_ESPECIE[p.especie]}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">
              {p.nombre} {p.fallecido && <Etiqueta>Fallecido</Etiqueta>}
            </h1>
            <p className="text-sm text-black/55">
              <span className="font-mono">{p.numero_historia}</span> · {ESPECIES[p.especie]} · {p.raza || "Sin raza"} ·{" "}
              {SEXOS[p.sexo]}{p.esterilizado ? " (esterilizado)" : ""}{p.edad && ` · ${p.edad}`}
            </p>
          </div>
        </div>
        {esVet && !p.fallecido && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFormVacuna((v) => !v)} className={claseBotonSecundario}>💉 Vacuna / desparasitación</button>
            <Link href={`/panel/consultas/nueva?paciente=${p.id}`} className={claseBoton}>+ Nueva consulta</Link>
          </div>
        )}
      </div>

      {p.alergias && (
        <div className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-700">
          ⚠️ ALERGIAS: {p.alergias}
        </div>
      )}

      {formVacuna && <FormPreventivo pacienteId={p.id} alGuardar={() => { setFormVacuna(false); setRecarga((n) => n + 1); }} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Columna izquierda: datos */}
        <div className="space-y-6">
          <Tarjeta titulo="Reseña">
            <dl className="space-y-2 text-sm">
              {[
                ["Nacimiento", fechaCorta(p.fecha_nacimiento)],
                ["Color", p.color || "—"],
                ["Microchip", p.microchip || "—"],
                ["Observaciones", p.observaciones || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-black/50">{k}</dt><dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
          <Tarjeta titulo="Tutor">
            <p className="font-semibold">{tutor.nombre}</p>
            {tutor.documento && <p className="text-sm text-black/55">{tutor.documento}</p>}
            <p className="text-sm text-black/55">📞 {tutor.telefono}</p>
            {tutor.email && <p className="text-sm text-black/55">✉️ {tutor.email}</p>}
          </Tarjeta>
        </div>

        {/* Columna derecha: historia clínica */}
        <Tarjeta titulo={esVet ? "Historia clínica" : "Vacunas y desparasitaciones"}>
          {!esVet && (
            <div className="mb-4">
              <Aviso tipo="info">
                🔒 Las consultas y diagnósticos son reservados al médico veterinario (Ley 576 de 2000, art. 61).
              </Aviso>
            </div>
          )}
          {eventos.length === 0 ? (
            <p className="text-sm text-black/45">Aún no hay registros.</p>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-teal-100 pl-6">
              {eventos.map((ev) => (
                <li key={`${ev.clase}-${ev.dato.id}`} className="relative">
                  <span className="absolute -left-[33px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs ring-2 ring-teal-200">
                    {ev.clase === "consulta" ? "🩺" : "💉"}
                  </span>
                  {ev.clase === "consulta" ? (
                    <Link href={`/panel/consultas/${ev.dato.id}`}
                      className="block rounded-xl border border-black/5 p-4 transition hover:border-brand/30 hover:bg-teal-50/40">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-black/45">{fechaHora(ev.dato.fecha)}</span>
                        <Etiqueta color="azul">{TIPOS_CONSULTA[ev.dato.tipo]}</Etiqueta>
                        {ev.dato.cerrada ? <Etiqueta color="verde">✓ Firmada</Etiqueta> : <Etiqueta color="ambar">Borrador</Etiqueta>}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{ev.dato.motivo}</p>
                      {ev.dato.diagnostico && <p className="mt-1 text-sm text-black/60">Dx: {ev.dato.diagnostico}</p>}
                      {ev.dato.prescripciones.length > 0 && (
                        <p className="mt-1 text-xs text-black/45">💊 {ev.dato.prescripciones.map((m) => m.medicamento).join(", ")}</p>
                      )}
                      <p className="mt-1 text-xs text-black/40">{ev.dato.veterinario_nombre}</p>
                    </Link>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-black/45">{fechaCorta(ev.dato.aplicado_el)}</span>
                        <Etiqueta>{TIPOS_PREVENTIVO[ev.dato.tipo]}</Etiqueta>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{ev.dato.producto}{ev.dato.lote && ` · lote ${ev.dato.lote}`}</p>
                      {ev.dato.proxima_dosis && (
                        <p className="text-xs text-black/50">Próxima dosis: {fechaCorta(ev.dato.proxima_dosis)}</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>
    </>
  );
}

function FormPreventivo({ pacienteId, alGuardar }: { pacienteId: number; alGuardar: () => void }) {
  const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
  const [datos, setDatos] = useState({ tipo: "VACUNA", producto: "", lote: "", aplicado_el: hoy, proxima_dosis: "" });
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await panelFetch("clinica/preventivos", {
        method: "POST",
        body: { ...datos, paciente: pacienteId, proxima_dosis: datos.proxima_dosis || null },
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }
  const c = (k: keyof typeof datos) => ({
    value: datos[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDatos({ ...datos, [k]: e.target.value }),
  });

  return (
    <form onSubmit={guardar} className="mt-5">
      <Tarjeta titulo="Registrar vacuna o desparasitación">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo label="Tipo">
            <select className={claseInput} {...c("tipo")}>
              {Object.entries(TIPOS_PREVENTIVO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Producto"><input className={claseInput} required {...c("producto")} /></Campo>
          <Campo label="Lote"><input className={claseInput} {...c("lote")} /></Campo>
          <Campo label="Aplicado el"><input type="date" className={claseInput} required {...c("aplicado_el")} /></Campo>
          <Campo label="Próxima dosis"><input type="date" className={claseInput} {...c("proxima_dosis")} /></Campo>
        </div>
        {error && <div className="mt-4"><Aviso>{error}</Aviso></div>}
        <button type="submit" className={`${claseBoton} mt-4`}>Guardar</button>
      </Tarjeta>
    </form>
  );
}
