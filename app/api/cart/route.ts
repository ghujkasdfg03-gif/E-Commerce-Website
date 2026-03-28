import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/models/Cart";
import mongoose from "mongoose";

/**
 * GET /api/cart?userId=...
 * Fetches the cart items for a given user.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate that userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the cart for this user, or return an empty items array
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
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
 * Saves/updates the entire cart for a user.
 * Uses upsert so a cart is created if it doesn't exist yet.
 * Body: { userId: string, items: Array<{ productId: string, quantity: number }> }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, items } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items must be an array" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upsert: update existing cart or create a new one
    const cart = await Cart.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
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
