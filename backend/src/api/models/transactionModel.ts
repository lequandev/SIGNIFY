import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  orderCode: number;
  userId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
  checkoutUrl?: string;
  payosOrderCode?: number;
  paymentLinkId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    orderCode: { type: Number, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    checkoutUrl: { type: String },
    payosOrderCode: { type: Number },
    paymentLinkId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
