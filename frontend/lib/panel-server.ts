// Utilidades de SERVIDOR para la sesión del panel veterinario.
// El JWT vive en cookies httpOnly: el JavaScript del navegador nunca lo ve,
// así un script malicioso (XSS) no puede robar la sesión.
// Solo se importa desde route handlers (usa next/headers, que no existe en el navegador).
import { cookies } from "next/headers";

// URL de Django vista desde el servidor de Next.
export const DJANGO_API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const COOKIE_ACCESS = "pv_access";
export const COOKIE_REFRESH = "pv_refresh";

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // en producción solo por HTTPS
  sameSite: "lax" as const,                        // bloquea envíos desde otros sitios (CSRF)
  path: "/api/panel",                              // la cookie solo viaja a estas rutas
};

export async function guardarTokens(access: string, refresh?: string) {
  const c = await cookies();
  c.set(COOKIE_ACCESS, access, { ...base, maxAge: 60 * 30 });            // 30 min (igual que Django)
  if (refresh) c.set(COOKIE_REFRESH, refresh, { ...base, maxAge: 60 * 60 * 24 }); // 1 día
}

export async function borrarTokens() {
  const c = await cookies();
  c.set(COOKIE_ACCESS, "", { ...base, maxAge: 0 });
  c.set(COOKIE_REFRESH, "", { ...base, maxAge: 0 });
}

/**
 * Protección extra contra CSRF: en peticiones que modifican datos, el Origin
 * del navegador debe ser nuestro propio sitio.
 */
export function origenPermitido(request: Request): boolean {
  if (["GET", "HEAD"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return new URL(origin).host === new URL(request.url).host;
}
