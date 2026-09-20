// Tipos que representan lo que devuelve la API de Django.
// Tenerlos en un solo lugar da autocompletado y evita errores de nombres.

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  emoji: string;
  orden: number;
  total_productos: number;
}

export interface Producto {
  id: number;
  nombre: string;
  slug: string | null; // identifica la foto: /productos/<slug>.jpg
  descripcion: string;
  precio: string; // DRF envía Decimal como string ("129900.00")
  emoji: string;
  imagen: string | null;
  stock: number;
  destacado: boolean;
  categoria: number;
  categoria_nombre: string;
  categoria_slug: string;
}

// Un ítem del carrito = un producto + la cantidad elegida.
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
