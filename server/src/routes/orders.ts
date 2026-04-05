import { Router } from "express";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import { getProductById } from "@/lib/products";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await connectToDatabase();

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      orders: orders.map((order) => ({
        id: order._id.toString(),
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        address: order.address,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { address } = req.body;

    if (!address || !address.fullAddress || !address.city || !address.pincode) {
      return res.status(400).json({
        error: "Address is required with fullAddress, city, and pincode",
      });
    }

    await connectToDatabase();

    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: "Cart is empty. Add items before checkout.",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = getProductById(cartItem.productId);
      if (!product) {
        return res.status(400).json({
          error: `Product ${cartItem.productId} not found in catalog`,
        });
      }
      if (!product.inStock) {
        return res.status(400).json({
          error: `Product "${product.name}" is out of stock`,
        });
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

    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
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

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        id: order._id.toString(),
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        address: order.address,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
