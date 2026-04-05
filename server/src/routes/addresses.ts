import { Router } from "express";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Address from "@/models/Address";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await connectToDatabase();

    const addresses = await Address.find({
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return res.json({
      addresses: addresses.map((addr) => ({
        id: addr._id.toString(),
        fullAddress: addr.fullAddress,
        city: addr.city,
        pincode: addr.pincode,
        country: addr.country,
        isDefault: addr.isDefault,
      })),
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { fullAddress, city, pincode, country, isDefault } = req.body;

    if (!fullAddress || !city || !pincode) {
      return res.status(400).json({
        error: "fullAddress, city, and pincode are required",
      });
    }

    if (
      typeof fullAddress !== "string" ||
      typeof city !== "string" ||
      typeof pincode !== "string"
    ) {
      return res.status(400).json({
        error: "fullAddress, city, and pincode must be strings",
      });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const address = await Address.create({
      userId,
      fullAddress: fullAddress.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      country: country?.trim() || "India",
      isDefault: Boolean(isDefault),
    });

    if (isDefault) {
      await Address.updateMany(
        { userId, isDefault: true, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );
    }

    return res.status(201).json({
      address: {
        id: address._id.toString(),
        fullAddress: address.fullAddress,
        city: address.city,
        pincode: address.pincode,
        country: address.country,
        isDefault: address.isDefault,
      },
    });
  } catch (error) {
    console.error("Create address error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid address ID" });
    }

    await connectToDatabase();

    const address = await Address.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
