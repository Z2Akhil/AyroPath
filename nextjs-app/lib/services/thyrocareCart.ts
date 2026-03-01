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
            timeout: 30000
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
      console.log('⚠️ Using local prices (Thyrocare validation failed)');
      const ourTotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0) * benCount;
      const COLLECTION_CHARGE = 200;
      const MINIMUM_ORDER = 300;

      let collectionCharge = 0;
      let hasCollectionCharge = false;

      if (ourTotal > 0 && ourTotal < MINIMUM_ORDER) {
        collectionCharge = COLLECTION_CHARGE;
        hasCollectionCharge = true;
      }

      return {
        success: true,
        adjustedItems: cartItems.map(i => ({ ...i, marginAdjusted: false })),
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

    // Sent Total (The basis on which Thyrocare calculates margin)
    const sentTotal = cartItems.reduce((sum, item) => sum + ((item.thyrocareRate || item.sellingPrice) * item.quantity), 0);
    const ourTotalSelling = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    const currentPasson = Math.max(0, sentTotal - ourTotalSelling) * benCount;
    const thyrocareProductCost = Math.max(0, (sentTotal * benCount) - thyrocareMargin);

    const COLLECTION_CHARGE = 200;
    const MINIMUM_ORDER = 300;

    let collectionCharge = 0;
    let hasCollectionCharge = false;

    if (Math.abs(thyrocarePayable - thyrocareProductCost - COLLECTION_CHARGE) <= 10) {
      collectionCharge = COLLECTION_CHARGE;
      hasCollectionCharge = true;
    } else if (thyrocareProductCost < MINIMUM_ORDER && thyrocarePayable >= MINIMUM_ORDER) {
      collectionCharge = COLLECTION_CHARGE;
      hasCollectionCharge = true;
    }

    if (currentPasson <= thyrocareMargin) {
      return {
        success: true,
        adjustedItems: cartItems.map(i => ({ ...i, marginAdjusted: false })),
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotalSelling * benCount,
          collectionCharge,
          grandTotal: (ourTotalSelling * benCount) + collectionCharge
        },
        thyrocareResponse: thyrocareData,
        message: 'Full discount applied'
      };
    }

    const targetTotalPerBen = thyrocareProductCost / benCount;
    const adjustmentRatio = ourTotalSelling > 0 ? targetTotalPerBen / ourTotalSelling : 1;

    let adjustedItems = cartItems.map(item => {
      let newSellingPrice = Math.round(item.sellingPrice * adjustmentRatio);

      if (newSellingPrice > item.originalPrice) {
        newSellingPrice = item.originalPrice;
      }

      return {
        ...item,
        sellingPrice: newSellingPrice,
        discount: Math.max(0, item.originalPrice - newSellingPrice),
        marginAdjusted: true
      };
    });

    let currentTotal = adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    let diff = Math.round(targetTotalPerBen - currentTotal);

    if (diff !== 0) {
      for (let i = 0; i < adjustedItems.length && diff !== 0; i++) {
        const item = adjustedItems[i];
        const adjustment = diff > 0 ? 1 : -1;
        const potentialPrice = item.sellingPrice + adjustment;

        if (potentialPrice >= 0 && potentialPrice <= item.originalPrice) {
          adjustedItems[i].sellingPrice = potentialPrice;
          adjustedItems[i].discount = Math.max(0, item.originalPrice - potentialPrice);
          diff -= (adjustment * item.quantity);
        }
      }
    }

    const finalProductTotal = adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0) * benCount;

    return {
      success: true,
      adjustedItems,
      collectionCharge,
      hasCollectionCharge,
      breakdown: {
        productTotal: finalProductTotal,
        collectionCharge,
        grandTotal: finalProductTotal + collectionCharge
      },
      thyrocareResponse: thyrocareData,
      message: 'Discount adjusted based on beneficiaries'
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