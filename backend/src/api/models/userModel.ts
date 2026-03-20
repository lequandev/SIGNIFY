import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  googleId?: string;
  phoneNumber?: string;
  address?: string;
  role: 'individual' | 'business';
  isVerified: boolean;
  verificationToken?: string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
