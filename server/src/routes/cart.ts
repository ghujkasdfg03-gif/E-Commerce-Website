import { Router } from "express";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Cart from "@/models/Cart";
import { getProductById } from "@/lib/products";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await connectToDatabase();

    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    });

    return res.json({ items: cart ? cart.items : [] });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }

    for (const item of items) {
      if (!item.productId || typeof item.productId !== "string") {
        return res
          .status(400)
          .json({ error: "Each item must have a valid productId string" });
      }
      if (
        !item.quantity ||
        typeof item.quantity !== "number" ||
        item.quantity < 1
      ) {
        return res
          .status(400)
          .json({ error: "Each item must have a quantity >= 1" });
      }

      const product = getProductById(item.productId);
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product ${item.productId} not found in catalog` });
      }
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ items: cart.items });
  } catch (error) {
    console.error("Save cart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
