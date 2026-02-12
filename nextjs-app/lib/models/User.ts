import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  address?: string;
  city?: string;
  state?: string;
  password?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => validator.isMobilePhone(v, 'any', { strictMode: false }),
        message: 'Invalid mobile number',
      },
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      validate: {
        validator: (v: string) => !v || validator.isEmail(v),
        message: 'Invalid email address',
      },
    },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    address: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 50 },
    state: { type: String, trim: true, maxlength: 50 },
    password: { type: String, minlength: 6, select: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;