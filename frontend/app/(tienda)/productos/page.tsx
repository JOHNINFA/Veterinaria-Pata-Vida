// CATÁLOGO — filtra productos por categoría usando el parámetro ?categoria=
// En Next 15 searchParams llega como Promise, por eso el await.

import type { Metadata } from "next";
import Link from "next/link";
import { getCategorias, getProductos } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Categoria, Producto } from "@/lib/types";

export const metadata: Metadata = {
  title: "Productos para mascotas | PataVida",
  description:
    "Alimentos, accesorios y servicios veterinarios para perros y gatos en PataVida.",
};

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  let categorias: Categoria[] = [];
  let productos: Producto[] = [];
  try {
    [categorias, productos] = await Promise.all([
      getCategorias(),
      getProductos({ categoria }),
    ]);
  } catch {
    /* backend apagado */
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Nuestros productos</h1>
      <p className="mt-1 text-black/50">Encuentra todo lo que tu mascota necesita.</p>

      {/* Filtros por categoría (chips) */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        <FiltroChip label="Todos" href="/productos" activo={!categoria} />
        {categorias.map((c) => (
          <FiltroChip
            key={c.id}
            label={`${c.emoji} ${c.nombre}`}
            href={`/productos?categoria=${c.slug}`}
            activo={categoria === c.slug}
          />
        ))}
      </div>

      {/* Grid de productos */}
      {productos.length === 0 ? (
        <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Estamos actualizando el catálogo. Vuelve en un momento 🐾
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FiltroChip({ label, href, activo }: { label: string; href: string; activo: boolean }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
        activo ? "bg-brand text-white" : "bg-white text-black/70 hover:bg-teal-50"
      }`}
    >
      {label}
    </Link>
  );
}
