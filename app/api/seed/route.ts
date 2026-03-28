import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { products } from "@/lib/products";

export async function POST() {
  try {
    await dbConnect();

    // Clear existing products
    await Product.deleteMany({});

    // Insert products from the hardcoded data
    const productDocs = products.map((p) => ({
      productId: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      image: p.image,
      images: p.images || [],
      description: p.description,
      specifications: new Map(Object.entries(p.specifications)),
      inStock: p.inStock,
      featured: p.featured || false,
      bestDeal: p.bestDeal || false,
    }));

    await Product.insertMany(productDocs);

    return NextResponse.json({
      success: true,
      message: `Seeded ${productDocs.length} products successfully`,
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
