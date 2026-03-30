"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartItems } from "@/components/cart/cart-items";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { items } = useCart();

  return (
    <div className="bg-background py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-foreground">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <ShoppingCart />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Your cart is empty</EmptyTitle>
              <EmptyDescription>
                Looks like you haven't added anything to your cart yet. Browse our products and find something you'll love!
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild className="mt-4">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </Empty>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CartItems />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <CartSummary />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
