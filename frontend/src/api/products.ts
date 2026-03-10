const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Tipos de producto: deben mantenerse alineados con el backend (entidad Product + DTOs).
 * Si el backend cambia campos o validaciones, actualizar aquí y en los formularios.
 */

/** Normaliza el mensaje de error de la API (Nest devuelve { message: string | string[] }). */
function getApiErrorMessage(err: { message?: unknown }, fallback: string): string {
  const msg = err.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  if (typeof msg === 'string') return msg;
  return fallback;
}

export interface Product {
  id: number;
  codigo: string;
  filas: number;
  camadas: number;
  detalle: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getProducts(activoOnly = true): Promise<Product[]> {
  const url = new URL(`${API_BASE}/productos`);
  if (!activoOnly) url.searchParams.set('todos', '1');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function getProductByCodigo(
  codigo: string
): Promise<Product | null> {
  const trimmed = codigo.trim();
  if (!trimmed) return null;
  const res = await fetch(
    `${API_BASE}/productos/codigo/${encodeURIComponent(trimmed)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error al buscar producto');
  return res.json();
}

export type CreateProductBody = {
  codigo: string;
  filas: number;
  camadas: number;
  detalle?: string | null;
  activo?: boolean;
};

export type UpdateProductBody = Partial<CreateProductBody>;

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(err, 'Error al crear producto'));
  }
  return res.json();
}

export async function updateProduct(
  id: number,
  body: UpdateProductBody
): Promise<Product> {
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(err, 'Error al actualizar producto'));
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(err, 'Error al eliminar producto'));
  }
}
