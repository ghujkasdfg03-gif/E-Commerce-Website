import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import { getProductById } from "@/lib/products";

/**
 * POST /api/orders/checkout
 * Converts the user's cart into an order.
 * Requires a shipping address in the request body.
 * Body: { address: { fullAddress, city, pincode, country? } }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { address } = body;

    // Validate address
    if (!address || !address.fullAddress || !address.city || !address.pincode) {
      return NextResponse.json(
        { error: "Address is required with fullAddress, city, and pincode" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Fetch user's cart
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(auth.userId),
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty. Add items before checkout." },
        { status: 400 }
      );
    }

    // Resolve cart items to order items with product snapshots
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = getProductById(cartItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${cartItem.productId} not found in catalog` },
          { status: 400 }
        );
      }
      if (!product.inStock) {
        return NextResponse.json(
          { error: `Product "${product.name}" is out of stock` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
      });
    }

    // Create the order
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(auth.userId),
      items: orderItems,
      totalAmount,
      status: "pending",
      address: {
        fullAddress: address.fullAddress,
        city: address.city,
        pincode: address.pincode,
        country: address.country || "India",
      },
    });

    // Clear the cart after successful order
    cart.items = [];
    await cart.save();

    return NextResponse.json(
      {
        message: "Order placed successfully",
        order: {
          id: order._id.toString(),
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          address: order.address,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
