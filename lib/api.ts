import type { Product } from "./types";

const API_BASE = "/api";

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  featured?: boolean;
  deals?: boolean;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();

  if (params?.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params?.search) searchParams.set("search", params.search);
  if (params?.brand) searchParams.set("brand", params.brand);
  if (params?.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.featured) searchParams.set("featured", "true");
  if (params?.deals) searchParams.set("deals", "true");

  const queryString = searchParams.toString();
  const url = `${API_BASE}/products${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export async function fetchCategories(): Promise<
  { id: string; name: string; icon: string }[]
> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchBrands(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/brands`);
  if (!res.ok) throw new Error("Failed to fetch brands");
  return res.json();
}

export async function cartAction(
  action: "add" | "remove" | "update" | "clear",
  productId?: string,
  quantity?: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, productId, quantity }),
  });
  if (!res.ok) throw new Error("Failed to update cart");
}

export async function fetchCart(): Promise<{
  items: { product: Product; quantity: number }[];
  totalItems: number;
  totalPrice: number;
}> {
  const res = await fetch(`${API_BASE}/cart`);
  if (!res.ok) throw new Error("Failed to fetch cart");
  return res.json();
}

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed database");
  return res.json();
}
