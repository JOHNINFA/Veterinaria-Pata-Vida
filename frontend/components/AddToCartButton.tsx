"use client";

import { useCart } from "@/context/CartContext";
import { Producto } from "@/lib/types";

export default function AddToCartButton({ producto }: { producto: Producto }) {
  const { agregar, setAbierto } = useCart();
  const agotado = producto.stock === 0;

  function handleAdd() {
    agregar(producto);
    setAbierto(true);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={agotado}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-black shadow-sm transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
    >
      <span aria-hidden="true">🛒</span>
      {agotado ? "Agotado" : "Agregar al carrito"}
    </button>
  );
}
