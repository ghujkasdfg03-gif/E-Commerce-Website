import { Router } from "express";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();
const allowedStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

router.get(
  "/overview",
  requireAuth,
  requireRole(["admin"]),
  async (_req: AuthenticatedRequest, res) => {
    try {
      await connectToDatabase();

      const [
        totalUsers,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        revenueResult,
        recentOrders,
      ] = await Promise.all([
        User.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "delivered" }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      ]);

      const userIds = recentOrders.map((order) => order.userId);
      const users = await User.find({ _id: { $in: userIds } })
        .select("name email")
        .lean();
      const userMap = new Map(
        users.map((user) => [
          user._id.toString(),
          { name: user.name, email: user.email },
        ])
      );

      return res.json({
        metrics: {
          totalUsers,
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalRevenue: revenueResult[0]?.total || 0,
        },
        recentOrders: recentOrders.map((order) => ({
          id: order._id.toString(),
          user: userMap.get(order.userId.toString()) || null,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
        })),
      });
    } catch (error) {
      console.error("Admin overview error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.patch(
  "/orders/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid order status" });
      }

      await connectToDatabase();

      const order = await Order.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      ).lean();

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json({
        order: {
          id: order._id.toString(),
          status: order.status,
        },
      });
    } catch (error) {
      console.error("Update admin order error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
