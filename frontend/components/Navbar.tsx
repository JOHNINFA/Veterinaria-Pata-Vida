"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const { totalItems, setAbierto } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold">
          <span className="text-2xl">🐾</span> PataVida
        </Link>

        {/* Links */}
        <div className="hidden gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition hover:text-accent ${
                pathname === l.href ? "text-accent" : "text-white/90"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Carrito */}
        <button
          onClick={() => setAbierto(true)}
          className="relative flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold transition hover:bg-black/20"
        >
          🛒 <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              {totalItems}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
