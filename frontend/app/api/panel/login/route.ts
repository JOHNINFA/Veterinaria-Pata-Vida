// POST /api/panel/login  { username, password }
// Pide los tokens a Django y los guarda en cookies httpOnly. Al navegador solo le
// devuelve los datos del usuario, nunca el token.
import { DJANGO_API, guardarTokens, origenPermitido } from "@/lib/panel-server";

export async function POST(request: Request) {
  if (!origenPermitido(request)) {
    return Response.json({ detail: "Origen no permitido." }, { status: 403 });
  }
  const { username, password } = await request.json().catch(() => ({}));
  if (!username || !password) {
    return Response.json({ detail: "Ingresa usuario y contraseña." }, { status: 400 });
  }

  const r = await fetch(`${DJANGO_API}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });
  if (r.status === 429) {
    return Response.json({ detail: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }
  if (!r.ok) {
    return Response.json({ detail: "Usuario o contraseña incorrectos." }, { status: 401 });
  }
  const { access, refresh } = await r.json();

  // Solo el personal de la clínica puede entrar al panel.
  const yo = await fetch(`${DJANGO_API}/auth/yo/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  }).then((res) => res.json());
  if (!yo.rol) {
    return Response.json({ detail: "Esta cuenta no pertenece al personal de la clínica." }, { status: 403 });
  }

  await guardarTokens(access, refresh);
  return Response.json(yo);
}
