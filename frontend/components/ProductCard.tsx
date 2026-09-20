"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Producto } from "@/lib/types";
import { formatPrecio } from "@/lib/api";
import { useCart } from "@/context/CartContext";

// Un color de fondo suave distinto por categoría: hace que la grilla
// se vea variada y cuidada aunque los productos usen emoji.
const FONDOS: Record<string, string> = {
  perros: "from-amber-50 to-orange-50",
  gatos: "from-teal-50 to-cyan-50",
  veterinaria: "from-sky-50 to-indigo-50",
  accesorios: "from-rose-50 to-amber-50",
};

export default function ProductCard({ producto }: { producto: Producto }) {
  const { agregar } = useCart();
  const [sinFoto, setSinFoto] = useState(false);
  const fondo = FONDOS[producto.categoria_slug] ?? "from-teal-50 to-amber-50";
  const agotado = producto.stock === 0;
  const detalleHref = producto.slug ? `/productos/${producto.slug}` : "/productos";

  // Si el producto tiene slug, buscamos su foto. Si falla (aún no existe),
  // el onError activa el respaldo del emoji.
  const mostrarFoto = Boolean(producto.slug) && !sinFoto;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Zona visual del producto */}
      <Link
        href={detalleHref}
        aria-label={`Ver detalles de ${producto.nombre}`}
        className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${fondo}`}
      >
        {mostrarFoto ? (
          <Image
            src={`/productos/${producto.slug}.jpg`}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setSinFoto(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
            {producto.emoji}
          </span>
        )}

        {producto.destacado && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-black shadow-sm">
            ⭐ Destacado
          </span>
        )}
        {agotado && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">
            Agotado
          </span>
        )}
      </Link>

      {/* Información */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
          {producto.categoria_nombre}
        </span>

        <Link href={detalleHref} className="mt-1 hover:text-brand">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
            {producto.nombre}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs text-black/45">{producto.descripcion}</p>

        {/* Precio + botón, siempre pegados abajo (mt-auto) */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="block text-[10px] uppercase text-black/35">Precio</span>
            <span className="text-lg font-extrabold text-brand-dark">
              {formatPrecio(producto.precio)}
            </span>
          </div>

          <button
            onClick={() => agregar(producto)}
            disabled={agotado}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="flex h-10 items-center gap-1.5 rounded-full bg-accent px-3 text-sm font-bold text-black shadow-sm transition-all duration-300 hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <span className="text-lg leading-none">+</span>
            {/* El texto aparece al pasar el mouse (en pantallas grandes) */}
            <span className="hidden max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[80px] sm:inline">
              Agregar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
