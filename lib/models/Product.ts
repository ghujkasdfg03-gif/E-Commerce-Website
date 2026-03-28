import mongoose, { Schema, type Document } from "mongoose";
import type { Category } from "../types";

export interface IProduct extends Document {
  productId: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  description: string;
  specifications: Map<string, string>;
  inStock: boolean;
  featured?: boolean;
  bestDeal?: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["mobiles", "laptops", "tablets", "headphones", "gaming", "accessories"],
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewCount: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    images: [{ type: String }],
    description: { type: String, required: true },
    specifications: { type: Map, of: String },
    inStock: { type: Boolean, required: true, default: true },
    featured: { type: Boolean, default: false },
    bestDeal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ bestDeal: 1 });
ProductSchema.index({ name: "text", description: "text", brand: "text" });

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
