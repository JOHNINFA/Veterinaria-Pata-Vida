"use client";

// TARJETA DE CATEGORÍA
// Muestra una foto real (public/categorias/<slug>.jpg). Si esa foto todavía
// no existe, hace "fallback" al emoji para que la página nunca se vea rota.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Categoria } from "@/lib/types";

export default function CategoryCard({ categoria }: { categoria: Categoria }) {
  const [sinFoto, setSinFoto] = useState(false);
  const src = `/categorias/${categoria.slug}.jpg`;

  return (
    <Link
      href={`/productos?categoria=${categoria.slug}`}
      className="group relative block overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Zona de la imagen (cuadrada) */}
      <div className="relative aspect-square bg-gradient-to-br from-teal-50 to-amber-50">
        {sinFoto ? (
          // Respaldo: emoji grande centrado
          <div className="flex h-full items-center justify-center text-6xl sm:text-7xl">
            {categoria.emoji}
          </div>
        ) : (
          <Image
            src={src}
            alt={`Productos para ${categoria.nombre}`}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            onError={() => setSinFoto(true)} // si la foto no existe, usa el emoji
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Degradado inferior para que el texto blanco se lea */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      </div>

      {/* Texto encima de la imagen */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="flex items-center gap-1.5 text-lg font-bold text-white drop-shadow">
          <span className="text-xl">{categoria.emoji}</span>
          {categoria.nombre}
        </h3>
        <p className="text-xs text-white/80">{categoria.total_productos} productos</p>
      </div>

      {/* Flecha que aparece al pasar el mouse */}
      <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-2 items-center justify-center rounded-full bg-accent text-black opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
