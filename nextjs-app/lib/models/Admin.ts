import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface AdminDocument extends Document {
    username: string;
    email: string;
    mobile: string;
    name: string;
    thyrocareUserId?: string;
    userType: 'DSA' | 'NSA' | 'OTHER';
    userTypeId: number;
    respId?: string;
    verKey?: string;
    status: boolean;
    isPrepaid: 'Y' | 'N';
    trackingPrivilege: 'Y' | 'N';
    otpAccess: 'Y' | 'N';
    address?: string;
    loyaltyDiscount?: number;
    dsaWebLink?: string;
    assignType?: string;
    exceptionalPincode?: string;
    hcLchc?: string;
    password?: string;
    role: 'super_admin' | 'admin' | 'moderator';
    isActive: boolean;
    lastLogin?: Date;
    loginCount: number;
    createdAt: Date;
    updatedAt: Date;
    verifyPassword(password: string): Promise<boolean>;
    updatePassword(password: string): Promise<void>;
}

interface IAdminModel extends Model<AdminDocument> {
    findOrCreateFromThyroCare(thyrocareData: any, username: string): Promise<AdminDocument>;
    findByUsername(username: string): Promise<AdminDocument | null>;
}

const adminSchema = new Schema<AdminDocument, IAdminModel>(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        mobile: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        thyrocareUserId: { type: String, unique: true, sparse: true },
        userType: { type: String, enum: ['DSA', 'NSA', 'OTHER'], default: 'DSA' },
        userTypeId: { type: Number, default: 3 },
        respId: { type: String, unique: true, sparse: true },
        verKey: { type: String },
        status: { type: Boolean, default: true },
        isPrepaid: { type: String, enum: ['Y', 'N'], default: 'Y' },
        trackingPrivilege: { type: String, enum: ['Y', 'N'], default: 'N' },
        otpAccess: { type: String, enum: ['Y', 'N'], default: 'N' },
        address: { type: String, trim: true },
        loyaltyDiscount: { type: Number, default: null },
        dsaWebLink: { type: String, default: null },
        assignType: { type: String, default: null },
        exceptionalPincode: { type: String, default: null },
        hcLchc: { type: String, default: null },
        password: { type: String, required: false },
        role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        loginCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

adminSchema.statics.findOrCreateFromThyroCare = async function (this: IAdminModel, thyrocareData, username) {
    let admin = await this.findOne({
        $or: [{ email: thyrocareData.email?.toLowerCase() }, { mobile: thyrocareData.mobile }, { thyrocareUserId: thyrocareData.respId }],
    });

    if (admin) {
        admin.name = thyrocareData.name || admin.name;
        admin.userType = thyrocareData.userType || admin.userType;
        admin.userTypeId = thyrocareData.userTypeId || admin.userTypeId;
        admin.respId = thyrocareData.respId || admin.respId;
        admin.verKey = thyrocareData.verKey || admin.verKey;
        admin.status = thyrocareData.status !== undefined ? thyrocareData.status : admin.status;
        admin.isPrepaid = thyrocareData.isPrepaid || admin.isPrepaid;
        admin.trackingPrivilege = thyrocareData.trackingPrivilege || admin.trackingPrivilege;
        admin.otpAccess = thyrocareData.otpAccess || admin.otpAccess;
        admin.lastLogin = new Date();
        admin.loginCount += 1;
        await admin.save();
        return admin;
    } else {
        admin = new this({
            username,
            email: thyrocareData.email?.toLowerCase(),
            mobile: thyrocareData.mobile,
            name: thyrocareData.name,
            thyrocareUserId: thyrocareData.respId,
            userType: thyrocareData.userType,
            userTypeId: thyrocareData.userTypeId,
            respId: thyrocareData.respId,
            verKey: thyrocareData.verKey,
            status: thyrocareData.status !== undefined ? thyrocareData.status : true,
            isPrepaid: thyrocareData.isPrepaid || 'Y',
            trackingPrivilege: thyrocareData.trackingPrivilege || 'N',
            otpAccess: thyrocareData.otpAccess || 'N',
            lastLogin: new Date(),
            loginCount: 1,
        });
        await admin.save();
        return admin;
    }
};

adminSchema.methods.verifyPassword = async function (password: string) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

adminSchema.methods.updatePassword = async function (password: string) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(password, saltRounds);
    await this.save();
};

adminSchema.statics.findByUsername = async function (username: string) {
    return await this.findOne({ username });
};

const Admin = (mongoose.models.Admin as IAdminModel) || mongoose.model<AdminDocument, IAdminModel>('Admin', adminSchema);

export default Admin;
