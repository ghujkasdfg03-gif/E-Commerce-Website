import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile from the database.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    await connectToDatabase();

    const user = await User.findById(auth.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's profile in the database.
 * Accepts: { name?, phone? }
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { name, phone } = body;

    // Build update object with only provided fields
    const updates: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return NextResponse.json(
          { error: "Phone must be a string" },
          { status: 400 }
        );
      }
      updates.phone = phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update. Provide name or phone." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: unknown) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
