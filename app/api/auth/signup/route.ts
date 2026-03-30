import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth-middleware";

/**
 * POST /api/auth/signup
 * Registers a new user with hashed password.
 * Returns the user object (without password) on success.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Check if a user with this email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
    });

    // Return user data without the password, plus token
    return NextResponse.json(
      {
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
