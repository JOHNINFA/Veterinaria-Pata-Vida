import { borrarTokens, origenPermitido } from "@/lib/panel-server";

export async function POST(request: Request) {
  if (!origenPermitido(request)) {
    return Response.json({ detail: "Origen no permitido." }, { status: 403 });
  }
  await borrarTokens();
  return Response.json({ ok: true });
}
