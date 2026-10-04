"use client";

// Recibo de caja: registrar el pago, anular, imprimir o mandarlo por WhatsApp.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ESTADOS_COBRO, fechaHora, METODOS_PAGO, panelFetch, pesos, whatsappA, type Cobro,
} from "@/lib/clinica";
import { Aviso, Cargando, claseBoton, claseBotonSecundario, claseInput, Etiqueta } from "@/components/panel/ui";
import { LOCATION } from "@/lib/contact";

function textoRecibo(c: Cobro): string {
  return [
    `Hola 👋, este es el detalle de la cuenta de *${c.paciente_nombre}* en PataVida 🐾`,
    "",
    `*Recibo ${c.numero}* · ${fechaHora(c.creado)}`,
    ...c.items.map((i) => `• ${i.cantidad} x ${i.descripcion}: ${pesos(i.subtotal ?? 0)}`),
    "",
    `*Total: ${pesos(c.total)}*`,
    c.estado === "PAGADO"
      ? `✅ Pagado con ${METODOS_PAGO[c.metodo_pago].toLowerCase()} el ${fechaHora(c.pagado_en)}. ¡Gracias!`
      : "Puedes pagar en la clínica en efectivo, tarjeta, transferencia o Nequi.",
  ].join("\n");
}

export default function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    panelFetch<Cobro>(`clinica/cobros/${id}`).then(setCobro).catch((e) => setError(e.message));
  }, [id]);

  async function accion(ruta: "pagar" | "anular", body: Record<string, string>) {
    setError("");
    setOcupado(true);
    try {
      setCobro(await panelFetch<Cobro>(`clinica/cobros/${id}/${ruta}`, { method: "POST", body }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setOcupado(false);
    }
  }

  function anular() {
    const motivo = prompt("Motivo de la anulación (queda registrado):");
    if (motivo?.trim()) accion("anular", { motivo });
  }

  if (!cobro) return error ? <Aviso>{error}</Aviso> : <Cargando />;
  const estado = ESTADOS_COBRO[cobro.estado];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/panel/caja" className="text-sm text-brand-dark hover:underline">← Caja</Link>
        <span className="flex-1" />
        <button onClick={() => window.print()} className={claseBotonSecundario}>🖨️ Imprimir</button>
        <a href={whatsappA(cobro.tutor_telefono, textoRecibo(cobro))} target="_blank" rel="noopener noreferrer"
          className={`${claseBotonSecundario} border-green-300 text-green-700 hover:bg-green-50`}>
          💬 Enviar por WhatsApp
        </a>
      </div>

      {error && <div className="mb-5 print:hidden"><Aviso>{error}</Aviso></div>}

      {cobro.estado === "PENDIENTE" && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 print:hidden">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/55">Método de pago</span>
            <select className={`${claseInput} w-auto`} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {Object.entries(METODOS_PAGO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button onClick={() => accion("pagar", { metodo_pago: metodo })} disabled={ocupado} className={claseBoton}>
            ✅ Registrar pago de {pesos(cobro.total)}
          </button>
          <span className="flex-1" />
          <button onClick={anular} disabled={ocupado} className="text-sm font-semibold text-red-600 hover:underline">Anular</button>
        </div>
      )}
      {cobro.estado === "PAGADO" && (
        <div className="mb-6 print:hidden">
          <Aviso tipo="ok">Pagado con {METODOS_PAGO[cobro.metodo_pago]} el {fechaHora(cobro.pagado_en)}. Un recibo pagado ya no se modifica.</Aviso>
        </div>
      )}
      {cobro.estado === "ANULADO" && (
        <div className="mb-6 print:hidden"><Aviso>Anulado. Motivo: {cobro.motivo_anulacion}</Aviso></div>
      )}

      <article className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-brand pb-4">
          <div>
            <p className="text-xl font-extrabold text-brand-dark">🐾 PataVida · Clínica Veterinaria</p>
            <p className="text-sm text-black/55">{LOCATION}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">CUENTA DE COBRO</p>
            <p className="font-mono">{cobro.numero}</p>
            <p className="text-black/55">{fechaHora(cobro.creado)}</p>
            <p className="mt-1"><Etiqueta color={estado.color}>{estado.texto}</Etiqueta></p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-black/45">Tutor</p>
            <p className="font-semibold">{cobro.tutor_nombre}</p>
            <p>{cobro.tutor_documento}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-black/45">Paciente</p>
            <p className="font-semibold">{cobro.paciente_nombre}</p>
            <p className="font-mono text-xs">{cobro.numero_historia}</p>
          </div>
        </section>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase text-black/45">
            <tr><th className="py-2">Descripción</th><th className="text-center">Cant.</th><th className="text-right">Precio</th><th className="text-right">Subtotal</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {cobro.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">{i.descripcion}</td>
                <td className="text-center">{i.cantidad}</td>
                <td className="text-right">{pesos(i.precio_unitario)}</td>
                <td className="text-right font-semibold">{pesos(i.subtotal ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black/10">
              <td colSpan={3} className="py-3 text-right font-bold">TOTAL</td>
              <td className="py-3 text-right text-lg font-extrabold text-brand-dark">{pesos(cobro.total)}</td>
            </tr>
          </tfoot>
        </table>

        {cobro.notas && <p className="mt-2 text-sm text-black/60">Notas: {cobro.notas}</p>}

        <footer className="mt-10 text-xs text-black/45">
          Atendió: {cobro.creado_por_nombre}
          {cobro.estado === "PAGADO" && ` · Pagado con ${METODOS_PAGO[cobro.metodo_pago]} el ${fechaHora(cobro.pagado_en)}`}.<br />
          Este documento no reemplaza la factura electrónica. Demo de portafolio · datos ficticios.
        </footer>
      </article>
    </>
  );
}
