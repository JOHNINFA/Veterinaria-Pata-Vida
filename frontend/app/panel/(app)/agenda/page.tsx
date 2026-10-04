"use client";

// Agenda del día: las citas confirmadas y en qué paso va cada una.
//   ① Paciente registrado → ② Consulta firmada → ③ Cobro pagado
// El botón de cada tarjeta lleva al siguiente paso.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EMOJI_ESPECIE, ESPECIES, ESTADOS_COBRO, panelFetch, pesos, whatsappA, type Paginado, type SolicitudCita,
} from "@/lib/clinica";
import { useSesion } from "@/components/panel/SesionContext";
import { Aviso, Cargando, claseBoton, claseBotonSecundario, claseInput, Encabezado, Etiqueta } from "@/components/panel/ui";

const hoyLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

function Paso({ n, texto, hecho, actual }: { n: number; texto: string; hecho: boolean; actual: boolean }) {
  const estilo = hecho ? "bg-emerald-100 text-emerald-800" : actual ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300" : "bg-gray-100 text-black/40";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${estilo}`}>
      {hecho ? "✓" : `${n}`} {texto}
    </span>
  );
}

export default function AgendaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha: fechaParam } = use(searchParams);
  const router = useRouter();
  const yo = useSesion();
  const esVet = yo.rol === "veterinario";
  const fecha = fechaParam || hoyLocal();

  const [citas, setCitas] = useState<SolicitudCita[] | null>(null);
  const [porConfirmar, setPorConfirmar] = useState(0);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([
      panelFetch<Paginado<SolicitudCita>>("clinica/solicitudes-cita", { query: { estado: "CONFIRMADA", fecha } }),
      panelFetch<Paginado<SolicitudCita>>("clinica/solicitudes-cita", { query: { estado: "PENDIENTE" } }),
    ])
      .then(([a, p]) => {
        if (!vigente) return;
        setCitas(a.results);
        setPorConfirmar(p.count);
      })
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [fecha, recarga]);

  async function vincular(cita: SolicitudCita, pacienteId: number) {
    try {
      await panelFetch(`clinica/solicitudes-cita/${cita.id}`, { method: "PATCH", body: { paciente: pacienteId } });
      setRecarga((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  const atendidas = citas?.filter((c) => c.cobro?.estado === "PAGADO").length ?? 0;

  return (
    <>
      <Encabezado titulo="Agenda del día" subtitulo="Citas confirmadas: registra al paciente, atiéndelo y cobra desde aquí." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <input type="date" className={`${claseInput} w-auto`} value={fecha}
          onChange={(e) => e.target.value && router.replace(`/panel/agenda?fecha=${e.target.value}`)} />
        {fecha !== hoyLocal() && (
          <button onClick={() => router.replace("/panel/agenda")} className={claseBotonSecundario}>Hoy</button>
        )}
        {citas && citas.length > 0 && (
          <span className="text-sm text-black/55">{atendidas} de {citas.length} atendidas y pagadas</span>
        )}
      </div>

      {porConfirmar > 0 && (
        <div className="mb-5">
          <Aviso tipo="info">
            Hay {porConfirmar} {porConfirmar === 1 ? "solicitud" : "solicitudes"} de la web por confirmar.{" "}
            <Link href="/panel/citas" className="font-semibold underline">Revisarlas</Link>
          </Aviso>
        </div>
      )}
      {error && <div className="mb-5"><Aviso>{error}</Aviso></div>}

      {!citas ? <Cargando /> : citas.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/45">No hay citas confirmadas para este día.</p>
      ) : (
        <div className="space-y-4">
          {citas.map((c) => {
            const tienePaciente = !!c.paciente;
            const firmada = !!c.consulta_cerrada;
            const pagada = c.cobro?.estado === "PAGADO";
            return (
              <div key={c.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{EMOJI_ESPECIE[c.especie]}</span>
                    <div>
                      <p className="font-bold">
                        {c.nombre_mascota} <span className="font-normal text-black/50">· {ESPECIES[c.especie]}</span>
                        {c.numero_historia && <span className="ml-2 font-mono text-xs text-black/50">{c.numero_historia}</span>}
                      </p>
                      <p className="text-sm text-black/55">{c.nombre_tutor} · {c.telefono}</p>
                      {c.motivo && <p className="mt-1 text-sm">“{c.motivo}”</p>}
                    </div>
                  </div>
                  <a href={whatsappA(c.telefono, `Hola ${c.nombre_tutor} 👋, te escribimos de PataVida sobre la cita de ${c.nombre_mascota}.`)}
                    target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green-700 hover:underline">
                    💬 WhatsApp
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Paso n={1} texto="Paciente" hecho={tienePaciente} actual={!tienePaciente} />
                  <Paso n={2} texto={c.consulta && !firmada ? "Consulta (en curso)" : "Consulta"} hecho={firmada} actual={tienePaciente && !firmada} />
                  <Paso n={3} texto="Cobro" hecho={pagada} actual={firmada && !pagada} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
                  {!tienePaciente && c.paciente_sugerido && (
                    <>
                      <button onClick={() => vincular(c, c.paciente_sugerido!.id)} className={claseBoton}>
                        ✓ Es {c.paciente_sugerido.nombre} ({c.paciente_sugerido.numero_historia})
                      </button>
                      <Link href={`/panel/pacientes/nuevo?cita=${c.id}`} className={claseBotonSecundario}>Es otro paciente</Link>
                    </>
                  )}
                  {!tienePaciente && !c.paciente_sugerido && (
                    <Link href={`/panel/pacientes/nuevo?cita=${c.id}`} className={claseBoton}>① Registrar paciente</Link>
                  )}

                  {tienePaciente && !c.consulta && (esVet ? (
                    <Link href={`/panel/consultas/nueva?paciente=${c.paciente}&cita=${c.id}`} className={claseBoton}>② Iniciar consulta</Link>
                  ) : <Etiqueta color="ambar">Esperando al veterinario</Etiqueta>)}

                  {c.consulta && !firmada && (esVet ? (
                    <Link href={`/panel/consultas/${c.consulta}`} className={claseBoton}>② Continuar consulta</Link>
                  ) : <Etiqueta color="azul">En consulta</Etiqueta>)}

                  {firmada && !c.cobro && (
                    <Link href={`/panel/caja/nuevo?paciente=${c.paciente}&consulta=${c.consulta}`} className={claseBoton}>③ Cobrar</Link>
                  )}
                  {c.cobro && (
                    <Link href={`/panel/caja/${c.cobro.id}`} className={pagada ? claseBotonSecundario : claseBoton}>
                      {pagada ? "🧾 Ver recibo" : "③ Registrar pago"} · {pesos(c.cobro.total)}
                    </Link>
                  )}
                  {c.cobro && <Etiqueta color={ESTADOS_COBRO[c.cobro.estado].color}>{ESTADOS_COBRO[c.cobro.estado].texto}</Etiqueta>}

                  {tienePaciente && (
                    <Link href={`/panel/pacientes/${c.paciente}`} className="ml-auto text-sm text-brand-dark hover:underline">Ver ficha →</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
