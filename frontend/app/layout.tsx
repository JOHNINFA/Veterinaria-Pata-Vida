import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "PataVida 🐾 | Tienda y Veterinaria",
    template: "%s",
  },
  description:
    "Alimento, accesorios y servicios veterinarios para tu mascota. Envío a domicilio. Tienda demo full-stack: Next.js + Django + PostgreSQL.",
  openGraph: {
    title: "PataVida | Tienda y Veterinaria",
    description:
      "Alimentos, accesorios y atención veterinaria para perros y gatos.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* La tienda y el panel veterinario tienen cada uno su propio layout */}
        {children}
      </body>
    </html>
  );
}
