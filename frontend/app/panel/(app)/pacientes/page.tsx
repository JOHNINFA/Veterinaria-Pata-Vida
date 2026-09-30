"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EMOJI_ESPECIE, ESPECIES, panelFetch, SEXOS, type Paginado, type Paciente } from "@/lib/clinica";
import { Aviso, Cargando, claseBoton, claseInput, Encabezado, Etiqueta } from "@/components/panel/ui";

export default function PacientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [error, setError] = useState("");

  // Busca mientras escribes, esperando 300 ms para no llamar a la API en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      panelFetch<Paginado<Paciente>>("clinica/pacientes", { query: busqueda ? { search: busqueda } : {} })
        .then((d) => setPacientes(d.results))
        .catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  return (
    <>
      <Encabezado titulo="Pacientes" subtitulo="Busca por nombre, número de historia, microchip o cédula del tutor."
        accion={<Link href="/panel/pacientes/nuevo" className={claseBoton}>+ Nuevo paciente</Link>} />

      <input className={`${claseInput} mb-5 max-w-md`} placeholder="🔍  Ej: Max, HC-000001, 1000000001..."
        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      {error && <Aviso>{error}</Aviso>}
      {!pacientes ? <Cargando /> : pacientes.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/45">No encontramos pacientes con esa búsqueda.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-black/50">
              <tr>
                <th className="px-4 py-3">Paciente</th>
                <th className="hidden px-4 py-3 sm:table-cell">Historia</th>
                <th className="hidden px-4 py-3 md:table-cell">Tutor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-teal-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/panel/pacientes/${p.id}`} className="flex items-center gap-3">
                      <span className="text-2xl">{EMOJI_ESPECIE[p.especie]}</span>
                      <span>
                        <span className="block font-semibold">{p.nombre} {p.fallecido && <Etiqueta>Fallecido</Etiqueta>}</span>
                        <span className="text-xs text-black/50">
                          {ESPECIES[p.especie]} · {p.raza || "Sin raza"} · {SEXOS[p.sexo]}{p.edad && ` · ${p.edad}`}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs sm:table-cell">{p.numero_historia}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{p.tutor_nombre}</td>
                  <td className="px-4 py-3 text-right">
                    {p.alergias && <Etiqueta color="rojo">⚠ Alergias</Etiqueta>}
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
