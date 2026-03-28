"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight, Flame } from "lucide-react";

export function BestDeals() {
  const [bestDeals, setBestDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ deals: true })
      .then(setBestDeals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-background py-12 md:py-16">
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <Flame className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Best Deals</h2>
              <p className="text-muted-foreground">
                Limited time offers you don&apos;t want to miss
              </p>
            </div>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/products?filter=deals">
              All Deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {bestDeals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
