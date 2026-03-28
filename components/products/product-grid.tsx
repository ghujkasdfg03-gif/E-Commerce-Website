"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { categories } from "@/lib/products";
import { fetchProducts } from "@/lib/api";
import type { Category, FilterState, Product, SortOption } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "./product-filters";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { SearchX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function sortProducts(products: Product[], sortBy: FilterState["sortBy"]): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-high":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted;
    case "popularity":
    default:
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  }
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popularity", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export function ProductGrid() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as Category | null;
  const searchQuery = searchParams.get("search");
  const dealsFilter = searchParams.get("filter") === "deals";

  // Check if a specific category is selected from navbar
  const hasSpecificCategory = !!categoryParam;

  const [filters, setFilters] = useState<FilterState>({
    category: categoryParam || "all",
    priceRange: [0, 3000],
    brands: [],
    sortBy: "popularity",
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from MongoDB via API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchProducts({
      category: filters.category !== "all" ? filters.category : undefined,
      search: searchQuery || undefined,
      deals: dealsFilter || undefined,
      sortBy: filters.sortBy,
    })
      .then((data) => {
        if (!cancelled) {
          setAllProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.category, filters.sortBy, searchQuery, dealsFilter]);

  // Update category filter when URL param changes
  useEffect(() => {
    if (categoryParam && categoryParam !== filters.category) {
      setFilters((prev) => ({ ...prev, category: categoryParam }));
    } else if (!categoryParam && filters.category !== "all") {
      setFilters((prev) => ({ ...prev, category: "all" }));
    }
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // Apply price filter (client-side for responsiveness)
    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Apply brand filter (client-side for responsiveness)
    if (filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand));
    }

    return sortProducts(result, filters.sortBy);
  }, [allProducts, filters.priceRange, filters.brands, filters.sortBy]);

  // Get category name for display
  const categoryName = categoryParam
    ? categories.find((c) => c.id === categoryParam)?.name
    : null;

  const handleSortChange = (value: SortOption) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If a specific category is selected, show simplified view without filters
  if (hasSpecificCategory) {
    return (
      <div>
        {/* Category header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{categoryName}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} products
            </p>
          </div>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredProducts.length === 0 ? (
          <Empty
            icon={SearchX}
            title="No products found"
            description="No products available in this category."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default view with filters for "All Products"
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
      <ProductFilters
        filters={filters}
        onFilterChange={setFilters}
        productCount={filteredProducts.length}
      />

      <div className="flex-1">
        {/* Desktop sort bar */}
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredProducts.length === 0 ? (
          <Empty
            icon={SearchX}
            title="No products found"
            description="Try adjusting your filters or search query to find what you're looking for."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
