import mongoose, { Schema, Document } from 'mongoose';
import User from './User';
import Admin from './Admin';


export interface INotification extends Document {
    subject: string;
    content: string;
    emailType: 'promotional' | 'informational';
    recipients: Array<{
        userId: mongoose.Types.ObjectId;
        email: string;  // Added email field like old implementation
        status: 'pending' | 'sent' | 'failed';  // Changed 'delivered' to 'sent' to match old schema
        error?: string;
        sentAt?: Date;
    }>;
    status: 'draft' | 'sending' | 'completed' | 'failed';  // Match old schema
    totalRecipients: number;  // Added to match old schema
    sentCount: number;  // Added to match old schema
    recipientCount: number;
    deliveredCount: number;
    failedCount: number;
    createdBy: mongoose.Types.ObjectId;
    startedAt?: Date;  // Added to match old schema
    completedAt?: Date;  // Added to match old schema
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    subject: { type: String, required: true },
    content: { type: String, required: true },
    emailType: {
        type: String,
        enum: ['promotional', 'informational'],  // Changed 'transactional' to 'informational'
        default: 'promotional'
    },
    recipients: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        email: { type: String, required: true, lowercase: true },  // Added email field
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'],  // Changed 'delivered' to 'sent'
            default: 'pending'
        },
        error: { type: String, default: null },
        sentAt: { type: Date, default: null }
    }],
    status: {
        type: String,
        enum: ['draft', 'sending', 'completed', 'failed'],  // Added 'draft' and 'sending'
        default: 'draft'
    },
    totalRecipients: { type: Number, required: true, min: 1 },  // Added
    sentCount: { type: Number, default: 0 },  // Added
    recipientCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    startedAt: { type: Date, default: null },  // Added
    completedAt: { type: Date, default: null }  // Added
}, {
    timestamps: true
});

// Indexing for performance
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ status: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
