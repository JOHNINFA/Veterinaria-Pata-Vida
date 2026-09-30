"use client";

// PÁGINA CARRITO — muestra los items y un formulario para confirmar el pedido.
// Al enviar, llama a la API de Django que crea el Pedido en PostgreSQL.

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { crearPedido, formatPrecio } from "@/lib/api";
import { getWhatsAppUrl } from "@/lib/contact";

// Lo que devuelve la API al crear el pedido (datos confirmados por el servidor)
interface PedidoConfirmado {
  id: number;
  nombre_cliente: string;
  direccion: string;
  total: string;
  items: { producto_nombre: string; cantidad: number; precio_unitario: string }[];
}

// Arma el mensaje de WhatsApp con el detalle del pedido.
// Usa los precios que confirmó el servidor, no los del navegador.
function mensajePedido(p: PedidoConfirmado): string {
  const lineas = p.items.map(
    (i) => `• ${i.cantidad}x ${i.producto_nombre} — ${formatPrecio(Number(i.precio_unitario) * i.cantidad)}`,
  );
  return [
    `¡Hola PataVida! 🐾 Acabo de hacer el pedido #${p.id}:`,
    "",
    ...lineas,
    "",
    `*Total: ${formatPrecio(p.total)}*`,
    `A nombre de: ${p.nombre_cliente}`,
    p.direccion ? `Dirección: ${p.direccion}` : "",
  ].filter((l, idx, arr) => l !== "" || arr[idx - 1] !== "").join("\n");
}

export default function CarritoPage() {
  const { items, cambiarCantidad, quitar, totalPrecio, vaciar } = useCart();
  const [form, setForm] = useState({ nombre_cliente: "", telefono: "", direccion: "", nota: "" });
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState<PedidoConfirmado | null>(null);
  const [error, setError] = useState("");

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const confirmado: PedidoConfirmado = await crearPedido({
        ...form,
        items: items.map((i) => ({ producto: i.producto.id, cantidad: i.cantidad })),
      });
      setPedido(confirmado);
      vaciar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el pedido");
    } finally {
      setEnviando(false);
    }
  }

  // Pantalla de éxito
  if (pedido) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="mt-4 text-2xl font-extrabold">¡Pedido #{pedido.id} confirmado!</h1>
        <p className="mt-2 text-black/60">
          Total: <strong className="text-brand-dark">{formatPrecio(pedido.total)}</strong>
        </p>
        <p className="mt-1 text-black/60">
          Envíanos el pedido por WhatsApp para coordinar la entrega más rápido. 🐾
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={getWhatsAppUrl(mensajePedido(pedido))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white transition hover:bg-[#20bd5a]"
          >
            💬 Enviar pedido por WhatsApp
          </a>
          <Link href="/productos" className="rounded-full border border-brand px-6 py-3 font-bold text-brand-dark transition hover:bg-teal-50">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold">Tu carrito está vacío</h1>
        <Link href="/productos" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-bold text-white">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
      {/* Lista de items */}
      <div>
        <h1 className="mb-4 text-2xl font-extrabold">Tu pedido</h1>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.producto.id} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 text-3xl">
                {item.producto.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.producto.nombre}</p>
                <p className="text-sm text-brand-dark">{formatPrecio(item.producto.precio)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                  className="h-8 w-8 rounded-full bg-gray-100 font-bold hover:bg-gray-200">−</button>
                <span className="w-6 text-center">{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                  className="h-8 w-8 rounded-full bg-gray-100 font-bold hover:bg-gray-200">+</button>
              </div>
              <button onClick={() => quitar(item.producto.id)} className="text-sm text-red-500 hover:underline">
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen + formulario */}
      <div className="h-fit rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Datos de entrega</h2>
        <form onSubmit={confirmar} className="mt-4 space-y-3">
          <input required placeholder="Nombre completo" value={form.nombre_cliente}
            onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <input required placeholder="Teléfono / WhatsApp" value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <input placeholder="Dirección" value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />
          <textarea placeholder="Nota (opcional)" value={form.nota} rows={2}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand" />

          <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span className="text-brand-dark">{formatPrecio(totalPrecio)}</span>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={enviando}
            className="w-full rounded-xl bg-accent py-3 font-bold text-black transition hover:brightness-95 disabled:opacity-50">
            {enviando ? "Enviando..." : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </div>
  );
}
