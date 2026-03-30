import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Wishlist from "@/models/Wishlist";
import { getProductById } from "@/lib/products";

/**
 * POST /api/wishlist/add
 * Adds a product to the authenticated user's wishlist.
 * Body: { productId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { productId } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate product exists
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${productId} not found in catalog` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(auth.userId);

    // Upsert: add productId to the wishlist if not already present
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { products: productId } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: "Product added to wishlist",
      products: wishlist.products,
    });
  } catch (error: unknown) {
    console.error("Add to wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
