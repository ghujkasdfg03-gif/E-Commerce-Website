import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Address from "@/models/Address";

/**
 * GET /api/addresses
 * Returns all addresses for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    await connectToDatabase();

    const addresses = await Address.find({
      userId: new mongoose.Types.ObjectId(auth.userId),
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      addresses: addresses.map((addr) => ({
        id: addr._id.toString(),
        fullAddress: addr.fullAddress,
        city: addr.city,
        pincode: addr.pincode,
        country: addr.country,
        isDefault: addr.isDefault,
      })),
    });
  } catch (error: unknown) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses
 * Creates a new address for the authenticated user.
 * Body: { fullAddress, city, pincode, country?, isDefault? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { fullAddress, city, pincode, country, isDefault } = body;

    if (!fullAddress || !city || !pincode) {
      return NextResponse.json(
        { error: "fullAddress, city, and pincode are required" },
        { status: 400 }
      );
    }

    if (typeof fullAddress !== "string" || typeof city !== "string" || typeof pincode !== "string") {
      return NextResponse.json(
        { error: "fullAddress, city, and pincode must be strings" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(auth.userId);

    // If this address is set as default, unset any existing default
    if (isDefault) {
      await Address.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      userId,
      fullAddress: fullAddress.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      country: country?.trim() || "India",
      isDefault: isDefault || false,
    });

    return NextResponse.json(
      {
        address: {
          id: address._id.toString(),
          fullAddress: address.fullAddress,
          city: address.city,
          pincode: address.pincode,
          country: address.country,
          isDefault: address.isDefault,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
