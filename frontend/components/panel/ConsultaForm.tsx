"use client";

// Formulario de consulta con estructura SOAP:
//   S = Subjetivo (motivo y anamnesis)
//   O = Objetivo (signos vitales y examen físico)
//   A = Análisis (diagnóstico)
//   P = Plan (tratamiento, pronóstico y fórmula)
import { useState } from "react";
import {
  panelFetch, PRONOSTICOS, TIPOS_CONSULTA, VIAS, type Consulta, type Prescripcion,
} from "@/lib/clinica";
import { Aviso, Campo, claseBoton, claseBotonSecundario, claseInput, Tarjeta } from "@/components/panel/ui";

const NUMERICOS = ["peso_kg", "temperatura_c", "frecuencia_cardiaca", "frecuencia_respiratoria",
  "tllc_segundos", "hidratacion_pct", "condicion_corporal"] as const;

const lineaVacia: Prescripcion = {
  medicamento: "", principio_activo: "", via: "ORAL", dosis: "", frecuencia: "", duracion_dias: "", indicaciones: "",
};

type Datos = Record<string, string>;

function aFormulario(c?: Consulta): Datos {
  const campos = ["tipo", "motivo", "anamnesis", "mucosas", "examen_fisico", "diagnostico", "plan", "pronostico",
    ...NUMERICOS];
  const d: Datos = {};
  for (const k of campos) {
    const v = c ? (c as unknown as Record<string, unknown>)[k] : undefined;
    d[k] = v === null || v === undefined ? "" : String(v);
  }
  if (!c) d.tipo = "PRIMERA";
  return d;
}

