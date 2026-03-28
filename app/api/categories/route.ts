import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function GET() {
  try {
    await dbConnect();

    const categories = await Product.distinct("category");

    const categoryInfo = [
      { id: "mobiles", name: "Mobiles", icon: "smartphone" },
      { id: "laptops", name: "Laptops", icon: "laptop" },
      { id: "tablets", name: "Tablets", icon: "tablet" },
      { id: "headphones", name: "Headphones", icon: "headphones" },
      { id: "gaming", name: "Gaming", icon: "gamepad-2" },
      { id: "accessories", name: "Accessories", icon: "cable" },
    ];

    // Only return categories that exist in the database
    const availableCategories = categoryInfo.filter((cat) =>
      categories.includes(cat.id)
    );

    return NextResponse.json(availableCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
