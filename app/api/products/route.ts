import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy");
    const featured = searchParams.get("featured");
    const deals = searchParams.get("deals");

    // Build query
    const query: Record<string, unknown> = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (brand) {
      query.brand = { $in: brand.split(",") };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (deals === "true") {
      query.$or = [{ bestDeal: true }, { discount: { $gt: 0 } }];
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sort: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case "price-low":
        sort = { price: 1 };
        break;
      case "price-high":
        sort = { price: -1 };
        break;
      case "popularity":
        sort = { reviewCount: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
      default:
        sort = { reviewCount: -1 };
    }

    const products = await Product.find(query).sort(sort).lean();

    // Transform MongoDB documents to match frontend Product type
    const transformedProducts = products.map((p) => ({
      id: p.productId,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      image: p.image,
      images: p.images,
      description: p.description,
      specifications: p.specifications instanceof Map
        ? Object.fromEntries(p.specifications)
        : p.specifications,
      inStock: p.inStock,
      featured: p.featured,
      bestDeal: p.bestDeal,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
