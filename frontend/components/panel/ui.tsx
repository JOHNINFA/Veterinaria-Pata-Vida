// Piezas visuales pequeñas que comparten todas las pantallas del panel.
import type { ReactNode } from "react";

export const claseInput =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none transition " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-black/60";

export function Campo({ label, children, ayuda, className = "" }: {
  label: string; children: ReactNode; ayuda?: string; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/55">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-black/40">{ayuda}</span>}
    </label>
  );
}

export function Tarjeta({ titulo, accion, children, className = "" }: {
  titulo?: ReactNode; accion?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-black/5 bg-white p-5 shadow-sm ${className}`}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-base font-bold">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Encabezado({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-black/50">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

export function Cargando({ texto = "Cargando..." }: { texto?: string }) {
  return <p className="animate-pulse py-10 text-center text-sm text-black/40">{texto}</p>;
}

export function Aviso({ tipo = "error", children }: { tipo?: "error" | "ok" | "info"; children: ReactNode }) {
  const estilos = {
    error: "border-red-200 bg-red-50 text-red-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${estilos[tipo]}`}>{children}</div>;
}

export function Etiqueta({ children, color = "gris" }: { children: ReactNode; color?: "gris" | "verde" | "ambar" | "rojo" | "azul" }) {
  const colores = {
    gris: "bg-gray-100 text-gray-700",
    verde: "bg-emerald-100 text-emerald-800",
    ambar: "bg-amber-100 text-amber-800",
    rojo: "bg-red-100 text-red-700",
    azul: "bg-sky-100 text-sky-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colores[color]}`}>{children}</span>;
}

export const claseBoton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white " +
  "transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50";
export const claseBotonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 py-2.5 " +
  "text-sm font-semibold text-black/75 transition hover:bg-gray-50 disabled:opacity-50";
