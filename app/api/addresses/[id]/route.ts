import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authenticateRequest, isAuthError } from "@/lib/auth-middleware";
import Address from "@/models/Address";

/**
 * DELETE /api/addresses/[id]
 * Deletes an address by ID for the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const address = await Address.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(auth.userId),
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
