"use client";

// Caja: lo cobrado en el día (cierre de caja) y la lista de cuentas de cobro.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ESTADOS_COBRO, fechaHora, METODOS_PAGO, panelFetch, pesos,
  type CierreCaja, type Cobro, type Paginado,
} from "@/lib/clinica";
import { Aviso, Cargando, claseBoton, claseInput, Encabezado, Etiqueta, Tarjeta } from "@/components/panel/ui";

type Filtro = "dia" | "pendientes" | "todos";

export default function CajaPage() {
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString("en-CA")); // YYYY-MM-DD local
  const [filtro, setFiltro] = useState<Filtro>("dia");
  const [cierre, setCierre] = useState<CierreCaja | null>(null);
  const [cobros, setCobros] = useState<Cobro[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    const query: Record<string, string> =
      filtro === "dia" ? { fecha } : filtro === "pendientes" ? { estado: "PENDIENTE" } : {};
    Promise.all([
      panelFetch<CierreCaja>("clinica/cobros/caja", { query: { fecha } }),
      panelFetch<Paginado<Cobro>>("clinica/cobros", { query }),
    ])
      .then(([c, l]) => {
        if (!vigente) return;
        setCierre(c);
        setCobros(l.results);
      })
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [fecha, filtro]);

  return (
    <>
      <Encabezado titulo="Caja" subtitulo="Cuentas de cobro y cierre del día."
        accion={<Link href="/panel/caja/nuevo" className={claseBoton}>+ Nuevo cobro</Link>} />

      {error && <div className="mb-5"><Aviso>{error}</Aviso></div>}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/55">Día del cierre</span>
          <input type="date" className={`${claseInput} w-auto`} value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </label>
      </div>

      {!cierre ? <Cargando /> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <span className="text-2xl">💵</span>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">{pesos(cierre.total_pagado)}</p>
            <p className="text-sm text-black/55">Cobrado ({cierre.cantidad_pagados} {cierre.cantidad_pagados === 1 ? "pago" : "pagos"})</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <span className="text-2xl">⏳</span>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{pesos(cierre.pendientes_total)}</p>
            <p className="text-sm text-black/55">Por cobrar ({cierre.pendientes_cantidad} {cierre.pendientes_cantidad === 1 ? "cuenta" : "cuentas"})</p>
          </div>
          <Tarjeta titulo="Por método de pago">
            <dl className="space-y-1.5 text-sm">
              {Object.entries(METODOS_PAGO).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-black/55">{v}</dt>
                  <dd className="font-semibold">{pesos(cierre.por_metodo[k] ?? 0)}</dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
        </div>
      )}

      <div className="mb-4 mt-8 flex flex-wrap gap-2">
        {([["dia", "Creados ese día"], ["pendientes", "Pendientes"], ["todos", "Todos"]] as const).map(([k, v]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtro === k ? "bg-brand text-white" : "bg-white text-black/60 hover:bg-gray-100"
            }`}>
            {v}
          </button>
        ))}
      </div>

      {!cobros ? <Cargando /> : cobros.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/45">No hay cobros en esta vista.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Recibo</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="hidden px-4 py-3 md:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {cobros.map((c) => (
                <tr key={c.id} className="hover:bg-teal-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/panel/caja/${c.id}`} className="font-mono text-xs font-semibold text-brand-dark hover:underline">{c.numero}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-semibold">{c.paciente_nombre}</span>
                    <span className="text-xs text-black/50">{c.tutor_nombre}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-black/55 md:table-cell">{fechaHora(c.creado)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{pesos(c.total)}</td>
                  <td className="px-4 py-3">
                    <Etiqueta color={ESTADOS_COBRO[c.estado].color}>{ESTADOS_COBRO[c.estado].texto}</Etiqueta>
                    {c.metodo_pago && <span className="ml-1 text-xs text-black/45">{METODOS_PAGO[c.metodo_pago]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
