import Link from "next/link";
import { getWhatsAppUrl, LOCATION, WHATSAPP_DISPLAY } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-dark text-white/90">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-white">
            🐾 PataVida
          </h3>
          <p className="text-sm text-white/70">
            Tienda y veterinaria para el bienestar de tu mejor amigo. Alimento,
            accesorios y servicios de salud con envío a domicilio.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-white">Navegación</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-accent">Inicio</Link></li>
            <li><Link href="/productos" className="hover:text-accent">Productos</Link></li>
            <li><Link href="/quienes-somos" className="hover:text-accent">Quiénes somos</Link></li>
            <li><Link href="/carrito" className="hover:text-accent">Carrito</Link></li>
            <li><Link href="/contacto" className="hover:text-accent">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-white">Contacto</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>📍 {LOCATION}</li>
            <li>
              <a
                href={getWhatsAppUrl("¡Hola PataVida! Quiero recibir información 🐾")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                💬 {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>🕒 Lun–Sáb, 8am–7pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} PataVida · Demo de portafolio · Next.js + Django + PostgreSQL
      </div>
    </footer>
  );
}
