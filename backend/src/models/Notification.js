import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  error: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  }
});

const notificationSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  emailType: {
    type: String,
    enum: ['promotional', 'informational'],
    required: [true, 'Email type is required']
  },
  recipients: [recipientSchema],
  totalRecipients: {
    type: Number,
    required: true,
    min: 1
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'completed', 'failed'],
    default: 'draft'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate counts before save
notificationSchema.pre('save', function(next) {
  if (this.recipients && this.recipients.length > 0) {
    this.sentCount = this.recipients.filter(r => r.status === 'sent').length;
    this.failedCount = this.recipients.filter(r => r.status === 'failed').length;
  }
  next();
});

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ 'recipients.userId': 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
