// Tipos y utilidades del panel veterinario (lado del NAVEGADOR).
// Todas las llamadas pasan por /api/panel/* (nuestro servidor de Next), que agrega
// el JWT desde la cookie httpOnly. Aquí nunca se maneja el token.

export type Rol = "veterinario" | "recepcion";

export interface Yo {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol | null;
  matricula: string;
}

export interface Resumen {
  pacientes: number;
  tutores: number;
  solicitudes_pendientes: number;
  vencen_30_dias: number;
  cobrado_hoy: number;
  cobros_pendientes: number;
  consultas_abiertas?: number;
  consultas_hoy?: number;
}

export interface Tutor {
  id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  autoriza_datos: boolean;
  autoriza_datos_en: string | null;
  total_pacientes: number;
}

export interface Paciente {
  id: number;
  numero_historia: string;
  tutor: number;
  tutor_nombre: string;
  tutor_telefono: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string | null;
  edad: string;
  color: string;
  microchip: string;
  esterilizado: boolean;
  alergias: string;
  observaciones: string;
  fallecido: boolean;
}

export interface Prescripcion {
  id?: number;
  medicamento: string;
  principio_activo: string;
  via: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number | "";
  indicaciones: string;
}

export interface Consulta {
  id: number;
  paciente: number;
  paciente_nombre: string;
  veterinario: number;
  veterinario_nombre: string;
  veterinario_matricula: string;
  fecha: string;
  tipo: string;
  motivo: string;
  anamnesis: string;
  peso_kg: string | null;
  temperatura_c: string | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  mucosas: string;
  tllc_segundos: string | null;
  hidratacion_pct: number | null;
  condicion_corporal: number | null;
  examen_fisico: string;
  diagnostico: string;
  plan: string;
  pronostico: string;
  prescripciones: Prescripcion[];
  cerrada: boolean;
  cerrada_en: string | null;
}

export interface Preventivo {
  id: number;
  paciente: number;
  paciente_nombre: string;
  tutor_nombre: string;
  tutor_telefono: string;
  tipo: string;
  producto: string;
  lote: string;
  aplicado_el: string;
  proxima_dosis: string | null;
  dias_para_vencer: number | null;
}

export interface SolicitudCita {
  id: number;
  nombre_tutor: string;
  telefono: string;
  email: string;
  nombre_mascota: string;
  especie: string;
  fecha_preferida: string;
  motivo: string;
  estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA";
  creado: string;
}

export interface HistoriaClinica extends Omit<Paciente, "tutor" | "tutor_nombre" | "tutor_telefono"> {
  tutor: Tutor;
  consultas: Consulta[];
  preventivos: Preventivo[];
}

export interface Servicio {
  id: number;
  nombre: string;
  precio: string;
}

export interface ItemCobro {
  id?: number;
  servicio: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal?: string;
}

export type EstadoCobro = "PENDIENTE" | "PAGADO" | "ANULADO";

export interface Cobro {
  id: number;
  numero: string;
  paciente: number;
  paciente_nombre: string;
  numero_historia: string;
  tutor_nombre: string;
  tutor_documento: string;
  tutor_telefono: string;
  consulta: number | null;
  estado: EstadoCobro;
  metodo_pago: string;
  items: ItemCobro[];
  total: string;
  notas: string;
  motivo_anulacion: string;
  creado_por_nombre: string;
  creado: string;
  pagado_en: string | null;
}

export interface CierreCaja {
  fecha: string;
  total_pagado: number;
  cantidad_pagados: number;
  por_metodo: Record<string, number>;
  pendientes_cantidad: number;
  pendientes_total: number;
}

export interface Paginado<T> {
  count: number;
  results: T[];
}

