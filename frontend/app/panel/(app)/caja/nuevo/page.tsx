"use client";

// Nueva cuenta de cobro. Se puede abrir desde la ficha del paciente o desde una consulta:
//   /panel/caja/nuevo?paciente=1&consulta=3
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EMOJI_ESPECIE, panelFetch, pesos, type Cobro, type ItemCobro, type Paciente, type Paginado, type Servicio,
} from "@/lib/clinica";
import { Aviso, Cargando, Campo, claseBoton, claseBotonSecundario, claseInput, Encabezado, Tarjeta } from "@/components/panel/ui";

export default function NuevoCobroPage() {
  // La página se genera estática: los parámetros de la URL se leen en el navegador.
  return <Suspense fallback={<Cargando />}><NuevoCobroPageContenido /></Suspense>;
}

function NuevoCobroPageContenido() {
  const busqueda = useSearchParams();
  const pacienteParam = busqueda.get("paciente") ?? undefined;
  const consulta = busqueda.get("consulta") ?? undefined;
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [servicios, setServicios] = useState<Servicio[] | null>(null);
  const [lineas, setLineas] = useState<ItemCobro[]>([]);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    panelFetch<Servicio[]>("clinica/servicios").then(setServicios).catch((e) => setError(e.message));
    if (pacienteParam) {
      panelFetch<Paciente>(`clinica/pacientes/${pacienteParam}`).then(setPaciente).catch((e) => setError(e.message));
    }
  }, [pacienteParam]);

  function agregarServicio(id: string) {
    const s = servicios?.find((x) => String(x.id) === id);
    if (s) setLineas([...lineas, { servicio: s.id, descripcion: s.nombre, cantidad: 1, precio_unitario: s.precio }]);
  }

  function cambiar(i: number, campo: keyof ItemCobro, valor: string) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: campo === "cantidad" ? Number(valor) : valor } : l)));
  }

  // Solo es una vista previa: el total real lo calcula el servidor.
  const total = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente) return;
    setError("");
    setGuardando(true);
    try {
      const cobro = await panelFetch<Cobro>("clinica/cobros", {
        method: "POST",
        body: { paciente: paciente.id, consulta: consulta ? Number(consulta) : null, notas, items: lineas },
      });
      router.replace(`/panel/caja/${cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  if (!servicios) return error ? <Aviso>{error}</Aviso> : <Cargando />;

  return (
    <>
      <Link href={paciente ? `/panel/pacientes/${paciente.id}` : "/panel/caja"} className="text-sm text-brand-dark hover:underline">
        ← {paciente ? paciente.nombre : "Caja"}
      </Link>
      <div className="mt-3">
        <Encabezado titulo="Nuevo cobro" subtitulo={consulta ? "Cobro de la consulta registrada." : "Arma la cuenta con el catálogo o con líneas libres."} />
      </div>

      <form onSubmit={guardar} className="space-y-6">
        <Tarjeta titulo="Paciente">
          {paciente ? (
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-3">
                <span className="text-3xl">{EMOJI_ESPECIE[paciente.especie]}</span>
                <span>
                  <span className="block font-semibold">{paciente.nombre} · <span className="font-mono text-xs">{paciente.numero_historia}</span></span>
                  <span className="text-sm text-black/55">Tutor: {paciente.tutor_nombre}</span>
                </span>
              </p>
              {!pacienteParam && (
                <button type="button" onClick={() => setPaciente(null)} className="text-sm text-brand-dark hover:underline">Cambiar</button>
              )}
            </div>
          ) : (
            <BuscarPaciente alElegir={setPaciente} />
          )}
        </Tarjeta>

        <Tarjeta titulo="Detalle del cobro">
          <div className="space-y-3">
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-6 items-end gap-3 rounded-xl bg-gray-50 p-3">
                <Campo label="Descripción" className="col-span-6 sm:col-span-3">
                  <input className={claseInput} required value={l.descripcion} onChange={(e) => cambiar(i, "descripcion", e.target.value)} />
                </Campo>
                <Campo label="Cant." className="col-span-2 sm:col-span-1">
                  <input type="number" min="1" max="999" className={claseInput} required value={l.cantidad}
                    onChange={(e) => cambiar(i, "cantidad", e.target.value)} />
                </Campo>
                <Campo label="Precio unit." className="col-span-3 sm:col-span-1">
                  <input type="number" min="0" step="100" className={claseInput} required value={l.precio_unitario}
                    onChange={(e) => cambiar(i, "precio_unitario", e.target.value)} />
                </Campo>
                <button type="button" onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))}
                  className="col-span-1 mb-1 rounded-lg px-2 py-2 text-red-500 hover:bg-red-50" aria-label="Quitar línea">✕</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <select className={`${claseInput} w-auto`} value="" onChange={(e) => agregarServicio(e.target.value)}>
              <option value="">+ Agregar del catálogo...</option>
              {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre} · {pesos(s.precio)}</option>)}
            </select>
            <button type="button" className={claseBotonSecundario}
              onClick={() => setLineas([...lineas, { servicio: null, descripcion: "", cantidad: 1, precio_unitario: "" }])}>
              + Línea libre (medicamento, producto...)
            </button>
          </div>

          <Campo label="Notas" className="mt-5">
            <input className={claseInput} maxLength={200} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Campo>

          <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
            <span className="text-sm text-black/55">Total</span>
            <span className="text-2xl font-extrabold text-brand-dark">{pesos(total)}</span>
          </div>
        </Tarjeta>

        {error && <Aviso>{error}</Aviso>}
        <button type="submit" disabled={!paciente || lineas.length === 0 || guardando} className={claseBoton}>
          {guardando ? "Guardando..." : "💾 Crear cuenta de cobro"}
        </button>
      </form>
    </>
  );
}

function BuscarPaciente({ alElegir }: { alElegir: (p: Paciente) => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Paciente[]>([]);

  useEffect(() => {
    if (busqueda.trim().length < 2) return;
    const t = setTimeout(() => {
      panelFetch<Paginado<Paciente>>("clinica/pacientes", { query: { search: busqueda } })
        .then((d) => setResultados(d.results.slice(0, 6)))
        .catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  return (
    <div>
      <input className={claseInput} placeholder="🔍  Busca por nombre, historia o cédula del tutor..."
        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      {busqueda.trim().length >= 2 && resultados.length > 0 && (
        <ul className="mt-2 divide-y divide-black/5 rounded-xl border border-black/10">
          {resultados.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => alElegir(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-teal-50">
                <span className="text-xl">{EMOJI_ESPECIE[p.especie]}</span>
                <span><span className="font-semibold">{p.nombre}</span> · {p.numero_historia} · {p.tutor_nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
