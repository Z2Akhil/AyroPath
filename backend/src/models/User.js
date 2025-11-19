import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty/null values
        return validator.isMobilePhone(v, "any", { strictMode: false });
      },
      message: "Invalid mobile number",
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid email address"],
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  password: {
    type: String,
    minlength: [6, "Password must be atleast 6 character long."],
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

export default mongoose.model("User", userSchema);
