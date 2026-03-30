import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Order from "@/models/Order";

/**
 * GET /api/orders
 * Returns the authenticated user's order history, newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    await connectToDatabase();

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(auth.userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order._id.toString(),
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        address: order.address,
        createdAt: order.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
