import mongoose, { Schema, type Document } from "mongoose";

/**
 * Represents a single item in an order.
 * Stores snapshot data (name, price) at time of purchase.
 */
export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Shipping address embedded in the order.
 */
export interface IOrderAddress {
  fullAddress: string;
  city: string;
  pincode: string;
  country: string;
}

/**
 * Order document interface for TypeScript type safety.
 */
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  address: IOrderAddress;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    address: {
      type: OrderAddressSchema,
      required: true,
    },
  },
  { timestamps: true }
);

const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ??
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
