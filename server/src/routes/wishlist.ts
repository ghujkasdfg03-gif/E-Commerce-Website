import { Router } from "express";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import { getProductById } from "@/lib/products";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await connectToDatabase();

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    }).lean();

    return res.json({ products: wishlist ? wishlist.products : [] });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/add", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.body;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        error: "productId is required and must be a string",
      });
    }

    const product = getProductById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ error: `Product ${productId} not found in catalog` });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { products: productId } },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Product added to wishlist",
      products: wishlist.products,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete(
  "/remove/:productId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ error: "productId is required" });
      }

      await connectToDatabase();

      const wishlist = await Wishlist.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(req.user!.userId) },
        { $pull: { products: productId } },
        { new: true }
      );

      return res.json({
        message: "Product removed from wishlist",
        products: wishlist ? wishlist.products : [],
      });
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
