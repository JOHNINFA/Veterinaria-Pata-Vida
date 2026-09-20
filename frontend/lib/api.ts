// Funciones para hablar con la API de Django.
// Todas usan fetch (nativo, sin librerías extra).

import { Categoria, Producto } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// DRF pagina las respuestas: { count, next, previous, results: [...] }
interface Paginado<T> {
  results: T[];
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" }); // siempre datos frescos
  if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`);
  return res.json();
}

export async function getCategorias(): Promise<Categoria[]> {
  const data = await getJSON<Paginado<Categoria>>(`${API}/categorias/`);
  return data.results;
}

export async function getProductos(params?: {
  categoria?: string;
  destacados?: boolean;
  buscar?: string;
}): Promise<Producto[]> {
  const q = new URLSearchParams();
  if (params?.categoria) q.set("categoria", params.categoria);
  if (params?.destacados) q.set("destacados", "1");
  if (params?.buscar) q.set("buscar", params.buscar);

  const url = `${API}/productos/${q.toString() ? "?" + q.toString() : ""}`;
  const data = await getJSON<Paginado<Producto>>(url);
  return data.results;
}

export async function getProducto(slug: string): Promise<Producto | null> {
  const res = await fetch(`${API}/productos/${encodeURIComponent(slug)}/`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Error ${res.status} al pedir el producto`);
  return res.json();
}

// Envía el carrito al backend para crear un pedido real.
export async function crearPedido(payload: {
  nombre_cliente: string;
  telefono: string;
  direccion?: string;
  nota?: string;
  items: { producto: number; cantidad: number }[];
}) {
  const res = await fetch(`${API}/pedidos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "No se pudo crear el pedido");
  }
  return res.json();
}

// Formatea 129900 -> "$129.900" (formato colombiano)
export function formatPrecio(valor: string | number): string {
  const n = typeof valor === "string" ? parseFloat(valor) : valor;
  return "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}
