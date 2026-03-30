import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/models/Cart";
import mongoose from "mongoose";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import { getProductById } from "@/lib/products";

/**
 * GET /api/cart
 * Fetches the cart items for the authenticated user.
 * Requires JWT token in Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    await connectToDatabase();

    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(auth.userId),
    });

    return NextResponse.json({
      items: cart ? cart.items : [],
    });
  } catch (error: unknown) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Saves/updates the entire cart for the authenticated user.
 * Uses upsert so a cart is created if it doesn't exist yet.
 * Requires JWT token in Authorization header.
 * Body: { items: Array<{ productId: string, quantity: number }> }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items must be an array" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== "string") {
        return NextResponse.json(
          { error: "Each item must have a valid productId string" },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a quantity >= 1" },
          { status: 400 }
        );
      }
      // Validate product exists in catalog
      const product = getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found in catalog` },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(auth.userId);

    // Upsert: update existing cart or create a new one
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      items: cart.items,
    });
  } catch (error: unknown) {
    console.error("Save cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
