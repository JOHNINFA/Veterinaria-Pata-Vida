import type { Metadata } from "next";
import {
  getWhatsAppUrl,
  LOCATION,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contacto | PataVida 🐾",
};

export default function ContactoPage() {
  const whatsappUrl = getWhatsAppUrl(
    "¡Hola PataVida! Quiero información sobre sus productos y servicios 🐾",
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Contáctanos</h1>
      <p className="mt-1 text-black/50">
        ¿Dudas sobre un producto o quieres agendar una cita veterinaria? Escríbenos.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Datos */}
        <div className="space-y-4">
          {[
            ["📍", "Ubicación", LOCATION, null],
            ["📞", "Teléfono", WHATSAPP_DISPLAY, `tel:+${WHATSAPP_NUMBER}`],
            ["💬", "WhatsApp", WHATSAPP_DISPLAY, whatsappUrl],
            ["🕒", "Horario", "Lunes a Sábado, 8:00am – 7:00pm", null],
          ].map(([emoji, titulo, dato, href]) => (
            <div key={titulo} className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="font-semibold">{titulo}</p>
                {href ? (
                  <a
                    href={href}
                    target={titulo === "WhatsApp" ? "_blank" : undefined}
                    rel={titulo === "WhatsApp" ? "noopener noreferrer" : undefined}
                    className="text-sm text-brand-dark hover:underline"
                  >
                    {dato}
                  </a>
                ) : (
                  <p className="text-sm text-black/60">{dato}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Formulario (demo visual) */}
        <form className="space-y-3 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Envíanos un mensaje</h2>
          <input placeholder="Tu nombre" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <input placeholder="Correo o teléfono" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <textarea placeholder="¿En qué te ayudamos?" rows={4} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <button type="button" className="w-full rounded-xl bg-brand py-3 font-bold text-white transition hover:bg-brand-dark">
            Enviar mensaje
          </button>
          <p className="text-center text-xs text-black/40">Demo de portafolio · formulario visual</p>
        </form>
      </div>
    </div>
  );
}
