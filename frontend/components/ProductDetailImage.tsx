"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductDetailImage({
  slug,
  nombre,
  emoji,
}: {
  slug: string;
  nombre: string;
  emoji: string;
}) {
  const [sinFoto, setSinFoto] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 ring-1 ring-black/5">
      {sinFoto ? (
        <div className="flex h-full items-center justify-center text-8xl">{emoji}</div>
      ) : (
        <Image
          src={`/productos/${slug}.jpg`}
          alt={nombre}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={() => setSinFoto(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}
