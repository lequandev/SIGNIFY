import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description: string;
  price: string; // Changed to string to handle 'Custom' and formatted values
  currency: string;
  features: { icon?: string; text: string }[]; // Updated to support icons
  duration: string;
  planType: 'individual' | 'business';
  badge?: string;
  isRecommended?: boolean;
  buttonText: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    currency: { type: String, default: 'VND' },
    features: [
      {
        icon: { type: String },
        text: { type: String, required: true },
      },
    ],
    duration: { type: String, required: true },
    planType: {
      type: String,
      enum: ['individual', 'business'],
      default: 'individual',
    },
    badge: { type: String },
    isRecommended: { type: Boolean, default: false },
    buttonText: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPackage>('Package', PackageSchema);
