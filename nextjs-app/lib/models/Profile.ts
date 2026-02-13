import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ProfileDocument extends Document {
    code: string;
    name: string;
    type: 'PROFILE' | 'POP';
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

interface IProfileModel extends Model<ProfileDocument> {
    findOrCreateFromThyroCare(thyrocareProduct: any): Promise<ProfileDocument>;
    updateCustomPricing(code: string, discount: number): Promise<any>;
}

const profileSchema = new Schema<ProfileDocument, IProfileModel>(
    {
        code: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['PROFILE', 'POP'], required: true },
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

profileSchema.pre('save', async function (this: ProfileDocument) {
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

profileSchema.statics.findOrCreateFromThyroCare = async function (this: IProfileModel, thyrocareProduct) {
    let profile = await this.findOne({ code: thyrocareProduct.code });
    const cleanedThyrocareData = { ...thyrocareProduct };

    if (!profile) {
        profile = new this({
            code: cleanedThyrocareData.code,
            name: cleanedThyrocareData.name,
            type: cleanedThyrocareData.type,
            thyrocareData: cleanedThyrocareData,
        });
    } else {
        profile.thyrocareData = cleanedThyrocareData;
        profile.lastSynced = new Date();
    }
    await profile.save();
    return profile;
};

profileSchema.methods.getCombinedData = function () {
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

profileSchema.statics.updateCustomPricing = async function (this: IProfileModel, code, discount) {
    const profile = await this.findOne({ code });
    if (!profile) throw new Error('Profile not found');
    profile.customPricing.discount = discount;
    await profile.save();
    return profile.getCombinedData();
};

const Profile = (mongoose.models.Profile as IProfileModel) || mongoose.model<ProfileDocument, IProfileModel>('Profile', profileSchema);

export default Profile;
