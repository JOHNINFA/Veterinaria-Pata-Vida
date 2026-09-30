"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fechaHora, panelFetch, PRONOSTICOS, TIPOS_CONSULTA, VIAS, type Consulta,
} from "@/lib/clinica";
import ConsultaForm from "@/components/panel/ConsultaForm";
import { Aviso, Cargando, claseBoton, claseBotonSecundario, Etiqueta, Tarjeta } from "@/components/panel/ui";

export default function ConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [firmando, setFirmando] = useState(false);

  const cargar = useCallback(() => {
    panelFetch<Consulta>(`clinica/consultas/${id}`).then(setConsulta).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function firmar() {
    if (!confirm("Al firmar, la consulta queda en SOLO LECTURA y no se podrá modificar. ¿Continuar?")) return;
    setError("");
    setFirmando(true);
    try {
      setConsulta(await panelFetch<Consulta>(`clinica/consultas/${id}/cerrar`, { method: "POST" }));
      setAviso("Consulta firmada. Ya puedes imprimir la fórmula.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFirmando(false);
    }
  }

  if (!consulta) return error ? <Aviso>{error}</Aviso> : <Cargando />;

  return (
    <>
      <Link href={`/panel/pacientes/${consulta.paciente}`} className="text-sm text-brand-dark hover:underline">
        ← {consulta.paciente_nombre}
      </Link>
      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Consulta · {consulta.paciente_nombre}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-black/55">
            {fechaHora(consulta.fecha)} · <Etiqueta color="azul">{TIPOS_CONSULTA[consulta.tipo]}</Etiqueta>
            {consulta.cerrada ? <Etiqueta color="verde">✓ Firmada</Etiqueta> : <Etiqueta color="ambar">Borrador</Etiqueta>}
          </p>
        </div>
        {consulta.cerrada ? (
          <Link href={`/panel/consultas/${consulta.id}/formula`} className={claseBoton}>🖨️ Imprimir fórmula</Link>
        ) : (
          <button onClick={firmar} disabled={firmando} className={claseBoton}>
            {firmando ? "Firmando..." : "✍️ Cerrar y firmar"}
          </button>
        )}
      </div>

      {aviso && <div className="mb-5"><Aviso tipo="ok">{aviso}</Aviso></div>}
      {error && <div className="mb-5"><Aviso>{error}</Aviso></div>}

      {!consulta.cerrada ? (
        <ConsultaForm key={consulta.id} pacienteId={consulta.paciente} inicial={consulta}
          alGuardar={(c) => { setConsulta(c); setAviso("Borrador guardado."); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      ) : (
        <VistaFirmada consulta={consulta} />
      )}
    </>
  );
}

function Seccion({ titulo, texto }: { titulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-black/45">{titulo}</h3>
      <p className="mt-1 whitespace-pre-line text-sm">{texto}</p>
    </div>
  );
}

function VistaFirmada({ consulta: c }: { consulta: Consulta }) {
  const signos = [
    ["Peso", c.peso_kg && `${c.peso_kg} kg`], ["Temperatura", c.temperatura_c && `${c.temperatura_c} °C`],
    ["FC", c.frecuencia_cardiaca && `${c.frecuencia_cardiaca} lpm`], ["FR", c.frecuencia_respiratoria && `${c.frecuencia_respiratoria} rpm`],
    ["Mucosas", c.mucosas], ["TLLC", c.tllc_segundos && `${c.tllc_segundos} s`],
    ["Deshidratación", c.hidratacion_pct !== null ? `${c.hidratacion_pct} %` : ""], ["Cond. corporal", c.condicion_corporal && `${c.condicion_corporal}/9`],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-6">
      <Aviso tipo="info">
        🔒 Documento firmado por <strong>{c.veterinario_nombre}</strong> (matrícula {c.veterinario_matricula || "—"}) el{" "}
        {fechaHora(c.cerrada_en)}. No se puede modificar.
      </Aviso>
      <Tarjeta titulo="S · Subjetivo"><div className="space-y-3">
        <Seccion titulo="Motivo" texto={c.motivo} /><Seccion titulo="Anamnesis" texto={c.anamnesis} />
      </div></Tarjeta>
      <Tarjeta titulo="O · Objetivo">
        {signos.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {signos.map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-black/45">{k}</p><p className="font-semibold">{v}</p>
              </div>
            ))}
          </div>
        )}
        <Seccion titulo="Examen físico" texto={c.examen_fisico} />
      </Tarjeta>
      <Tarjeta titulo="A · Análisis"><Seccion titulo="Diagnóstico" texto={c.diagnostico} /></Tarjeta>
      <Tarjeta titulo="P · Plan">
        <div className="space-y-3">
          <Seccion titulo="Plan terapéutico" texto={c.plan} />
          {c.pronostico && <Seccion titulo="Pronóstico" texto={PRONOSTICOS[c.pronostico]} />}
        </div>
        {c.prescripciones.length > 0 && (
          <table className="mt-5 w-full text-left text-sm">
            <thead className="text-xs uppercase text-black/45">
              <tr><th className="py-2">Medicamento</th><th>Vía</th><th>Dosis</th><th>Frecuencia</th><th>Días</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {c.prescripciones.map((m) => (
                <tr key={m.id}>
                  <td className="py-2"><span className="font-semibold">{m.medicamento}</span>
                    {m.principio_activo && <span className="block text-xs text-black/45">{m.principio_activo}</span>}</td>
                  <td>{VIAS[m.via]}</td><td>{m.dosis}</td><td>{m.frecuencia}</td><td>{m.duracion_dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
      <Link href={`/panel/pacientes/${c.paciente}`} className={claseBotonSecundario}>Volver a la historia</Link>
    </div>
  );
}
