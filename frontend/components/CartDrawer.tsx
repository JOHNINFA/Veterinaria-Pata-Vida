"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrecio } from "@/lib/api";

export default function CartDrawer() {
  const { items, abierto, setAbierto, cambiarCantidad, quitar, totalPrecio } = useCart();

  return (
    <>
      {/* Fondo oscuro al abrir */}
      <div
        onClick={() => setAbierto(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          abierto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold">🛒 Tu carrito</h2>
          <button onClick={() => setAbierto(false)} className="text-2xl leading-none text-black/50 hover:text-black">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-black/40">
            <span className="text-5xl">🐾</span>
            <p>Tu carrito está vacío.</p>
            <Link href="/productos" onClick={() => setAbierto(false)} className="mt-2 font-semibold text-brand hover:underline">
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((item) => (
                <div key={item.producto.id} className="flex gap-3 rounded-xl border border-black/5 p-2">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-3xl">
                    {item.producto.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{item.producto.nombre}</p>
                    <p className="text-xs text-brand-dark">{formatPrecio(item.producto.precio)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}
                        className="h-6 w-6 rounded-full bg-gray-100 font-bold hover:bg-gray-200">−</button>
                      <span className="w-6 text-center text-sm">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                        className="h-6 w-6 rounded-full bg-gray-100 font-bold hover:bg-gray-200">+</button>
                      <button onClick={() => quitar(item.producto.id)}
                        className="ml-auto text-xs text-red-500 hover:underline">Quitar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4">
              <div className="mb-3 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-brand-dark">{formatPrecio(totalPrecio)}</span>
              </div>
              <Link
                href="/carrito"
                onClick={() => setAbierto(false)}
                className="block rounded-xl bg-accent py-3 text-center font-bold text-black transition hover:brightness-95"
              >
                Finalizar pedido →
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
