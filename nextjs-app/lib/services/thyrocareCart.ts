import axios from 'axios';
import { ThyrocareService } from './thyrocare';
import AdminSession from '../models/AdminSession';

interface CartItem {
  productCode: string;
  productType: string;
  name: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  thyrocareRate?: number;
  discount?: number;
}

interface ThyrocareResponse {
  respId?: string;
  payable?: string;
  margin?: string;
  product?: string;
  rates?: string;
  response?: string;
}

interface ValidationResult {
  success: boolean;
  adjustedItems: CartItem[];
  collectionCharge: number;
  hasCollectionCharge: boolean;
  breakdown: {
    productTotal: number;
    collectionCharge: number;
    grandTotal: number;
  };
  thyrocareResponse?: ThyrocareResponse;
  message?: string;
  validationApplied?: boolean;
}

export class ThyrocareCartService {
  private static apiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';
  private static COLLECTION_CHARGE = 200;
  private static MINIMUM_ORDER = 300;

  static async getAdminMobile(): Promise<string> {
    const activeSession = await AdminSession.findOne({ isActive: true }).populate<{ adminId: { mobile?: string } }>('adminId');
    
    if (activeSession?.adminId?.mobile) {
      return activeSession.adminId.mobile;
    }
    
    const fallbackMobile = process.env.THYROCARE_USERNAME;
    if (!fallbackMobile) {
      throw new Error('No active admin session and THYROCARE_USERNAME not configured');
    }
    
    return fallbackMobile;
  }

  static async buildThyrocareRequest(cartItems: CartItem[], options: { benCount?: number; report?: number } = {}) {
    const { benCount = 1, report = 1 } = options;

    const validItems = cartItems.filter(item => item.sellingPrice > 0 && item.productCode);

    if (validItems.length === 0) {
      throw new Error('No valid items in cart');
    }

    const products: string[] = [];
    const rates: number[] = [];

    validItems.forEach(item => {
      let productIdentifier = item.productCode;
      if (item.productType === 'PROFILE' || item.productType === 'POP') {
        productIdentifier = item.name || item.productCode;
      }
      products.push(productIdentifier);
      rates.push(Math.round(item.thyrocareRate || item.sellingPrice));
    });

    const adminMobile = await this.getAdminMobile();

    return {
      Products: products.join(','),
      Rates: rates.join(','),
      ClientType: 'PUBLIC',
      Mobile: adminMobile,
      BenCount: benCount.toString(),
      Report: report.toString(),
      Discount: ''
    };
  }

  static async validateCartWithThyrocare(cartItems: CartItem[], options: { benCount?: number } = {}) {
    try {
      const requestBody = await this.buildThyrocareRequest(cartItems, options);

      const responseData = await ThyrocareService.makeRequest(async (apiKey) => {
        const response = await axios.post(
          `${this.apiUrl}/api/CartMaster/DSAViewCartDTL`,
          { ...requestBody, ApiKey: apiKey },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );
        return response.data;
      });

      return {
        success: true,
        data: responseData as ThyrocareResponse,
        request: requestBody
      };
    } catch (error) {
      console.error('Thyrocare API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static adjustCartPrices(cartItems: CartItem[], thyrocareResult: { success: boolean; data?: ThyrocareResponse }, options: { benCount?: number } = {}): ValidationResult {
    const { benCount = 1 } = options;

    if (!thyrocareResult.success || !thyrocareResult.data) {
      const ourTotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      const hasCollectionCharge = ourTotal > 0 && ourTotal < this.MINIMUM_ORDER;
      const collectionCharge = hasCollectionCharge ? this.COLLECTION_CHARGE : 0;

      return {
        success: true,
        adjustedItems: cartItems,
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge,
          grandTotal: ourTotal + collectionCharge
        },
        message: 'Using local prices (Thyrocare validation failed)'
      };
    }

    const thyrocareData = thyrocareResult.data;
    const thyrocarePayable = parseFloat(thyrocareData.payable || '0');
    const thyrocareMargin = parseFloat(thyrocareData.margin || '0');

    const originalTotal = cartItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity * benCount), 0);
    const totalAdminDiscount = cartItems.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity * benCount), 0);

    const discountRatio = totalAdminDiscount > thyrocareMargin && thyrocareMargin > 0
      ? thyrocareMargin / totalAdminDiscount
      : 1;

    const marginAdjusted = discountRatio < 1;

    const adjustedItems = cartItems.map(item => {
      const adminDiscount = item.discount || 0;
      const applicableDiscount = Math.round(adminDiscount * discountRatio);
      const finalPrice = item.originalPrice - applicableDiscount;

      return {
        ...item,
        discount: applicableDiscount,
        sellingPrice: finalPrice,
        totalPrice: finalPrice * item.quantity * benCount,
        marginAdjusted: applicableDiscount < adminDiscount
      };
    });

    const finalTotal = adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity * benCount), 0);
    const totalDiscount = originalTotal - finalTotal;

    const hasCollectionCharge = finalTotal < this.MINIMUM_ORDER;
    const collectionCharge = hasCollectionCharge ? this.COLLECTION_CHARGE : 0;
    const grandTotal = finalTotal + collectionCharge;

    return {
      success: true,
      adjustedItems,
      collectionCharge,
      hasCollectionCharge,
      breakdown: {
        productTotal: finalTotal,
        collectionCharge,
        grandTotal
      },
      thyrocareResponse: thyrocareData,
      message: marginAdjusted ? 'Discount adjusted based on beneficiaries' : 'Full discount applied'
    };
  }

  static async validateAndAdjustCart(cartItems: CartItem[], options: { benCount?: number } = {}): Promise<ValidationResult> {
    if (!cartItems || cartItems.length === 0) {
      return {
        success: true,
        adjustedItems: cartItems,
        collectionCharge: 0,
        hasCollectionCharge: false,
        breakdown: { productTotal: 0, collectionCharge: 0, grandTotal: 0 },
        message: 'Empty cart'
      };
    }

    try {
      const validationResult = await this.validateCartWithThyrocare(cartItems, options);
      const adjustmentResult = this.adjustCartPrices(cartItems, validationResult, options);

      return {
        ...adjustmentResult,
        validationApplied: validationResult.success
      };
    } catch (error) {
      console.error('Cart validation error:', error);
      
      const ourTotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      const hasCollectionCharge = ourTotal > 0 && ourTotal < this.MINIMUM_ORDER;
      const collectionCharge = hasCollectionCharge ? this.COLLECTION_CHARGE : 0;

      return {
        success: false,
        adjustedItems: cartItems,
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge,
          grandTotal: ourTotal + collectionCharge
        },
        message: 'Validation failed, using local prices'
      };
    }
  }
}