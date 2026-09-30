// HOME — Server Component: obtiene los datos desde la API de Django
// en el servidor y los renderiza. Los productos destacados y categorías.

import Link from "next/link";
import { getCategorias, getProductos } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryCard from "@/components/CategoryCard";
import { Categoria, Producto } from "@/lib/types";

export default async function Home() {
  // Pedimos datos en paralelo (más rápido que uno tras otro)
  let categorias: Categoria[] = [];
  let destacados: Producto[] = [];
  try {
    [categorias, destacados] = await Promise.all([
      getCategorias(),
      getProductos({ destacados: true }),
    ]);
  } catch {
    // Si el backend está apagado, la página igual carga (sin datos)
  }

  return (
    <>
      {/* HERO — carrusel de 3 banners (cambia solo cada 5s) */}
      <HeroCarousel />

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-6xl px-4 py-14 2xl:max-w-7xl">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Nuestro catálogo
          </span>
          <h2 className="mt-1 text-3xl font-extrabold">Explora por categoría</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-black/50">
            Todo lo que tu mascota necesita, organizado para que lo encuentres rápido.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          {categorias.map((c) => (
            <CategoryCard key={c.id} categoria={c} />
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="mx-auto max-w-6xl px-4 pb-14 2xl:max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand">
              Lo más pedido
            </span>
            <h2 className="mt-1 text-3xl font-extrabold">⭐ Destacados</h2>
          </div>
          <Link
            href="/productos"
            className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Ver todo →
          </Link>
        </div>
        {destacados.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Estamos actualizando el catálogo. Vuelve en un momento 🐾
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destacados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </section>

      {/* BENEFICIOS */}
      <section className="border-t border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3 2xl:max-w-7xl">
          {[
            ["🚚", "Envío a domicilio", "Recibe tu pedido el mismo día en toda la ciudad."],
            ["🩺", "Veterinarios certificados", "Consultas, vacunación y peluquería profesional."],
            ["💚", "Calidad garantizada", "Marcas premium seleccionadas para su bienestar."],
          ].map(([emoji, titulo, texto]) => (
            <div
              key={titulo}
              className="flex flex-col items-center rounded-2xl p-6 text-center transition hover:bg-teal-50/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 text-3xl">
                {emoji}
              </div>
              <h3 className="mt-4 font-bold">{titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-black/50">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LLAMADO FINAL */}
      <section className="bg-gradient-to-r from-brand to-brand-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center text-white sm:flex-row sm:justify-between sm:text-left 2xl:max-w-7xl">
          <div>
            <h2 className="text-2xl font-extrabold">¿Tu mascota necesita atención? 🐾</h2>
            <p className="mt-1 text-white/80">
              Agenda una cita con nuestros veterinarios o escríbenos por WhatsApp.
            </p>
          </div>
          <Link
            href="/contacto"
            className="whitespace-nowrap rounded-full bg-accent px-7 py-3 font-bold text-black transition hover:brightness-95"
          >
            Contáctanos
          </Link>
        </div>
      </section>
    </>
  );
}
