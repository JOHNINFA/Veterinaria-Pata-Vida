import TiendaShell from "@/components/TiendaShell";

// Layout de la tienda pública. Los paréntesis de "(tienda)" agrupan rutas sin cambiar la URL.
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <TiendaShell>{children}</TiendaShell>;
}
