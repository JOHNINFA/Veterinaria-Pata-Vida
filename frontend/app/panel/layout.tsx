import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel veterinario | PataVida",
  robots: { index: false, follow: false }, // el panel no debe aparecer en Google
};

export default function PanelRaizLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f4f6f5]">{children}</div>;
}
