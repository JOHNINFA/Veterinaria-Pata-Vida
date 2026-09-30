"use client";

// Guarda quién inició sesión (nombre y rol) para que cualquier pantalla del panel
// pueda mostrar u ocultar secciones. El rol real lo valida SIEMPRE Django.
import { createContext, useContext } from "react";
import type { Yo } from "@/lib/clinica";

export const SesionContext = createContext<Yo | null>(null);

export function useSesion(): Yo {
  const yo = useContext(SesionContext);
  if (!yo) throw new Error("useSesion debe usarse dentro del panel");
  return yo;
}
