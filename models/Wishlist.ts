import mongoose, { Schema, type Document } from "mongoose";

/**
 * Wishlist document interface for TypeScript type safety.
 * Each user has one wishlist containing product IDs.
 */
export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  products: string[];
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Wishlist =
  (mongoose.models.Wishlist as mongoose.Model<IWishlist>) ??
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