export default function ConsultaForm({ pacienteId, inicial, citaId, alGuardar }: {
  pacienteId: number; inicial?: Consulta; citaId?: number; alGuardar: (c: Consulta) => void;
}) {
  const [datos, setDatos] = useState<Datos>(() => aFormulario(inicial));
  const [lineas, setLineas] = useState<Prescripcion[]>(inicial?.prescripciones ?? []);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const c = (k: string) => ({
    value: datos[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDatos({ ...datos, [k]: e.target.value }),
  });

  function cambiarLinea(i: number, campo: keyof Prescripcion, valor: string) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    // Los campos numéricos vacíos se envían como null (no como texto vacío).
    const cuerpo: Record<string, unknown> = { ...datos, paciente: pacienteId };
    if (!inicial && citaId) cuerpo.cita = citaId; // la consulta queda ligada a la cita de la agenda
    for (const k of NUMERICOS) cuerpo[k] = datos[k] === "" ? null : datos[k];
    cuerpo.prescripciones = lineas
      .filter((l) => l.medicamento.trim())
      .map((l) => ({ ...l, duracion_dias: Number(l.duracion_dias) || 1 }));
    try {
      const guardada = inicial
        ? await panelFetch<Consulta>(`clinica/consultas/${inicial.id}`, { method: "PATCH", body: cuerpo })
        : await panelFetch<Consulta>("clinica/consultas", { method: "POST", body: cuerpo });
      alGuardar(guardada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <Tarjeta titulo="S · Subjetivo">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Tipo de consulta">
            <select className={claseInput} {...c("tipo")}>
              {Object.entries(TIPOS_CONSULTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Motivo de consulta" className="sm:col-span-2">
            <input className={claseInput} required {...c("motivo")} />
          </Campo>
          <Campo label="Anamnesis" className="sm:col-span-3" ayuda="Lo que refiere el tutor: síntomas, desde cuándo, alimentación...">
            <textarea rows={3} className={claseInput} {...c("anamnesis")} />
          </Campo>
        </div>
      </Tarjeta>

      <Tarjeta titulo="O · Objetivo (signos vitales y examen físico)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Campo label="Peso (kg)"><input type="number" step="0.01" min="0" className={claseInput} {...c("peso_kg")} /></Campo>
          <Campo label="Temperatura (°C)"><input type="number" step="0.1" min="30" max="45" className={claseInput} {...c("temperatura_c")} /></Campo>
          <Campo label="Frec. cardiaca (lpm)"><input type="number" min="0" className={claseInput} {...c("frecuencia_cardiaca")} /></Campo>
          <Campo label="Frec. respiratoria (rpm)"><input type="number" min="0" className={claseInput} {...c("frecuencia_respiratoria")} /></Campo>
          <Campo label="Mucosas"><input className={claseInput} placeholder="Rosadas, húmedas" {...c("mucosas")} /></Campo>
          <Campo label="TLLC (seg)" ayuda="Llenado capilar"><input type="number" step="0.1" min="0" className={claseInput} {...c("tllc_segundos")} /></Campo>
          <Campo label="Deshidratación (%)"><input type="number" min="0" max="15" className={claseInput} {...c("hidratacion_pct")} /></Campo>
          <Campo label="Condición corporal" ayuda="Escala 1 a 9"><input type="number" min="1" max="9" className={claseInput} {...c("condicion_corporal")} /></Campo>
          <Campo label="Examen físico" className="col-span-2 sm:col-span-4">
            <textarea rows={3} className={claseInput} {...c("examen_fisico")} />
          </Campo>
        </div>
      </Tarjeta>

      <Tarjeta titulo="A · Análisis">
        <Campo label="Diagnóstico" ayuda="Presuntivo o definitivo. Es obligatorio para firmar la consulta.">
          <textarea rows={2} className={claseInput} {...c("diagnostico")} />
        </Campo>
      </Tarjeta>

      <Tarjeta titulo="P · Plan">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Plan terapéutico" className="sm:col-span-2"><textarea rows={3} className={claseInput} {...c("plan")} /></Campo>
          <Campo label="Pronóstico">
            <select className={claseInput} {...c("pronostico")}>
              <option value="">—</option>
              {Object.entries(PRONOSTICOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold">💊 Fórmula médica</h3>
        <div className="space-y-3">
          {lineas.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-6">
              <Campo label="Medicamento" className="col-span-2">
                <input className={claseInput} required value={l.medicamento} onChange={(e) => cambiarLinea(i, "medicamento", e.target.value)} />
              </Campo>
              <Campo label="Principio activo" className="col-span-2">
                <input className={claseInput} value={l.principio_activo} onChange={(e) => cambiarLinea(i, "principio_activo", e.target.value)} />
              </Campo>
              <Campo label="Vía">
                <select className={claseInput} value={l.via} onChange={(e) => cambiarLinea(i, "via", e.target.value)}>
                  {Object.entries(VIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Campo>
              <Campo label="Días">
                <input type="number" min="1" className={claseInput} required value={l.duracion_dias}
                  onChange={(e) => cambiarLinea(i, "duracion_dias", e.target.value)} />
              </Campo>
              <Campo label="Dosis" className="col-span-1 sm:col-span-2">
                <input className={claseInput} required placeholder="10 mg/kg" value={l.dosis} onChange={(e) => cambiarLinea(i, "dosis", e.target.value)} />
              </Campo>
              <Campo label="Frecuencia" className="col-span-1 sm:col-span-2">
                <input className={claseInput} required placeholder="cada 12 horas" value={l.frecuencia} onChange={(e) => cambiarLinea(i, "frecuencia", e.target.value)} />
              </Campo>
              <div className="col-span-2 flex items-end gap-2 sm:col-span-2">
                <Campo label="Indicaciones" className="flex-1">
                  <input className={claseInput} value={l.indicaciones} onChange={(e) => cambiarLinea(i, "indicaciones", e.target.value)} />
                </Campo>
                <button type="button" onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))}
                  className="mb-1 rounded-lg px-2 py-2 text-red-500 hover:bg-red-50" aria-label="Quitar medicamento">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLineas([...lineas, { ...lineaVacia }])} className={`${claseBotonSecundario} mt-3`}>
          + Agregar medicamento
        </button>
      </Tarjeta>

      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={guardando} className={claseBoton}>
        {guardando ? "Guardando..." : "💾 Guardar borrador"}
      </button>
    </form>
  );
}
