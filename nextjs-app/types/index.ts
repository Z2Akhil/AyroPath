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
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  isVerified: boolean;
  emailVerified: boolean;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  authProvider?: string;
}

export interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (firstName: string, lastName: string, mobileNumber: string, password?: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  requestOTP: (mobileNumber: string, purpose?: string) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (mobileNumber: string, otp: string, purpose?: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (mobileNumber: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (mobileNumber: string, otp: string, newPassword?: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

export interface CartItem {
  productCode: string;
  productType: string;
  name: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  discount: number;
  thyrocareRate?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  productTotal: number;
  collectionCharge: number;
  totalAmount: number;
  hasCollectionCharge?: boolean;
  thyrocareValidation?: boolean;
  breakdown?: {
    productTotal: number;
    collectionCharge: number;
    grandTotal: number;
  };
  guestSessionId?: string;
}

export interface CartContextType {
  cart: Cart;
  loading: boolean;
  addToCart: (item: any) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (productCode: string, productType: string) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (productCode: string, productType: string, quantity: number) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<{ success: boolean; message: string }>;
  refreshCart: () => Promise<void>;
}

export interface Admin {
  _id?: string;
  username: string;
  email: string;
  mobile: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: boolean;
  isActive: boolean;
  thyrocareUserId?: string;
  userType?: string;
  respId?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  code: string;
  name: string;
  type: string;
  category?: string;
  rate?: {
    b2C: number;
    offerRate?: number;
  };
  sellingPrice?: number;
  discount?: number;
  testCount?: number;
  fasting?: string;
  childs?: any[];
  originalPrice?: number; // UI helper
}

export interface ProductContextType {
  allProducts: Product[];
  packages: Product[];
  tests: Product[];
  offers: Product[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMoreProducts: boolean;
  refreshProducts: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  removeToast: (id: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}