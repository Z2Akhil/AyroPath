import mongoose, { Schema, Document } from 'mongoose';
import User from './User';
import Admin from './Admin';


export interface INotification extends Document {
    subject: string;
    content: string;
    emailType: 'promotional' | 'transactional';
    recipients: Array<{
        userId: mongoose.Types.ObjectId;
        status: 'pending' | 'delivered' | 'failed';
        error?: string;
        sentAt?: Date;
    }>;
    status: 'pending' | 'completed' | 'failed';
    recipientCount: number;
    deliveredCount: number;
    failedCount: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    subject: { type: String, required: true },
    content: { type: String, required: true },
    emailType: {
        type: String,
        enum: ['promotional', 'transactional'],
        default: 'promotional'
    },
    recipients: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'delivered', 'failed'],
            default: 'pending'
        },
        error: { type: String },
        sentAt: { type: Date }
    }],
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    recipientCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
    timestamps: true
});

// Indexing for performance
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ status: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
