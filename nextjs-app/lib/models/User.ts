import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export interface UserDocument extends Document {
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
    migrationStatus: 'pending' | 'in_progress' | 'completed' | 'not_required';
    lastMigrationReminder?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(userPassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<UserDocument> { }

const userSchema = new Schema<UserDocument, IUserModel>({
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
        required: [true, "Mobile number is required"],
        unique: true,
        validate: {
            validator: function (v: string) {
                return validator.isMobilePhone(v, "any", { strictMode: false });
            },
            message: "Invalid mobile number",
        },
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return validator.isEmail(v);
            },
            message: "Invalid email address",
        },
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
    emailVerificationToken: String,
    emailVerificationExpires: Date,
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
    migrationStatus: {
        type: String,
        enum: ["pending", "in_progress", "completed", "not_required"],
        default: "not_required",
    },
    lastMigrationReminder: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

userSchema.pre("save", async function (this: UserDocument) {
    if (!this.isModified("password")) return;

    if (this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    this.updatedAt = new Date();
});

userSchema.methods.comparePassword = async function (this: UserDocument, userPassword: string) {
    if (!this.password) return false;
    return await bcrypt.compare(userPassword, this.password);
};

const User = (mongoose.models.User as IUserModel) || mongoose.model<UserDocument, IUserModel>("User", userSchema);

export default User;
