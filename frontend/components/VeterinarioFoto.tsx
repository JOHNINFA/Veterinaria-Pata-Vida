"use client";

import Image from "next/image";
import { useState } from "react";

export default function VeterinarioFoto({ src, nombre }: { src: string; nombre: string }) {
  const [sinFoto, setSinFoto] = useState(false);

  return (
    <div className="relative aspect-[3/4] min-h-80 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 ring-1 ring-black/5">
      {sinFoto || !src ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-7xl" aria-hidden="true">🩺</span>
          <p className="text-sm font-medium text-brand-dark">Equipo veterinario PataVida</p>
        </div>
      ) : (
        <Image
          src={src}
          alt={`Retrato de ${nombre}, médica veterinaria`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 40vw"
          onError={() => setSinFoto(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}
