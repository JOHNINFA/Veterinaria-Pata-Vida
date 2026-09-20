// Datos de contacto de la tienda.
// El número real se define en la variable de entorno NEXT_PUBLIC_WHATSAPP
// (archivo .env.local en desarrollo, panel de Vercel en producción).
// Aquí solo queda un número de ejemplo para que el proyecto corra recién clonado.

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP || "573001234567";

// Versión legible del número, derivada del mismo valor:
// "573001234567" -> "+57 300 123 4567"
export const WHATSAPP_DISPLAY = formatearNumero(WHATSAPP_NUMBER);

export const LOCATION = "Medellín, Colombia";

function formatearNumero(numero: string): string {
  // Formato colombiano: +57 3XX XXX XXXX
  const limpio = numero.replace(/\D/g, "");
  if (limpio.startsWith("57") && limpio.length === 12) {
    const n = limpio.slice(2);
    return `+57 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  return `+${limpio}`;
}

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
