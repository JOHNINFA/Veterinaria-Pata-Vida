import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ProductDetailImage from "@/components/ProductDetailImage";
import { formatPrecio, getProducto, getProductos } from "@/lib/api";
import { getWhatsAppUrl } from "@/lib/contact";
import { Producto } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const producto = await getProducto(slug);
    if (!producto) return { title: "Producto no encontrado | PataVida" };
    return {
      title: `${producto.nombre} | PataVida`,
      description: producto.descripcion,
      openGraph: {
        title: producto.nombre,
        description: producto.descripcion,
        images: producto.slug ? [`/productos/${producto.slug}.jpg`] : [],
      },
    };
  } catch {
    return { title: "Producto | PataVida" };
  }
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  let producto: Producto | null = null;
  let relacionados: Producto[] = [];

  try {
    producto = await getProducto(slug);
    if (producto) {
      relacionados = (await getProductos({ categoria: producto.categoria_slug }))
        .filter((item) => item.slug !== producto?.slug)
        .slice(0, 3);
    }
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="text-5xl" aria-hidden="true">🐾</span>
        <h1 className="mt-4 text-2xl font-extrabold">Estamos actualizando este producto</h1>
        <p className="mt-2 text-black/55">Vuelve en un momento o continúa explorando el catálogo.</p>
        <Link href="/productos" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!producto || !producto.slug) notFound();

  const whatsappUrl = getWhatsAppUrl(
    `¡Hola PataVida! Quiero información sobre ${producto.nombre} 🐾`,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav aria-label="Migas de pan" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-black/50">
        <Link href="/" className="hover:text-brand">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href="/productos" className="hover:text-brand">Productos</Link>
        <span aria-hidden="true">/</span>
        <span className="text-black/75">{producto.nombre}</span>
      </nav>

      <section className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <ProductDetailImage
          slug={producto.slug}
          nombre={producto.nombre}
          emoji={producto.emoji}
        />

        <div className="py-1">
          <Link
            href={`/productos?categoria=${producto.categoria_slug}`}
            className="text-sm font-bold uppercase tracking-wide text-brand"
          >
            {producto.categoria_nombre}
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
            {producto.nombre}
          </h1>
          <p className="mt-5 text-3xl font-extrabold text-brand-dark">
            {formatPrecio(producto.precio)}
          </p>
          <p className="mt-5 leading-relaxed text-black/60">{producto.descripcion}</p>

          <div className="mt-6 flex items-center gap-2 border-y border-black/5 py-4 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${producto.stock > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="font-semibold">
              {producto.stock > 0 ? "Disponible" : "Agotado"}
            </span>
            {producto.stock > 0 && producto.stock < 20 && (
              <span className="text-black/45">· Últimas {producto.stock} unidades</span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton producto={producto} />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-brand px-6 py-3 font-semibold text-brand-dark transition hover:bg-teal-50"
            >
              Consultar por WhatsApp
            </a>
          </div>

          <ul className="mt-7 grid gap-3 text-sm text-black/55 sm:grid-cols-2">
            <li>✓ Compra protegida</li>
            <li>✓ Envío a domicilio</li>
            <li>✓ Atención personalizada</li>
            <li>✓ Calidad garantizada</li>
          </ul>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="mt-16 border-t border-black/5 pt-10">
          <h2 className="text-2xl font-extrabold">También puede interesarte</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {relacionados.map((item) => (
              <ProductCard key={item.id} producto={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
