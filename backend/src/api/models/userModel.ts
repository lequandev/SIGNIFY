import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'creator' | 'admin';
  activeSubscription?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
    activeSubscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
