"use client";

// El carrito vive en el navegador (localStorage) y se comparte con toda la app
// mediante un Context de React. Así cualquier página puede leer/agregar productos.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ItemCarrito, Producto } from "@/lib/types";

interface CartContextType {
  items: ItemCarrito[];
  agregar: (producto: Producto) => void;
  quitar: (productoId: number) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  vaciar: () => void;
  totalItems: number;
  totalPrecio: number;
  abierto: boolean;
  setAbierto: (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "patavida_carrito";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [carritoCargado, setCarritoCargado] = useState(false);

  // Al cargar, leemos el carrito guardado en localStorage
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    let itemsGuardados: ItemCarrito[] = [];
    if (guardado) {
      try {
        itemsGuardados = JSON.parse(guardado);
      } catch {
        itemsGuardados = [];
      }
    }

    const timer = window.setTimeout(() => {
      setItems(itemsGuardados);
      setCarritoCargado(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Cada vez que cambia el carrito, lo guardamos
  useEffect(() => {
    if (!carritoCargado) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, carritoCargado]);

  function agregar(producto: Producto) {
    setItems((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        // Ya está en el carrito -> sumamos 1 a la cantidad
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setAbierto(true); // abre el panel del carrito al agregar
  }

  function quitar(productoId: number) {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    if (cantidad < 1) return quitar(productoId);
    setItems((prev) =>
      prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
    );
  }

  function vaciar() {
    setItems([]);
  }

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const totalPrecio = items.reduce(
    (s, i) => s + parseFloat(i.producto.precio) * i.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items, agregar, quitar, cambiarCantidad, vaciar,
        totalItems, totalPrecio, abierto, setAbierto,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook para usar el carrito en cualquier componente: const cart = useCart();
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
