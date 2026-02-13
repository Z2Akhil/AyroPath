import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AdminSessionDocument extends Document {
    adminId: mongoose.Types.ObjectId;
    thyrocareApiKey: string;
    thyrocareAccessToken: string;
    thyrocareRespId: string;
    sessionToken?: string;
    ipAddress: string;
    userAgent: string;
    apiKeyExpiresAt: Date;
    accessTokenExpiresAt: Date;
    sessionExpiresAt: Date;
    isActive: boolean;
    lastUsedAt: Date;
    requestCount: number;
    lastProductFetch?: Date;
    createdAt: Date;
    updatedAt: Date;
    isApiKeyExpired(): boolean;
    isAccessTokenExpired(): boolean;
    isSessionExpired(): boolean;
    isValid(): boolean;
    refreshUsage(): Promise<void>;
}

interface IAdminSessionModel extends Model<AdminSessionDocument> {
    createFromThyroCare(adminId: mongoose.Types.ObjectId, thyrocareData: any, ipAddress: string, userAgent?: string): Promise<AdminSessionDocument>;
    findActiveByApiKey(apiKey: string): Promise<AdminSessionDocument | null>;
    deactivatePreviousSessions(adminId: mongoose.Types.ObjectId): Promise<number>;
    createSingleActiveSession(adminId: mongoose.Types.ObjectId, thyrocareData: any, ipAddress: string, userAgent?: string): Promise<AdminSessionDocument>;
}

const adminSessionSchema = new Schema<AdminSessionDocument, IAdminSessionModel>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
        thyrocareApiKey: { type: String, required: true },
        thyrocareAccessToken: { type: String, required: true },
        thyrocareRespId: { type: String, required: true },
        sessionToken: { type: String, unique: true, sparse: true },
        ipAddress: { type: String, required: true },
        userAgent: { type: String, default: '' },
        apiKeyExpiresAt: {
            type: Date,
            required: true,
            default: () => {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                return tomorrow;
            },
        },
        accessTokenExpiresAt: { type: Date, required: true },
        sessionExpiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        isActive: { type: Boolean, default: true },
        lastUsedAt: { type: Date, default: Date.now },
        requestCount: { type: Number, default: 0 },
        lastProductFetch: { type: Date, default: null },
    },
    { timestamps: true }
);

adminSessionSchema.methods.isApiKeyExpired = function () {
    return new Date() > this.apiKeyExpiresAt;
};

adminSessionSchema.methods.isAccessTokenExpired = function () {
    return new Date() > this.accessTokenExpiresAt;
};

adminSessionSchema.methods.isSessionExpired = function () {
    return new Date() > this.sessionExpiresAt;
};

adminSessionSchema.methods.isValid = function () {
    return this.isActive && !this.isApiKeyExpired() && !this.isSessionExpired();
};

adminSessionSchema.methods.refreshUsage = async function () {
    this.lastUsedAt = new Date();
    this.requestCount += 1;
    await this.save();
};

adminSessionSchema.statics.createFromThyroCare = async function (this: IAdminSessionModel, adminId, thyrocareData, ipAddress, userAgent = '') {
    const apiKeyExpiresAt = new Date();
    apiKeyExpiresAt.setDate(apiKeyExpiresAt.getDate() + 1);
    apiKeyExpiresAt.setHours(0, 0, 0, 0);
    const accessTokenExpiresAt = new Date(thyrocareData.exp * 1000 || Date.now() + 3600000);
    const sessionExpiresAt = new Date(apiKeyExpiresAt);

    const session = new this({
        adminId,
        thyrocareApiKey: thyrocareData.apiKey,
        thyrocareAccessToken: thyrocareData.accessToken,
        thyrocareRespId: thyrocareData.respId,
        ipAddress,
        userAgent,
        apiKeyExpiresAt,
        accessTokenExpiresAt,
        sessionExpiresAt,
        isActive: true,
    });
    await session.save();
    return session;
};

adminSessionSchema.statics.findActiveByApiKey = async function (this: IAdminSessionModel, apiKey) {
    return await this.findOne({ thyrocareApiKey: apiKey, isActive: true }).sort({ createdAt: -1 }).populate('adminId');
};

adminSessionSchema.statics.deactivatePreviousSessions = async function (this: IAdminSessionModel, adminId) {
    const result = await this.updateMany({ adminId, isActive: true }, { isActive: false, updatedAt: new Date() });
    return result.modifiedCount;
};

adminSessionSchema.statics.createSingleActiveSession = async function (this: IAdminSessionModel, adminId, thyrocareData, ipAddress, userAgent = '') {
    await this.deactivatePreviousSessions(adminId);
    return await this.createFromThyroCare(adminId, thyrocareData, ipAddress, userAgent);
};

const AdminSession = (mongoose.models.AdminSession as IAdminSessionModel) || mongoose.model<AdminSessionDocument, IAdminSessionModel>('AdminSession', adminSessionSchema);

export default AdminSession;
