// Product and Cart Types for ElectroStore

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  description: string;
  specifications: Record<string, string>;
  inStock: boolean;
  featured?: boolean;
  bestDeal?: boolean;
}

export type Category =
  | "mobiles"
  | "laptops"
  | "tablets"
  | "headphones"
  | "gaming"
  | "accessories";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export type SortOption = "price-low" | "price-high" | "popularity" | "newest";

export interface FilterState {
  category: Category | "all";
  priceRange: [number, number];
  brands: string[];
  sortBy: SortOption;
}
