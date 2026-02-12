import mongoose, { Schema, Document } from 'mongoose';
import validator from 'validator';

export interface IOTP extends Document {
  mobileNumber?: string;
  email?: string;
  otp: string;
  verificationId?: string;
  purpose: 'verification' | 'forgot_password' | 'email_verification' | 'forgot_password_email';
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  provider: 'Fast2SMS' | 'MessageCentral' | 'Mock' | 'Email';
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    mobileNumber: {
      type: String,
      validate: {
        validator: (v: string) => !v || validator.isMobilePhone(v, 'any', { strictMode: false }),
        message: 'Invalid mobile number',
      },
    },
    email: {
      type: String,
      validate: {
        validator: (v: string) => !v || validator.isEmail(v),
        message: 'Invalid email address',
      },
    },
    otp: { type: String, required: true },
    verificationId: { type: String, sparse: true },
    purpose: {
      type: String,
      enum: ['verification', 'forgot_password', 'email_verification', 'forgot_password_email'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    isUsed: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ['Fast2SMS', 'MessageCentral', 'Mock', 'Email'],
      default: 'Mock',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

otpSchema.pre('save', function () {
  if (!this.mobileNumber && !this.email) {
    throw new Error('Either mobileNumber or email is required');
  }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', otpSchema);
export default OTP;