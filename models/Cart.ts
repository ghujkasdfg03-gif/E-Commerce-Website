import mongoose, { Schema, type Document } from "mongoose";

/**
 * Represents a single item in the cart.
 * Stores the product ID and quantity — product details are
 * resolved client-side from the static product catalog.
 */
export interface ICartItem {
  productId: string;
  quantity: number;
}

/**
 * Cart document interface for TypeScript type safety.
 * Each cart is linked to a user via userId.
 */
export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    // Disable _id for subdocuments since productId is the identifier
    _id: false,
  }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One cart per user
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during Next.js hot reloads
const Cart =
  (mongoose.models.Cart as mongoose.Model<ICart>) ??
  mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
