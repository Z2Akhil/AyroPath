import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
    productCode: string;
    productType: 'TEST' | 'PROFILE' | 'OFFER' | 'POP';
    name: string;
    quantity: number;
    originalPrice: number;
    sellingPrice: number;
    discount: number;
    thyrocareRate?: number;
    addedAt: Date;
}

export interface CartDocument extends Document {
    userId?: mongoose.Types.ObjectId;
    guestSessionId?: string;
    items: ICartItem[];
    totalItems: number;
    subtotal: number;
    totalDiscount: number;
    totalAmount: number;
    lastUpdated: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    addItem(itemData: Partial<ICartItem>): Promise<CartDocument>;
    removeItem(productCode: string, productType: string): Promise<CartDocument>;
    updateQuantity(productCode: string, productType: string, quantity: number): Promise<CartDocument>;
    clearCart(): Promise<CartDocument>;
    getSummary(collectionCharge?: number): CartSummary;
}

export interface CartSummary {
    totalItems: number;
    subtotal: number;
    totalDiscount: number;
    productTotal: number;
    collectionCharge: number;
    totalAmount: number;
    items: Array<ICartItem & { totalPrice: number }>;
}

export interface ICartModel extends Model<CartDocument> {
    findByUserOrGuest(userId?: string | mongoose.Types.ObjectId, guestSessionId?: string): Promise<CartDocument | null>;
    createOrUpdateCart(userId: string | mongoose.Types.ObjectId | null, guestSessionId: string | null, items?: ICartItem[]): Promise<CartDocument>;
}

const cartItemSchema = new Schema<ICartItem>({
    productCode: {
        type: String,
        required: true
    },
    productType: {
        type: String,
        enum: ['TEST', 'PROFILE', 'OFFER', 'POP'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    originalPrice: {
        type: Number,
        required: true
    },
    sellingPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    thyrocareRate: {
        type: Number,
        required: false
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new Schema<CartDocument, ICartModel>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestSessionId: {
        type: String,
        required: false
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

cartSchema.index({ userId: 1 });
cartSchema.index({ guestSessionId: 1 });
cartSchema.index({ lastUpdated: 1 });

cartSchema.pre('save', async function (this: CartDocument) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    this.totalDiscount = this.items.reduce((sum, item) => sum + ((item.originalPrice - item.sellingPrice) * item.quantity), 0);
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    this.lastUpdated = new Date();
});

cartSchema.statics.findByUserOrGuest = async function (this: ICartModel, userId, guestSessionId) {
    if (userId) {
        return await this.findOne({ userId, isActive: true });
    } else if (guestSessionId) {
        return await this.findOne({ guestSessionId, isActive: true });
    }
    return null;
};

cartSchema.statics.createOrUpdateCart = async function (this: ICartModel, userId, guestSessionId, items = []) {
    let cart = await this.findByUserOrGuest(userId, guestSessionId);

    if (!cart) {
        cart = new this({
            userId: userId || null,
            guestSessionId: guestSessionId || null,
            items: items
        });
    } else {
        cart.items = items;
    }

    await cart.save();
    return cart;
};

cartSchema.methods.addItem = async function (this: CartDocument, itemData: ICartItem) {
    const existingItemIndex = this.items.findIndex(
        item => item.productCode === itemData.productCode && item.productType === itemData.productType
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += itemData.quantity || 1;
        this.items[existingItemIndex].sellingPrice = itemData.sellingPrice;
        this.items[existingItemIndex].discount = itemData.discount;
        this.items[existingItemIndex].thyrocareRate = itemData.thyrocareRate;
    } else {
        this.items.push(itemData);
    }

    await this.save();
    return this;
};

cartSchema.methods.removeItem = async function (this: CartDocument, productCode: string, productType: string) {
    this.items = (this.items as any).filter(
        (item: ICartItem) => !(item.productCode === productCode && item.productType === productType)
    );

    await this.save();
    return this;
};

cartSchema.methods.updateQuantity = async function (this: CartDocument, productCode: string, productType: string, quantity: number) {
    const item = this.items.find(
        item => item.productCode === productCode && item.productType === productType
    );

    if (item && quantity > 0 && quantity <= 10) {
        item.quantity = quantity;
        await this.save();
    }

    return this;
};

cartSchema.methods.clearCart = async function (this: CartDocument) {
    this.items = [];
    await this.save();
    return this;
};

cartSchema.methods.getSummary = function (this: CartDocument, collectionCharge = 0): CartSummary {
    const productTotal = this.items.reduce((sum, item) =>
        sum + (item.sellingPrice * item.quantity), 0
    );

    const grandTotal = productTotal + collectionCharge;

    return {
        totalItems: this.totalItems,
        subtotal: this.subtotal,
        totalDiscount: this.totalDiscount,
        productTotal: productTotal,
        collectionCharge: collectionCharge,
        totalAmount: grandTotal,
        items: this.items.map(item => ({
            ...((item as any).toObject ? (item as any).toObject() : item),
            totalPrice: item.sellingPrice * item.quantity
        }))
    };
};

const Cart = (mongoose.models.Cart as ICartModel) || mongoose.model<CartDocument, ICartModel>('Cart', cartSchema);

export default Cart;
