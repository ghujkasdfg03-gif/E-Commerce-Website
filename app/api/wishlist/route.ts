import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Wishlist from "@/models/Wishlist";

/**
 * GET /api/wishlist
 * Returns the authenticated user's wishlist product IDs.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    await connectToDatabase();

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(auth.userId),
    }).lean();

    return NextResponse.json({
      products: wishlist ? wishlist.products : [],
    });
  } catch (error: unknown) {
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
