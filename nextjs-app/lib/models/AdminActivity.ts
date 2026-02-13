import mongoose, { Schema, Document, Model } from 'mongoose';
import Admin from './Admin';

export interface AdminActivityDocument extends Document {
    adminId: mongoose.Types.ObjectId;
    sessionId?: mongoose.Types.ObjectId;
    action: string;
    description: string;
    resource?: string;
    resourceId?: string;
    endpoint?: string;
    method?: string;
    ipAddress?: string;
    userAgent?: string;
    statusCode?: number;
    responseTime?: number;
    errorMessage?: string;
    metadata?: any;
    createdAt: Date;
}

interface IAdminActivityModel extends Model<AdminActivityDocument> {
    logActivity(activityData: any): Promise<AdminActivityDocument>;
}

const adminActivitySchema = new Schema<AdminActivityDocument, IAdminActivityModel>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
        sessionId: { type: Schema.Types.ObjectId, ref: 'AdminSession' },
        action: { type: String, required: true },
        description: { type: String, required: true },
        resource: { type: String },
        resourceId: { type: String },
        endpoint: { type: String },
        method: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
        statusCode: { type: Number },
        responseTime: { type: Number },
        errorMessage: { type: String },
        metadata: { type: Schema.Types.Mixed },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

adminActivitySchema.statics.logActivity = async function (this: IAdminActivityModel, activityData) {
    try {
        const activity = new this(activityData);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('❌ Failed to log admin activity:', error);
        throw error;
    }
};

const AdminActivity = (mongoose.models.AdminActivity as IAdminActivityModel) || mongoose.model<AdminActivityDocument, IAdminActivityModel>('AdminActivity', adminActivitySchema);

export default AdminActivity;
