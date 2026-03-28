"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product, CartItem, CartState } from "./types";
import { useAuth } from "./auth-context";
import { getProductById } from "./products";

interface CartContextType extends CartState {
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  return items.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + item.quantity,
      totalPrice: acc.totalPrice + item.product.price * item.quantity,
    }),
    { totalItems: 0, totalPrice: 0 }
  );
}

/**
 * Sync the current cart items to the database for the given user.
 * Only sends productId and quantity (not the full product object).
 */
async function syncCartToDb(userId: string, items: CartItem[]) {
  try {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });
  } catch (error) {
    console.error("Failed to sync cart to database:", error);
  }
}

/**
 * Fetch cart items from the database for the given user.
 * Resolves productIds back to full Product objects using the static catalog.
 */
async function fetchCartFromDb(userId: string): Promise<CartItem[]> {
  try {
    const res = await fetch(`/api/cart?userId=${userId}`);
    if (!res.ok) return [];

    const data = await res.json();
    const cartItems: CartItem[] = [];

    for (const item of data.items) {
      const product = getProductById(item.productId);
      if (product) {
        cartItems.push({ product, quantity: item.quantity });
      }
    }

    return cartItems;
  } catch (error) {
    console.error("Failed to fetch cart from database:", error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  // Track the previous user ID to detect login/logout transitions
  const prevUserIdRef = useRef<string | null>(null);

  /**
   * When the user logs in, fetch their saved cart from the database.
   * When they log out, clear the local cart state.
   */
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const previousUserId = prevUserIdRef.current;

    // User just logged in (transition from no user to a user)
    if (currentUserId && currentUserId !== previousUserId) {
      fetchCartFromDb(currentUserId).then((dbItems) => {
        setItems(dbItems);
      });
    }

    // User just logged out (transition from a user to no user)
    if (!currentUserId && previousUserId) {
      setItems([]);
    }

    prevUserIdRef.current = currentUserId;
  }, [user]);

  /**
   * Helper: update items and sync to DB in one step.
   */
  const updateAndSync = useCallback(
    (updater: (currentItems: CartItem[]) => CartItem[]) => {
      setItems((currentItems) => {
        const newItems = updater(currentItems);
        // Sync to database if user is logged in
        if (user?.id) {
          syncCartToDb(user.id, newItems);
        }
        return newItems;
      });
    },
    [user]
  );

  const addToCart = useCallback(
    (product: Product, quantity: number = 1) => {
      updateAndSync((currentItems) => {
        const existingItem = currentItems.find((item) => item.product.id === product.id);

        if (existingItem) {
          return currentItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...currentItems, { product, quantity }];
      });
    },
    [updateAndSync]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      updateAndSync((currentItems) =>
        currentItems.filter((item) => item.product.id !== productId)
      );
    },
    [updateAndSync]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      updateAndSync((currentItems) =>
        currentItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart, updateAndSync]
  );

  const clearCart = useCallback(() => {
    updateAndSync(() => []);
  }, [updateAndSync]);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  const { totalItems, totalPrice } = calculateTotals(items);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
