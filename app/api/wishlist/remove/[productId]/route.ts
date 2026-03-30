import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Wishlist from "@/models/Wishlist";

/**
 * DELETE /api/wishlist/remove/[productId]
 * Removes a product from the authenticated user's wishlist.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(auth.userId) },
      { $pull: { products: productId } },
      { new: true }
    );

    return NextResponse.json({
      message: "Product removed from wishlist",
      products: wishlist ? wishlist.products : [],
    });
  } catch (error: unknown) {
    console.error("Remove from wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
