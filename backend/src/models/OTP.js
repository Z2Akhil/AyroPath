import mongoose from "mongoose";
import validator from "validator";

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty for email OTPs
        return validator.isMobilePhone(v, "any", { strictMode: false });
      },
      message: "Invalid mobile number",
    },
  },
  email: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty for mobile OTPs
        return validator.isEmail(v);
      },
      message: "Invalid email address",
    },
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["verification", "forgot_password", "email_verification"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate that either mobileNumber or email is provided
otpSchema.pre("save", function (next) {
  if (!this.mobileNumber && !this.email) {
    return next(new Error("Either mobileNumber or email is required"));
  }
  next();
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.index({
  mobileNumber: 1,
  purpose: 1,
  isUsed: 1,
});

otpSchema.index({
  email: 1,
  purpose: 1,
  isUsed: 1,
});

export default mongoose.model("OTP", otpSchema);
