"use client";

// Layout de las pantallas protegidas: verifica la sesión y dibuja el menú lateral.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { panelFetch, type Yo } from "@/lib/clinica";
import { SesionContext } from "@/components/panel/SesionContext";
import { Cargando } from "@/components/panel/ui";

const MENU = [
  { href: "/panel", label: "Tablero", icono: "📊", roles: ["veterinario", "recepcion"] },
  { href: "/panel/pacientes", label: "Pacientes", icono: "🐾", roles: ["veterinario", "recepcion"] },
  { href: "/panel/citas", label: "Solicitudes de cita", icono: "📅", roles: ["veterinario", "recepcion"] },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [yo, setYo] = useState<Yo | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Si no hay sesión, panelFetch manda al login automáticamente.
    panelFetch<Yo>("auth/yo").then(setYo).catch(() => {});
  }, []);

  async function salir() {
    await fetch("/api/panel/logout", { method: "POST" });
    router.replace("/panel/login");
  }

  if (!yo) return <Cargando texto="Verificando sesión..." />;

  const activo = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));

  return (
    <SesionContext.Provider value={yo}>
      <div className="flex min-h-screen">
        {/* Menú lateral (se oculta al imprimir) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-dark text-white transition-transform print:hidden
                      md:static md:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-full flex-col p-5">
            <Link href="/panel" className="flex items-center gap-2 text-lg font-extrabold">
              <span className="text-2xl">🩺</span> PataVida <span className="font-normal text-white/60">Clínica</span>
            </Link>

            <nav className="mt-8 space-y-1">
              {MENU.filter((m) => yo.rol && m.roles.includes(yo.rol)).map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    activo(m.href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10"
                  }`}
                >
                  <span>{m.icono}</span> {m.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto rounded-xl bg-white/10 p-3 text-sm">
              <p className="font-semibold">{yo.nombre}</p>
              <p className="text-xs text-white/60">
                {yo.rol === "veterinario" ? `Médico veterinario · ${yo.matricula}` : "Recepción"}
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/" className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-center text-xs hover:bg-white/20">
                  Ver tienda
                </Link>
                <button onClick={salir} className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </aside>

        {menuAbierto && (
          <div onClick={() => setMenuAbierto(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra superior en celular */}
          <header className="flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden print:hidden">
            <button onClick={() => setMenuAbierto(true)} className="text-2xl" aria-label="Abrir menú">☰</button>
            <span className="font-bold">🩺 PataVida Clínica</span>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </SesionContext.Provider>
  );
}
