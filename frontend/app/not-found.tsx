import type { Metadata } from "next";
import Link from "next/link";
import TiendaShell from "@/components/TiendaShell";

export const metadata: Metadata = {
  title: "Página no encontrada | PataVida",
};

export default function NotFound() {
  return (
    <TiendaShell>
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-6xl" aria-hidden="true">🐾</span>
      <p className="mt-5 text-sm font-bold uppercase tracking-wider text-brand">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Esta página dejó sus huellas en otro lugar</h1>
      <p className="mt-3 text-black/55">La dirección no existe o el contenido ya no está disponible.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-white">Ir al inicio</Link>
        <Link href="/productos" className="rounded-full border border-brand px-6 py-3 font-semibold text-brand-dark">Ver productos</Link>
      </div>
    </div>
    </TiendaShell>
  );
}
