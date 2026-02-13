import { NextRequest, NextResponse } from 'next/server';
import { ThyrocareCartService } from '@/lib/services/thyrocareCart';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import Cart from '@/lib/models/Cart';
import connectToDatabase from '@/lib/db/mongoose';

interface ProductDetails {
  productCode: string;
  productType: string;
  name: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  thyrocareRate: number;
  discount: number;
}

async function getProductDetails(productCode: string, productType: string): Promise<ProductDetails> {
  let product;

  switch (productType) {
    case 'TEST':
      product = await Test.findOne({ code: productCode, isActive: true });
      break;
    case 'PROFILE':
      product = await Profile.findOne({ code: productCode, isActive: true });
      break;
    case 'OFFER':
      product = await Offer.findOne({ code: productCode, isActive: true });
      break;
    default:
      throw new Error(`Unknown product type: ${productType}`);
  }

  if (!product) {
    throw new Error(`Product not found: ${productCode} (${productType})`);
  }

  const combinedData = product.getCombinedData();
  const thyrocareRate = combinedData.thyrocareRate || combinedData.rate?.b2C || combinedData.rate?.offerRate || 0;
  const sellingPrice = combinedData.sellingPrice || thyrocareRate;
  const discount = Math.max(0, thyrocareRate - sellingPrice);

  return {
    productCode: product.code,
    productType: productType,
    name: product.name,
    quantity: 1,
    originalPrice: thyrocareRate,
    sellingPrice: sellingPrice,
    thyrocareRate: thyrocareRate,
    discount: discount
  };
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { benCount = 1, items: directItems } = body;

    const userId = req.headers.get('x-user-id');
    const guestSessionId = req.headers.get('x-guest-session-id');

    let itemsToPrice: ProductDetails[] = [];

    if (directItems && directItems.length > 0) {
      for (const item of directItems) {
        try {
          const details = await getProductDetails(item.productCode, item.productType);
          itemsToPrice.push({
            ...details,
            quantity: item.quantity || 1
          });
        } catch (error) {
          console.error(`Error fetching product ${item.productCode}:`, error);
        }
      }
    } else {
      const cart = await Cart.findOne({
        $or: [
          { userId },
          { guestSessionId }
        ],
        isActive: true
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({
          success: true,
          originalTotal: 0,
          totalDiscount: 0,
          finalTotal: 0,
          collectionCharge: 0,
          grandTotal: 0,
          marginAdjusted: false,
          items: []
        });
      }

      for (const cartItem of cart.items) {
        try {
          const details = await getProductDetails(cartItem.productCode, cartItem.productType);
          itemsToPrice.push({
            ...details,
            quantity: cartItem.quantity || 1
          });
        } catch (error) {
          console.error(`Error fetching cart item ${cartItem.productCode}:`, error);
        }
      }
    }

    if (itemsToPrice.length === 0) {
      return NextResponse.json({
        success: true,
        originalTotal: 0,
        totalDiscount: 0,
        finalTotal: 0,
        collectionCharge: 0,
        grandTotal: 0,
        marginAdjusted: false,
        items: []
      });
    }

    const validationResult = await ThyrocareCartService.validateAndAdjustCart(itemsToPrice, { benCount });

    const originalTotal = itemsToPrice.reduce((sum, item) =>
      sum + (item.originalPrice * item.quantity * benCount), 0
    );

    const totalDiscount = originalTotal - validationResult.breakdown.productTotal;

    return NextResponse.json({
      success: true,
      benCount,
      originalTotal,
      requestedDiscount: itemsToPrice.reduce((sum, item) =>
        sum + ((item.discount || 0) * item.quantity * benCount), 0),
      totalDiscount,
      finalTotal: validationResult.breakdown.productTotal,
      collectionCharge: validationResult.collectionCharge,
      grandTotal: validationResult.breakdown.grandTotal,
      // @ts-expect-error - marginAdjusted is added dynamically
      marginAdjusted: validationResult.adjustedItems.some(item => item.marginAdjusted),
      thyrocareMargin: validationResult.thyrocareResponse?.margin,
      items: validationResult.adjustedItems,
      message: validationResult.message
    });

  } catch (error) {
    console.error('Error getting checkout pricing:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: 'Failed to get checkout pricing',
      error: message
    }, { status: 500 });
  }
}