// --------------------------------------------------------------------------- //
// Etiquetas legibles de los "choices" de Django
// --------------------------------------------------------------------------- //
export const ESPECIES: Record<string, string> = {
  PERRO: "Perro", GATO: "Gato", AVE: "Ave", CONEJO: "Conejo", ROEDOR: "Roedor", REPTIL: "Reptil", OTRO: "Otro",
};
export const EMOJI_ESPECIE: Record<string, string> = {
  PERRO: "🐕", GATO: "🐈", AVE: "🦜", CONEJO: "🐇", ROEDOR: "🐹", REPTIL: "🦎", OTRO: "🐾",
};
export const SEXOS: Record<string, string> = { M: "Macho", H: "Hembra" };
export const TIPOS_CONSULTA: Record<string, string> = {
  PRIMERA: "Primera vez", CONTROL: "Control", URGENCIA: "Urgencia", VACUNACION: "Vacunación", OTRO: "Otro",
};
export const PRONOSTICOS: Record<string, string> = {
  FAVORABLE: "Favorable", RESERVADO: "Reservado", DESFAVORABLE: "Desfavorable",
};
export const VIAS: Record<string, string> = {
  ORAL: "Oral", SC: "Subcutánea", IM: "Intramuscular", IV: "Intravenosa", TOPICA: "Tópica",
  OFTALMICA: "Oftálmica", OTICA: "Ótica", OTRA: "Otra",
};
export const TIPOS_PREVENTIVO: Record<string, string> = {
  VACUNA: "Vacuna", DESPARASITACION_INT: "Desparasitación interna", DESPARASITACION_EXT: "Desparasitación externa",
};
export const METODOS_PAGO: Record<string, string> = {
  EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia", NEQUI: "Nequi / Daviplata",
};
export const ESTADOS_COBRO: Record<EstadoCobro, { texto: string; color: "ambar" | "verde" | "rojo" }> = {
  PENDIENTE: { texto: "Pendiente", color: "ambar" },
  PAGADO: { texto: "Pagado", color: "verde" },
  ANULADO: { texto: "Anulado", color: "rojo" },
};
export const TIPOS_DOC: Record<string, string> = {
  CC: "Cédula de ciudadanía", CE: "Cédula de extranjería", PAS: "Pasaporte", NIT: "NIT",
};

// --------------------------------------------------------------------------- //
// Llamadas a la API
// --------------------------------------------------------------------------- //
export class ErrorApi extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Convierte los errores de Django REST Framework en un texto legible. */
function mensajeDeError(data: unknown): string {
  if (!data) return "Ocurrió un error inesperado.";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(mensajeDeError).join(" ");
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    return Object.entries(obj)
      .map(([campo, msg]) => (campo === "non_field_errors" ? mensajeDeError(msg) : `${campo}: ${mensajeDeError(msg)}`))
      .join(" · ");
  }
  return String(data);
}

/**
 * Llama a la API clínica a través del proxy del panel.
 *   panelFetch<Paginado<Paciente>>("clinica/pacientes", { query: { search: "max" } })
 * Si la sesión venció, manda al login.
 */
export async function panelFetch<T>(
  ruta: string,
  opciones: { method?: "GET" | "POST" | "PATCH" | "PUT"; body?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const qs = opciones.query ? `?${new URLSearchParams(opciones.query)}` : "";
  const res = await fetch(`/api/panel/${ruta.replace(/^\/|\/$/g, "")}${qs}`, {
    method: opciones.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    cache: "no-store",
  });

  if (res.status === 401) {
    const volver = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/panel/login?next=${volver}`;
    throw new ErrorApi("Sesión expirada.", 401);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ErrorApi(mensajeDeError(data), res.status);
  return data as T;
}

// --------------------------------------------------------------------------- //
// Formato
// --------------------------------------------------------------------------- //
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Las fechas "YYYY-MM-DD" se interpretan como día local (sin corrimiento de zona horaria).
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Link de WhatsApp a un celular colombiano (agrega el 57 si hace falta). */
export function whatsappA(telefono: string, mensaje: string): string {
  let n = telefono.replace(/\D/g, "");
  if (n.length === 10 && n.startsWith("3")) n = `57${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}

/** 95000 -> "$95.000" (el mismo formato de la tienda). */
export { formatPrecio as pesos } from "@/lib/api";

/** Fórmula en texto plano para mandarla por WhatsApp. */
export function textoFormula(c: Consulta, h: HistoriaClinica): string {
  const lineas = c.prescripciones.map((m, i) =>
    `${i + 1}. *${m.medicamento}*${m.principio_activo ? ` (${m.principio_activo})` : ""}\n` +
    `   Vía ${VIAS[m.via].toLowerCase()} · ${m.dosis} · ${m.frecuencia} · ${m.duracion_dias} ${m.duracion_dias === 1 ? "día" : "días"}` +
    (m.indicaciones ? `\n   _${m.indicaciones}_` : ""),
  );
  return [
    `Hola ${h.tutor.nombres} 👋, te compartimos la fórmula de *${h.nombre}* 🐾`,
    "",
    `*PataVida · Fórmula médica veterinaria*`,
    `Historia ${h.numero_historia} · ${fechaCorta(c.fecha)}`,
    h.alergias ? `⚠️ Alergias: ${h.alergias}` : null,
    `Diagnóstico: ${c.diagnostico}`,
    "",
    "℞",
    ...(lineas.length ? lineas : ["Sin medicamentos formulados."]),
    c.plan ? `\n*Recomendaciones:* ${c.plan}` : null,
    "",
    `${c.veterinario_nombre} · Médico veterinario · Mat. ${c.veterinario_matricula || "—"}`,
  ].filter((l) => l !== null).join("\n");
}
