"use client";

// Fórmula médica imprimible. Solo existe para consultas FIRMADAS
// (Ley 576 de 2000, art. 60: la prescripción la emite el veterinario, por escrito).
import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ESPECIES, fechaHora, panelFetch, SEXOS, textoFormula, VIAS, whatsappA, type Consulta, type HistoriaClinica,
} from "@/lib/clinica";
import { Aviso, Cargando, claseBoton, claseBotonSecundario } from "@/components/panel/ui";
import { LOCATION } from "@/lib/contact";

export default function FormulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [error, setError] = useState("");
  const [envio, setEnvio] = useState<{ tipo: "ok" | "error" | "info"; texto: string } | null>(null);

  useEffect(() => {
    panelFetch<Consulta>(`clinica/consultas/${id}`)
      .then(async (c) => {
        setConsulta(c);
        setHistoria(await panelFetch<HistoriaClinica>(`clinica/pacientes/${c.paciente}/historia`));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Aviso>{error}</Aviso>;
  if (!consulta || !historia) return <Cargando />;
  if (!consulta.cerrada) return <Aviso>La fórmula solo se imprime cuando la consulta está firmada.</Aviso>;

  const p = historia;

  async function enviarCorreo() {
    setEnvio({ tipo: "info", texto: "Enviando..." });
    try {
      const r = await panelFetch<{ enviado_a: string }>(`clinica/consultas/${id}/enviar-formula`, { method: "POST" });
      setEnvio({ tipo: "ok", texto: `Fórmula enviada a ${r.enviado_a}.` });
    } catch (e) {
      setEnvio({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo enviar." });
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-3 print:hidden">
        <button onClick={() => window.print()} className={claseBoton}>🖨️ Imprimir / Guardar PDF</button>
        <a href={whatsappA(p.tutor.telefono, textoFormula(consulta, p))} target="_blank" rel="noopener noreferrer"
          className={`${claseBotonSecundario} border-green-300 text-green-700 hover:bg-green-50`}>
          💬 Enviar por WhatsApp
        </a>
        <button onClick={enviarCorreo} disabled={!p.tutor.email || envio?.tipo === "info"} className={claseBotonSecundario}
          title={p.tutor.email ? `Se envía a ${p.tutor.email}` : "El tutor no tiene correo registrado"}>
          ✉️ {p.tutor.email ? "Enviar por correo" : "Sin correo registrado"}
        </button>
        <Link href={`/panel/consultas/${consulta.id}`} className={claseBotonSecundario}>Volver</Link>
      </div>
      {envio && <div className="mb-5 print:hidden"><Aviso tipo={envio.tipo}>{envio.texto}</Aviso></div>}

      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-brand pb-4">
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">🐾 PataVida · Clínica Veterinaria</p>
            <p className="text-sm text-black/55">{LOCATION}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">FÓRMULA MÉDICA VETERINARIA</p>
            <p className="text-black/55">Historia {p.numero_historia}</p>
            <p className="text-black/55">{fechaHora(consulta.fecha)}</p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-black/45">Paciente</p>
            <p className="font-semibold">{p.nombre}</p>
            <p>{ESPECIES[p.especie]} · {p.raza || "Sin raza"} · {SEXOS[p.sexo]}{p.edad && ` · ${p.edad}`}</p>
            {consulta.peso_kg && <p>Peso: {consulta.peso_kg} kg</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-black/45">Tutor</p>
            <p className="font-semibold">{p.tutor.nombres} {p.tutor.apellidos}</p>
            <p>{p.tutor.tipo_documento} {p.tutor.numero_documento}</p>
            <p>{p.tutor.telefono}</p>
          </div>
        </section>

        {p.alergias && <p className="mt-4 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700">⚠ Alergias: {p.alergias}</p>}

        <section className="mt-5 text-sm">
          <p className="text-xs font-bold uppercase text-black/45">Diagnóstico</p>
          <p>{consulta.diagnostico}</p>
        </section>

        <section className="mt-6">
          <p className="mb-2 text-lg font-extrabold">℞</p>
          {consulta.prescripciones.length === 0 ? (
            <p className="text-sm text-black/55">Sin medicamentos formulados.</p>
          ) : (
            <ol className="space-y-4">
              {consulta.prescripciones.map((m, i) => (
                <li key={m.id} className="text-sm">
                  <p className="font-bold">{i + 1}. {m.medicamento}{m.principio_activo && ` (${m.principio_activo})`}</p>
                  <p>Vía {VIAS[m.via].toLowerCase()} · {m.dosis} · {m.frecuencia} · durante {m.duracion_dias} {m.duracion_dias === 1 ? "día" : "días"}</p>
                  {m.indicaciones && <p className="text-black/60">Indicaciones: {m.indicaciones}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        {consulta.plan && (
          <section className="mt-6 text-sm">
            <p className="text-xs font-bold uppercase text-black/45">Recomendaciones</p>
            <p className="whitespace-pre-line">{consulta.plan}</p>
          </section>
        )}

        <footer className="mt-14 flex items-end justify-between text-sm">
          <div className="text-xs text-black/45">
            Documento firmado electrónicamente el {fechaHora(consulta.cerrada_en)}.<br />
            Demo de portafolio · datos ficticios.
          </div>
          <div className="w-64 border-t border-black pt-2 text-center">
            <p className="font-semibold">{consulta.veterinario_nombre}</p>
            <p className="text-black/55">Médico veterinario · Mat. {consulta.veterinario_matricula || "—"}</p>
          </div>
        </footer>
      </article>
    </>
  );
}
