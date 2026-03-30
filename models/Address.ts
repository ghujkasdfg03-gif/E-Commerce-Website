import mongoose, { Schema, type Document } from "mongoose";

/**
 * Address document interface for TypeScript type safety.
 * Users can save multiple addresses.
 */
export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullAddress: string;
  city: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullAddress: {
      type: String,
      required: [true, "Full address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address =
  (mongoose.models.Address as mongoose.Model<IAddress>) ??
  mongoose.model<IAddress>("Address", AddressSchema);

export default Address;
