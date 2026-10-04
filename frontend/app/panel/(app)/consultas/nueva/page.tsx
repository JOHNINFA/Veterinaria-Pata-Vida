"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOJI_ESPECIE, panelFetch, type Paciente } from "@/lib/clinica";
import ConsultaForm from "@/components/panel/ConsultaForm";
import { useSesion } from "@/components/panel/SesionContext";
import { Aviso, Cargando, Encabezado } from "@/components/panel/ui";

export default function NuevaConsultaPage({ searchParams }: {
  searchParams: Promise<{ paciente?: string; cita?: string }>;
}) {
  const { paciente: pacienteId, cita } = use(searchParams);
  const yo = useSesion();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pacienteId) return;
    panelFetch<Paciente>(`clinica/pacientes/${pacienteId}`).then(setPaciente).catch((e) => setError(e.message));
  }, [pacienteId]);

  if (yo.rol !== "veterinario") return <Aviso>Solo un médico veterinario puede registrar consultas.</Aviso>;
  if (!pacienteId) return <Aviso>Falta indicar el paciente.</Aviso>;
  if (error) return <Aviso>{error}</Aviso>;
  if (!paciente) return <Cargando />;

  return (
    <>
      <Link href={`/panel/pacientes/${paciente.id}`} className="text-sm text-brand-dark hover:underline">← {paciente.nombre}</Link>
      <div className="mt-3">
        <Encabezado titulo={`${EMOJI_ESPECIE[paciente.especie]} Nueva consulta · ${paciente.nombre}`}
          subtitulo={`${paciente.numero_historia} · Tutor: ${paciente.tutor_nombre}`} />
      </div>
      {paciente.alergias && (
        <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-700">
          ⚠️ ALERGIAS: {paciente.alergias}
        </div>
      )}
      <ConsultaForm pacienteId={paciente.id} citaId={cita ? Number(cita) : undefined} alGuardar={(c) => router.replace(`/panel/consultas/${c.id}`)} />
    </>
  );
}
