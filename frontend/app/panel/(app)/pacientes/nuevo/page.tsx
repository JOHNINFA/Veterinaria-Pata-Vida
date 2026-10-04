"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ESPECIES, panelFetch, SEXOS, TIPOS_DOC, type Paciente, type Paginado, type SolicitudCita, type Tutor,
} from "@/lib/clinica";
import { Aviso, Campo, claseBoton, claseBotonSecundario, claseInput, Encabezado, Tarjeta } from "@/components/panel/ui";

const tutorVacio = { nombres: "", apellidos: "", tipo_documento: "CC", numero_documento: "", telefono: "",
  email: "", direccion: "", autoriza_datos: false };
const pacienteVacio = { nombre: "", especie: "PERRO", raza: "", sexo: "M", fecha_nacimiento: "", color: "",
  microchip: "", esterilizado: false, alergias: "", observaciones: "" };

const digitos = (tel: string) => tel.replace(/\D/g, "").slice(-10);

export default function NuevoPacientePage({ searchParams }: { searchParams: Promise<{ cita?: string }> }) {
  const { cita: citaId } = use(searchParams);
  const router = useRouter();
  const [cita, setCita] = useState<SolicitudCita | null>(null);
  const [documento, setDocumento] = useState("");
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [crearTutor, setCrearTutor] = useState(false);
  const [nuevoTutor, setNuevoTutor] = useState(tutorVacio);
  const [paciente, setPaciente] = useState(pacienteVacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Si viene de la agenda, llenamos todo lo que ya sabemos por la cita.
  useEffect(() => {
    if (!citaId) return;
    (async () => {
      try {
        const c = await panelFetch<SolicitudCita>(`clinica/solicitudes-cita/${citaId}`);
        setCita(c);
        setPaciente((p) => ({ ...p, nombre: c.nombre_mascota, especie: c.especie }));
        // ¿El tutor ya existe? Lo buscamos por su celular.
        const d = await panelFetch<Paginado<Tutor>>("clinica/tutores", { query: { search: digitos(c.telefono) } });
        const existente = d.results.find((t) => digitos(t.telefono) === digitos(c.telefono));
        if (existente) {
          setTutor(existente);
        } else {
          const [nombres, ...apellidos] = c.nombre_tutor.trim().split(/\s+/);
          setCrearTutor(true);
          setNuevoTutor({ ...tutorVacio, nombres, apellidos: apellidos.join(" "), telefono: c.telefono, email: c.email });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar la cita.");
      }
    })();
  }, [citaId]);

  async function buscarTutor() {
    setError("");
    const d = await panelFetch<Paginado<Tutor>>("clinica/tutores", { query: { search: documento.trim() } });
    const exacto = d.results.find((t) => t.numero_documento === documento.trim());
    if (exacto) {
      setTutor(exacto);
      setCrearTutor(false);
    } else {
      setTutor(null);
      setCrearTutor(true);
      setNuevoTutor({ ...tutorVacio, numero_documento: documento.trim() });
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      let tutorId = tutor?.id;
      if (!tutorId) {
        const creado = await panelFetch<Tutor>("clinica/tutores", { method: "POST", body: nuevoTutor });
        setTutor(creado);
        setCrearTutor(false);
        tutorId = creado.id;
      }
      const creado = await panelFetch<Paciente>("clinica/pacientes", {
        method: "POST",
        body: { ...paciente, tutor: tutorId, fecha_nacimiento: paciente.fecha_nacimiento || null },
      });
      if (cita) {
        // Queda vinculado a la cita y volvemos a la agenda para seguir con la consulta.
        await panelFetch(`clinica/solicitudes-cita/${cita.id}`, { method: "PATCH", body: { paciente: creado.id } });
        router.push(`/panel/agenda?fecha=${cita.fecha_preferida}`);
      } else {
        router.push(`/panel/pacientes/${creado.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  const t = (campo: keyof typeof tutorVacio) => ({
    value: nuevoTutor[campo] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setNuevoTutor({ ...nuevoTutor, [campo]: e.target.value }),
  });
  const p = (campo: keyof typeof pacienteVacio) => ({
    value: paciente[campo] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setPaciente({ ...paciente, [campo]: e.target.value }),
  });

  return (
    <form onSubmit={guardar} className="space-y-6">
      <Encabezado titulo="Nuevo paciente" subtitulo="Primero identifica al tutor (propietario o responsable)." />
      {cita && (
        <Aviso tipo="info">
          🗓️ Desde la cita de <strong>{cita.nombre_mascota}</strong> ({cita.nombre_tutor}). Ya llenamos lo que sabemos:
          completa la <strong>cédula</strong> del tutor y confirma su <strong>autorización de datos</strong>.
        </Aviso>
      )}

      <Tarjeta titulo="1. Tutor">
        {tutor ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-50 p-4">
            <div>
              <p className="font-semibold">{tutor.nombres} {tutor.apellidos}</p>
              <p className="text-sm text-black/55">
                {tutor.tipo_documento} {tutor.numero_documento} · {tutor.telefono} · {tutor.total_pacientes} paciente(s)
              </p>
            </div>
            <button type="button" className={claseBotonSecundario} onClick={() => { setTutor(null); setDocumento(""); }}>
              Cambiar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Campo label="Número de documento del tutor" className="max-w-xs flex-1">
              <input className={claseInput} value={documento} onChange={(e) => setDocumento(e.target.value)} />
            </Campo>
            <button type="button" onClick={buscarTutor} disabled={!documento.trim()} className={claseBotonSecundario}>
              Buscar
            </button>
          </div>
        )}

        {crearTutor && !tutor && (
          <div className="mt-5 space-y-4 border-t pt-5">
            <Aviso tipo="info">{cita ? "Tutor nuevo. Revisa sus datos:" : "No hay un tutor con ese documento. Regístralo:"}</Aviso>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombres"><input className={claseInput} required {...t("nombres")} /></Campo>
              <Campo label="Apellidos"><input className={claseInput} required {...t("apellidos")} /></Campo>
              <Campo label="Tipo de documento">
                <select className={claseInput} {...t("tipo_documento")}>
                  {Object.entries(TIPOS_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Campo>
              <Campo label="Número de documento"><input className={claseInput} required {...t("numero_documento")} /></Campo>
              <Campo label="Celular"><input className={claseInput} required {...t("telefono")} /></Campo>
              <Campo label="Correo (opcional)"><input type="email" className={claseInput} {...t("email")} /></Campo>
              <Campo label="Dirección (opcional)" className="sm:col-span-2"><input className={claseInput} {...t("direccion")} /></Campo>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-black/10 p-3 text-sm">
              <input type="checkbox" className="mt-1" required checked={nuevoTutor.autoriza_datos}
                onChange={(e) => setNuevoTutor({ ...nuevoTutor, autoriza_datos: e.target.checked })} />
              <span>
                <strong>El tutor autoriza el tratamiento de sus datos personales</strong> para la atención de su mascota,
                recordatorios y contacto, conforme a la Ley 1581 de 2012. Puede conocer, actualizar o revocar sus datos
                en cualquier momento.
              </span>
            </label>
          </div>
        )}
      </Tarjeta>

      {(tutor || crearTutor) && (
        <Tarjeta titulo="2. Paciente">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo label="Nombre"><input className={claseInput} required {...p("nombre")} /></Campo>
            <Campo label="Especie">
              <select className={claseInput} {...p("especie")}>
                {Object.entries(ESPECIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Campo>
            <Campo label="Raza"><input className={claseInput} {...p("raza")} /></Campo>
            <Campo label="Sexo">
              <select className={claseInput} {...p("sexo")}>
                {Object.entries(SEXOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Campo>
            <Campo label="Fecha de nacimiento" ayuda="Puede ser aproximada">
              <input type="date" className={claseInput} {...p("fecha_nacimiento")} />
            </Campo>
            <Campo label="Color / pelaje"><input className={claseInput} {...p("color")} /></Campo>
            <Campo label="Microchip (opcional)"><input className={claseInput} {...p("microchip")} /></Campo>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={paciente.esterilizado}
                onChange={(e) => setPaciente({ ...paciente, esterilizado: e.target.checked })} />
              Esterilizado
            </label>
            <Campo label="Alergias" className="sm:col-span-2 lg:col-span-3" ayuda="Se mostrarán destacadas en rojo en la ficha">
              <input className={claseInput} placeholder="Ej: Penicilina" {...p("alergias")} />
            </Campo>
            <Campo label="Observaciones" className="sm:col-span-2 lg:col-span-3">
              <textarea rows={2} className={claseInput} {...p("observaciones")} />
            </Campo>
          </div>
        </Tarjeta>
      )}

      {error && <Aviso>{error}</Aviso>}
      <div className="flex gap-3">
        <button type="submit" disabled={guardando || (!tutor && !crearTutor)} className={claseBoton}>
          {guardando ? "Guardando..." : "Registrar paciente"}
        </button>
        <Link href={cita ? `/panel/agenda?fecha=${cita.fecha_preferida}` : "/panel/pacientes"} className={claseBotonSecundario}>Cancelar</Link>
      </div>
    </form>
  );
}
