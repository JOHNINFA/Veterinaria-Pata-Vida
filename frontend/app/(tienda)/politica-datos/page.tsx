import type { Metadata } from "next";
import Link from "next/link";
import { WHATSAPP_DISPLAY } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos | PataVida",
  description: "Política de tratamiento de datos personales de PataVida.",
};

export default function PoliticaDatosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 2xl:max-w-5xl">
      <span className="inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">Documento de demostración (portafolio)</span>
      <h1 className="mt-5 text-4xl font-extrabold">Política de tratamiento de datos personales</h1>
      <p className="mt-3 text-sm text-black/50">En cumplimiento de la Ley 1581 de 2012 y sus normas reglamentarias.</p>

      <div className="mt-10 space-y-8 rounded-2xl bg-white p-6 leading-relaxed shadow-sm ring-1 ring-black/5 sm:p-10">
        <Seccion titulo="1. Responsable del tratamiento">
          <p>PataVida, proyecto demostrativo de tienda y clínica veterinaria ubicado en Medellín, Colombia, es el responsable del tratamiento de los datos suministrados a través de este sitio.</p>
        </Seccion>
        <Seccion titulo="2. Datos y finalidades">
          <p>Los datos de contacto y la información básica de la mascota se utilizarán exclusivamente para gestionar solicitudes y prestar la atención requerida.</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Coordinar y prestar la atención de la mascota.</li>
            <li>Confirmar, modificar o cancelar citas solicitadas.</li>
            <li>Enviar recordatorios de vacunas, controles y cuidados preventivos.</li>
            <li>Contactar al tutor sobre servicios relacionados con la solicitud.</li>
          </ul>
        </Seccion>
        <Seccion titulo="3. Derechos del titular">
          <p>Como titular de los datos personales, puedes conocer, actualizar y rectificar tu información; solicitar prueba de la autorización; conocer el uso dado a tus datos; revocar la autorización o solicitar la supresión cuando sea procedente; y presentar quejas ante la Superintendencia de Industria y Comercio.</p>
        </Seccion>
        <Seccion titulo="4. Autorización y conservación">
          <p>El envío del formulario requiere una autorización previa, expresa e informada. Los datos se conservarán únicamente durante el tiempo razonable y necesario para cumplir las finalidades descritas o las obligaciones legales aplicables. La historia clínica de la mascota, por su naturaleza, se conserva como mínimo cinco (5) años desde la última atención, según la guía del Consejo Profesional de Medicina Veterinaria y Zootecnia, y es reservada al equipo veterinario (Ley 576 de 2000).</p>
        </Seccion>
        <Seccion titulo="5. Canal de atención">
          <p>Puedes ejercer tus derechos o realizar consultas y reclamos mediante nuestro canal de WhatsApp ({WHATSAPP_DISPLAY}) o desde la página de <Link href="/contacto" className="font-semibold text-brand hover:underline">contacto</Link>. La solicitud debe permitir identificar al titular y explicar claramente la petición.</p>
        </Seccion>
        <Seccion titulo="6. Vigencia">
          <p>Esta política entra en vigencia desde el 29 de septiembre de 2026. Cualquier cambio sustancial será informado mediante este sitio web.</p>
        </Seccion>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-brand-dark">{titulo}</h2>
      <div className="mt-2 text-sm text-black/65 sm:text-base">{children}</div>
    </section>
  );
}
