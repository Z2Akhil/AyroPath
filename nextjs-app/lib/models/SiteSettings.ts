import mongoose, { Schema, Document } from 'mongoose';
import { SiteSettings as SiteSettingsType } from '@/types';

export interface SiteSettingsDocument extends Omit<SiteSettingsType, '_id'>, Document {}

const siteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    logo: {
      type: String,
      default: '/assets/default-logo.png',
    },
    heroImage: {
      type: String,
      default: '/assets/default-hero.webp',
    },
    helplineNumber: {
      type: String,
      default: '+91-00000-00000',
    },
    email: {
      type: String,
      default: 'support@example.com',
    },
    socialMedia: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.models.SiteSettings || mongoose.model<SiteSettingsDocument>('SiteSettings', siteSettingsSchema);

export default SiteSettings;