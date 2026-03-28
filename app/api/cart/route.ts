import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";

function getSessionId(request: NextRequest): string {
  const sessionId = request.cookies.get("cart_session_id")?.value;
  return sessionId || crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const sessionId = getSessionId(request);
    const cart = await Cart.findOne({ sessionId }).lean();

    if (!cart || cart.items.length === 0) {
      const response = NextResponse.json({ items: [], totalItems: 0, totalPrice: 0 });
      response.cookies.set("cart_session_id", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // Fetch product details for cart items
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ productId: { $in: productIds } }).lean();

    const cartItems = cart.items
      .map((item) => {
        const product = products.find((p) => p.productId === item.productId);
        if (!product) return null;
        return {
          product: {
            id: product.productId,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            rating: product.rating,
            reviewCount: product.reviewCount,
            image: product.image,
            images: product.images,
            description: product.description,
            specifications: product.specifications instanceof Map
              ? Object.fromEntries(product.specifications)
              : product.specifications,
            inStock: product.inStock,
            featured: product.featured,
            bestDeal: product.bestDeal,
          },
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    const totalItems = cartItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + (item?.product.price || 0) * (item?.quantity || 0),
      0
    );

    const response = NextResponse.json({ items: cartItems, totalItems, totalPrice });
    response.cookies.set("cart_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const sessionId = getSessionId(request);
    const body = await request.json();
    const { action, productId, quantity = 1 } = body;

    let cart = await Cart.findOne({ sessionId });

    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    switch (action) {
      case "add": {
        const existingItem = cart.items.find((item) => item.productId === productId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({ productId, quantity });
        }
        break;
      }
      case "remove": {
        cart.items = cart.items.filter((item) => item.productId !== productId);
        break;
      }
      case "update": {
        const item = cart.items.find((item) => item.productId === productId);
        if (item) {
          if (quantity <= 0) {
            cart.items = cart.items.filter((item) => item.productId !== productId);
          } else {
            item.quantity = quantity;
          }
        }
        break;
      }
      case "clear": {
        cart.items = [];
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await cart.save();

    const response = NextResponse.json({ success: true });
    response.cookies.set("cart_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
