import mongoose, { Schema, Document } from 'mongoose';

export interface ITest extends Document {
  code: string;
  name: string;
  type: 'TEST';
  thyrocareData: {
    aliasName?: string;
    testCount?: number;
    benMin?: number;
    benMax?: number;
    benMultiple?: number;
    payType?: string;
    serum?: string;
    edta?: string;
    urine?: string;
    fluoride?: string;
    fasting?: string;
    specimenType?: string;
    diseaseGroup?: string;
    units?: string;
    volume?: string;
    normalVal?: string;
    groupName?: string;
    category?: string;
    new?: string;
    hc?: string;
    testNames?: string;
    additionalTests?: string;
    validTo?: Date;
    hcrInclude?: number;
    ownPkg?: string;
    bookedCount?: number;
    barcodes?: string[];
    imageLocation?: string;
    imageMaster?: Array<{
      imgLocations?: string;
      imgType?: string;
      imgName?: string;
    }>;
    rate?: {
      b2B?: number;
      b2C?: number;
      offerRate?: number;
      id?: string;
      payAmt?: number;
      payAmt1?: number;
    };
    margin?: number;
  };
  customPricing: {
    discount: number;
    sellingPrice: number;
    isCustomized: boolean;
  };
  isActive: boolean;
  lastSynced: Date;
  getCombinedData(): any;
}

export interface ITestModel extends mongoose.Model<ITest> {
  updateCustomPricing(code: string, discount: number): Promise<unknown>;
  findOrCreateFromThyroCare(data: Record<string, unknown>): Promise<ITest>;
}

const TestSchema = new Schema<ITest, ITestModel>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['TEST'], required: true },
    thyrocareData: {
      aliasName: String,
      testCount: Number,
      benMin: Number,
      benMax: Number,
      benMultiple: Number,
      payType: String,
      serum: String,
      edta: String,
      urine: String,
      fluoride: String,
      fasting: String,
      specimenType: String,
      diseaseGroup: String,
      units: String,
      volume: String,
      normalVal: String,
      groupName: String,
      category: String,
      new: String,
      hc: String,
      testNames: String,
      additionalTests: String,
      validTo: Date,
      hcrInclude: Number,
      ownPkg: String,
      bookedCount: Number,
      barcodes: [String],
      imageLocation: String,
      imageMaster: [{
        imgLocations: String,
        imgType: String,
        imgName: String
      }],
      rate: {
        b2B: Number,
        b2C: Number,
        offerRate: Number,
        id: String,
        payAmt: Number,
        payAmt1: Number
      },
      margin: Number
    },
    customPricing: {
      discount: { type: Number, default: 0, min: 0 },
      sellingPrice: { type: Number, default: 0 },
      isCustomized: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true },
    lastSynced: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

TestSchema.index({ type: 1, isActive: 1 });
TestSchema.index({ 'thyrocareData.category': 1 });

TestSchema.methods.getCombinedData = function() {
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
      payAmt: this.thyrocareData?.rate?.payAmt || 0
    },
    discount,
    sellingPrice,
    isCustomized: this.customPricing?.isCustomized,
    actualMargin: thyrocareMargin - (thyrocareRate - sellingPrice),
    isActive: this.isActive,
    lastSynced: this.lastSynced
  };
};

TestSchema.statics.updateCustomPricing = async function(code: string, discount: number) {
  const test = await this.findOne({ code });
  if (!test) {
    throw new Error('Test not found');
  }
  
  test.customPricing.discount = discount;
  await test.save();
  
  return test.getCombinedData();
};

TestSchema.statics.findOrCreateFromThyroCare = async function(data: Record<string, unknown>) {
  const code = String(data.code);
  const name = String(data.name);
  const type = String(data.type);
  
  let test = await this.findOne({ code });
  
  if (!test) {
    test = new this({
      code,
      name,
      type,
      thyrocareData: data
    });
  } else {
    test.thyrocareData = data as ITest['thyrocareData'];
    test.lastSynced = new Date();
  }
  
  await test.save();
  return test;
};

export default (mongoose.models.Test as ITestModel) || mongoose.model<ITest, ITestModel>('Test', TestSchema);
