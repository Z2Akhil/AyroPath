export interface SocialMedia {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

export interface SiteSettings {
  _id?: string;
  logo: string;
  heroImage: string;
  helplineNumber: string;
  email: string;
  socialMedia: SocialMedia;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CartItem {
  productCode: string;
  productType: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface Product {
  code: string;
  name: string;
  type: 'TEST' | 'PROFILE' | 'OFFER';
  price: number;
  description?: string;
}