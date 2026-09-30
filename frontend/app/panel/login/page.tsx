"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso, Campo, claseBoton, claseInput } from "@/components/panel/ui";

// Para el demo del portafolio se pueden mostrar las cuentas de prueba (datos ficticios).
// Solo aparece si se define NEXT_PUBLIC_PANEL_DEMO_PASSWORD.
const CLAVE_DEMO = process.env.NEXT_PUBLIC_PANEL_DEMO_PASSWORD;

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = use(searchParams);
  // Solo volvemos a rutas del propio panel (evita redirigir a sitios externos).
  const destino = next && next.startsWith("/panel") && !next.startsWith("//") ? next : "/panel";

  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent, u = usuario, c = clave) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    const res = await fetch("/api/panel/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: c }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "No se pudo iniciar sesión.");
      return;
    }
    router.replace(destino);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-5xl">🩺</span>
          <h1 className="mt-3 text-2xl font-extrabold">Panel de la clínica</h1>
          <p className="mt-1 text-sm text-black/50">Acceso exclusivo para el personal de PataVida</p>
        </div>

        <form onSubmit={entrar} className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <Campo label="Usuario">
            <input className={claseInput} value={usuario} onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username" required autoFocus />
          </Campo>
          <Campo label="Contraseña">
            <input type="password" className={claseInput} value={clave} onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password" required />
          </Campo>
          {error && <Aviso>{error}</Aviso>}
          <button type="submit" disabled={enviando} className={`${claseBoton} w-full`}>
            {enviando ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        {CLAVE_DEMO && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-bold text-amber-900">🧪 Demo de portafolio (datos ficticios)</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={(e) => entrar(e, "dra.laura", CLAVE_DEMO)}
                className="rounded-xl bg-white px-3 py-2 text-left ring-1 ring-amber-200 hover:bg-amber-100">
                <span className="block font-semibold">🩺 Veterinaria</span>
                <span className="text-xs text-black/50">ve todo lo clínico</span>
              </button>
              <button type="button" onClick={(e) => entrar(e, "recepcion", CLAVE_DEMO)}
                className="rounded-xl bg-white px-3 py-2 text-left ring-1 ring-amber-200 hover:bg-amber-100">
                <span className="block font-semibold">🗂️ Recepción</span>
                <span className="text-xs text-black/50">sin historia clínica</span>
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-brand-dark hover:underline">← Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
