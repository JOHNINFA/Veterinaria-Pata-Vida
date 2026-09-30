// Proxy del panel: /api/panel/<ruta> -> Django /api/<ruta>, agregando el JWT de la cookie.
// Si el token venció, lo renueva una vez con el refresh token y reintenta.
import { cookies } from "next/headers";
import {
  borrarTokens, COOKIE_ACCESS, COOKIE_REFRESH, DJANGO_API, guardarTokens, origenPermitido,
} from "@/lib/panel-server";

// Lista blanca: el proxy solo alcanza el módulo clínico y "quién soy".
// Evita que alguien lo use para llegar a cualquier otra URL (SSRF).
function rutaPermitida(partes: string[]): boolean {
  if (partes.some((p) => p === ".." || p === "." || p.includes("\\") || p.includes(":"))) return false;
  if (partes[0] === "clinica") return true;
  return partes[0] === "auth" && partes[1] === "yo" && partes.length === 2;
}

async function renovarAccess(): Promise<string | null> {
  const refresh = (await cookies()).get(COOKIE_REFRESH)?.value;
  if (!refresh) return null;
  const r = await fetch(`${DJANGO_API}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  const { access } = await r.json();
  await guardarTokens(access);
  return access;
}

async function reenviar(request: Request, ctx: { params: Promise<{ ruta: string[] }> }) {
  if (!origenPermitido(request)) {
    return Response.json({ detail: "Origen no permitido." }, { status: 403 });
  }
  const { ruta } = await ctx.params;
  if (!rutaPermitida(ruta)) {
    return Response.json({ detail: "Ruta no permitida." }, { status: 404 });
  }

  const query = new URL(request.url).search;
  const destino = `${DJANGO_API}/${ruta.map(encodeURIComponent).join("/")}/${query}`;
  const cuerpo = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();

  const llamar = (token: string) =>
    fetch(destino, {
      method: request.method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: cuerpo,
      cache: "no-store",
    });

  let access = (await cookies()).get(COOKIE_ACCESS)?.value || (await renovarAccess());
  if (!access) return Response.json({ detail: "Sesión expirada." }, { status: 401 });

  let r = await llamar(access);
  if (r.status === 401) {
    access = await renovarAccess();
    if (!access) {
      await borrarTokens();
      return Response.json({ detail: "Sesión expirada." }, { status: 401 });
    }
    r = await llamar(access);
  }

  return new Response(r.status === 204 ? null : await r.text(), {
    status: r.status,
    headers: { "Content-Type": r.headers.get("Content-Type") || "application/json" },
  });
}

export { reenviar as GET, reenviar as POST, reenviar as PATCH, reenviar as PUT };
