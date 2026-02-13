import mongoose, { Schema, Document, Model } from 'mongoose';

export interface TestDocument extends Document {
    code: string;
    name: string;
    type: 'TEST';
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

interface ITestModel extends Model<TestDocument> {
    findOrCreateFromThyroCare(thyrocareProduct: any): Promise<TestDocument>;
    updateCustomPricing(code: string, discount: number): Promise<any>;
}

const testSchema = new Schema<TestDocument, ITestModel>(
    {
        code: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['TEST'], required: true },
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

testSchema.pre('save', async function (this: TestDocument) {
    if (this.isModified('customPricing.discount')) {
        const thyrocareRate = this.thyrocareData?.rate?.b2C || 0;
        const thyrocareMargin = this.thyrocareData?.margin || 0;
        const discount = this.customPricing.discount || 0;
        if (discount > thyrocareMargin) {
            throw new Error(`Discount cannot exceed ThyroCare margin of ${thyrocareMargin}`);
        }
        this.customPricing.sellingPrice = thyrocareRate - discount;
        this.customPricing.isCustomized = discount > 0;
    }
});

testSchema.statics.findOrCreateFromThyroCare = async function (this: ITestModel, thyrocareProduct) {
    let test = await this.findOne({ code: thyrocareProduct.code });
    const cleanedThyrocareData = { ...thyrocareProduct };

    if (!test) {
        test = new this({
            code: cleanedThyrocareData.code,
            name: cleanedThyrocareData.name,
            type: 'TEST',
            thyrocareData: cleanedThyrocareData,
        });
    } else {
        test.thyrocareData = cleanedThyrocareData;
        test.lastSynced = new Date();
    }
    await test.save();
    return test;
};

testSchema.methods.getCombinedData = function () {
    const thyrocareRate = this.thyrocareData?.rate?.b2C || 0;
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
        childs: [],
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

testSchema.statics.updateCustomPricing = async function (this: ITestModel, code, discount) {
    const test = await this.findOne({ code });
    if (!test) throw new Error('Test not found');
    test.customPricing.discount = discount;
    await test.save();
    return test.getCombinedData();
};

const Test = (mongoose.models.Test as ITestModel) || mongoose.model<TestDocument, ITestModel>('Test', testSchema);

export default Test;
