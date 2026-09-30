"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ApiError,
  crearSolicitudCita,
  SolicitudCitaPayload,
} from "@/lib/api";
import { getWhatsAppUrl } from "@/lib/contact";

const ESPECIES: { value: SolicitudCitaPayload["especie"]; label: string }[] = [
  { value: "PERRO", label: "Perro" },
  { value: "GATO", label: "Gato" },
  { value: "AVE", label: "Ave" },
  { value: "CONEJO", label: "Conejo" },
  { value: "ROEDOR", label: "Roedor" },
  { value: "REPTIL", label: "Reptil" },
  { value: "OTRO", label: "Otro" },
];

const INICIAL: SolicitudCitaPayload = {
  nombre_tutor: "",
  telefono: "",
  email: "",
  nombre_mascota: "",
  especie: "PERRO",
  fecha_preferida: "",
  motivo: "",
  acepta_datos: false,
};

function fechaLocal(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function primerError(errores: Record<string, string[]>, campo: keyof SolicitudCitaPayload) {
  const error = errores[campo];
  return Array.isArray(error) ? error[0] : error;
}

export default function SolicitudCitaForm() {
  const [datos, setDatos] = useState<SolicitudCitaPayload>(INICIAL);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviada, setEnviada] = useState<SolicitudCitaPayload | null>(null);

  function actualizar<K extends keyof SolicitudCitaPayload>(campo: K, valor: SolicitudCitaPayload[K]) {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => {
      if (!actuales[campo]) return actuales;
      const nuevos = { ...actuales };
      delete nuevos[campo];
      return nuevos;
    });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErrores({});
    setMensaje("");

    try {
      await crearSolicitudCita(datos);
      setEnviada(datos);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) setErrores(error.fields);
        else if (error.status === 429) {
          setMensaje("Recibimos varias solicitudes desde tu conexión. Intenta de nuevo en una hora o escríbenos por WhatsApp.");
        } else setMensaje("No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.");
      } else {
        setMensaje("No pudimos conectarnos con la clínica. Intenta de nuevo en unos minutos.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    const especie = ESPECIES.find((opcion) => opcion.value === enviada.especie)?.label;
    const resumen = [
      "Hola PataVida, acabo de solicitar una cita desde la web.",
      `Tutor: ${enviada.nombre_tutor}`,
      `Mascota: ${enviada.nombre_mascota} (${especie})`,
      `Fecha preferida: ${enviada.fecha_preferida}`,
      enviada.motivo ? `Motivo: ${enviada.motivo}` : "",
    ].filter(Boolean).join("\n");

    return (
      <div className="rounded-2xl bg-teal-50 p-7 text-center ring-1 ring-brand/15 sm:p-10" role="status">
        <div className="text-5xl" aria-hidden="true">✅</div>
        <h3 className="mt-4 text-2xl font-extrabold text-brand-dark">¡Solicitud recibida!</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-black/65">
          Nuestro equipo revisará la disponibilidad y se comunicará contigo para confirmar la cita de {enviada.nombre_mascota}.
        </p>
        <a
          href={getWhatsAppUrl(resumen)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-dark"
        >
          Confirmar por WhatsApp
        </a>
      </div>
    );
  }

  const campoClase = "mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

  return (
    <form onSubmit={enviar} className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:grid-cols-2 sm:p-8">
      <Campo label="Tu nombre" error={primerError(errores, "nombre_tutor")}>
        <input className={campoClase} value={datos.nombre_tutor} onChange={(e) => actualizar("nombre_tutor", e.target.value)} autoComplete="name" required />
      </Campo>
      <Campo label="Teléfono" error={primerError(errores, "telefono")}>
        <input className={campoClase} type="tel" value={datos.telefono} onChange={(e) => actualizar("telefono", e.target.value)} autoComplete="tel" required />
      </Campo>
      <Campo label="Correo electrónico (opcional)" error={primerError(errores, "email")}>
        <input className={campoClase} type="email" value={datos.email} onChange={(e) => actualizar("email", e.target.value)} autoComplete="email" />
      </Campo>
      <Campo label="Nombre de la mascota" error={primerError(errores, "nombre_mascota")}>
        <input className={campoClase} value={datos.nombre_mascota} onChange={(e) => actualizar("nombre_mascota", e.target.value)} required />
      </Campo>
      <Campo label="Especie" error={primerError(errores, "especie")}>
        <select className={campoClase} value={datos.especie} onChange={(e) => actualizar("especie", e.target.value as SolicitudCitaPayload["especie"])} required>
          {ESPECIES.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
        </select>
      </Campo>
      <Campo label="Fecha preferida" error={primerError(errores, "fecha_preferida")}>
        <input className={campoClase} type="date" min={fechaLocal()} value={datos.fecha_preferida} onChange={(e) => actualizar("fecha_preferida", e.target.value)} required />
      </Campo>
      <div className="sm:col-span-2">
        <Campo label="¿Cómo podemos ayudar? (opcional)" error={primerError(errores, "motivo")}>
          <textarea className={`${campoClase} min-h-28 resize-y`} value={datos.motivo} onChange={(e) => actualizar("motivo", e.target.value)} placeholder="Cuéntanos brevemente el motivo de la consulta" />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-black/70">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={datos.acepta_datos} onChange={(e) => actualizar("acepta_datos", e.target.checked)} required />
          <span>
            Autorizo el tratamiento de mis datos personales conforme a la{" "}
            <Link href="/politica-datos" className="font-semibold text-brand underline-offset-2 hover:underline">Política de tratamiento de datos</Link>.
          </span>
        </label>
        {primerError(errores, "acepta_datos") && <p className="mt-1 text-xs text-red-600">{primerError(errores, "acepta_datos")}</p>}
      </div>
      {errores.non_field_errors?.[0] && <p className="text-sm text-red-600 sm:col-span-2">{errores.non_field_errors[0]}</p>}
      {mensaje && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2" role="alert">{mensaje}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando} className="w-full rounded-full bg-accent px-7 py-3 font-bold text-black transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
          {enviando ? "Enviando…" : "Solicitar cita"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
