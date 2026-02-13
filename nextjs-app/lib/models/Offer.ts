import mongoose, { Schema, Document, Model } from 'mongoose';

export interface OfferDocument extends Document {
    code: string;
    name: string;
    type: 'OFFER';
    thyrocareData: any;
    customPricing: {
        discount: number;
        sellingPrice: number;
        isCustomized: boolean;
    };
    isActive: boolean;
    lastSynced: Date;
    getCombinedData(): any;
}

interface IOfferModel extends Model<OfferDocument> {
    findOrCreateFromThyroCare(thyrocareProduct: any): Promise<OfferDocument>;
    updateCustomPricing(code: string, discount: number): Promise<any>;
}

const offerSchema = new Schema<OfferDocument, IOfferModel>(
    {
        code: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['OFFER'], required: true },
        thyrocareData: { type: Schema.Types.Mixed },
        customPricing: {
            discount: { type: Number, default: 0, min: 0 },
            sellingPrice: { type: Number, default: 0 },
            isCustomized: { type: Boolean, default: false },
        },
        isActive: { type: Boolean, default: true },
        lastSynced: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

offerSchema.pre('save', async function (this: OfferDocument) {
    if (this.isModified('customPricing.discount')) {
        const thyrocareRate = this.thyrocareData?.rate?.offerRate || 0;
        const thyrocareMargin = this.thyrocareData?.margin || 0;
        const discount = this.customPricing.discount || 0;
        if (discount > thyrocareMargin) {
            throw new Error(`Discount cannot exceed ThyroCare margin of ${thyrocareMargin}`);
        }
        this.customPricing.sellingPrice = thyrocareRate - discount;
        this.customPricing.isCustomized = discount > 0;
    }
});

offerSchema.statics.findOrCreateFromThyroCare = async function (this: IOfferModel, thyrocareProduct) {
    let offer = await this.findOne({ code: thyrocareProduct.code });
    const cleanedThyrocareData = { ...thyrocareProduct };

    if (!offer) {
        offer = new this({
            code: cleanedThyrocareData.code,
            name: cleanedThyrocareData.name,
            type: 'OFFER',
            thyrocareData: cleanedThyrocareData,
        });
    } else {
        offer.thyrocareData = cleanedThyrocareData;
        offer.lastSynced = new Date();
    }
    await offer.save();
    return offer;
};

offerSchema.methods.getCombinedData = function () {
    const thyrocareRate = this.thyrocareData?.rate?.offerRate || 0;
    const thyrocareMargin = this.thyrocareData?.margin || 0;
    const discount = this.customPricing?.discount || 0;
    const sellingPrice = this.customPricing?.sellingPrice || thyrocareRate;

    return {
        code: this.code,
        name: this.name,
        type: this.type,
        category: this.thyrocareData?.category,
        thyrocareRate,
        thyrocareMargin,
        childs: this.thyrocareData?.childs || [],
        imageLocation: this.thyrocareData?.imageLocation,
        imageMaster: this.thyrocareData?.imageMaster || [],
        testCount: this.thyrocareData?.testCount,
        bookedCount: this.thyrocareData?.bookedCount,
        specimenType: this.thyrocareData?.specimenType,
        fasting: this.thyrocareData?.fasting,
        rate: {
            b2C: this.thyrocareData?.rate?.b2C || 0,
            offerRate: this.thyrocareData?.rate?.offerRate || 0,
            payAmt: this.thyrocareData?.rate?.payAmt || 0,
        },
        discount,
        sellingPrice,
        isCustomized: this.customPricing?.isCustomized,
        actualMargin: thyrocareMargin - (thyrocareRate - sellingPrice),
        isActive: this.isActive,
        lastSynced: this.lastSynced,
    };
};

offerSchema.statics.updateCustomPricing = async function (this: IOfferModel, code, discount) {
    const offer = await this.findOne({ code });
    if (!offer) throw new Error('Offer not found');
    offer.customPricing.discount = discount;
    await offer.save();
    return offer.getCombinedData();
};

const Offer = (mongoose.models.Offer as IOfferModel) || mongoose.model<OfferDocument, IOfferModel>('Offer', offerSchema);

export default Offer;
