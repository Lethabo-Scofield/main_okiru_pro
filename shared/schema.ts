import mongoose, { Schema, Document } from "mongoose";

export interface TemplateEntity {
  label: string;
  definition: string;
  synonyms: string[];
  positives: string[];
  negatives: string[];
  zones: string[];
  keywords: { must: string[]; nice: string[]; neg: string[] };
  pattern: string;
}

export interface CalculatorConfig {
  ownership: {
    votingRightsMax: number;
    womenBonusMax: number;
    economicInterestMax: number;
    netValueMax: number;
    targetEconomicInterest: number;
    subMinNetValue: number;
  };
  management: {
    boardBlackTarget: number;
    boardBlackPoints: number;
    boardWomenTarget: number;
    boardWomenPoints: number;
    execBlackTarget: number;
    execBlackPoints: number;
    execWomenTarget: number;
    execWomenPoints: number;
  };
  skills: {
    generalMax: number;
    bursaryMax: number;
    overallTarget: number;
    bursaryTarget: number;
    subMinThreshold: number;
  };
  procurement: {
    baseMax: number;
    bonusMax: number;
    tmpsTarget: number;
    subMinThreshold: number;
    blackOwnedThreshold: number;
  };
  esd: {
    supplierDevMax: number;
    enterpriseDevMax: number;
    supplierDevTarget: number;
    enterpriseDevTarget: number;
  };
  sed: {
    maxPoints: number;
    npatTarget: number;
  };
  discounting: {
    dropLevels: number;
    maxDropLevel: number;
  };
  benefitFactors: { type: string; factor: number }[];
  industryNorms: { name: string; norm: string }[];
}

export interface Organization {
  id: string;
  name: string;
  industry: string | null;
  createdAt: Date;
}

export interface InsertOrganization {
  name: string;
  industry?: string | null;
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  organizationId: string | null;
  organizationName: string | null;
  profilePicture: string | null;
  createdAt: Date;
}

export interface InsertUser {
  username: string;
  password: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  profilePicture?: string | null;
}

export interface ClientDoc {
  id: string;
  organizationId: string;
  name: string;
  financialYear: string;
  measurementPeriodStart: string | null;
  measurementPeriodEnd: string | null;
  revenue: number;
  npat: number;
  leviableAmount: number;
  industrySector: string;
  eapProvince: string;
  industryNorm: number | null;
  logo: string | null;
  ownership: {
    companyValue: number;
    outstandingDebt: number;
    yearsHeld: number;
    shareholders: any[];
  };
  management: {
    employees: any[];
  };
  skills: {
    leviableAmount: number;
    trainingPrograms: any[];
  };
  procurement: {
    tmps: number;
    tmpsManualOverride: boolean;
    suppliers: any[];
    graduationBonus: boolean;
    graduationEvidence: string;
    jobsCreatedBonus: boolean;
    jobsCreatedEvidence: string;
  };
  esd: {
    contributions: any[];
    graduationBonus: boolean;
    graduationEvidence: string;
    jobsCreatedBonus: boolean;
    jobsCreatedCount: number;
    jobsCreatedEvidence: string;
  };
  sed: {
    contributions: any[];
  };
  financialYears: any[];
  scenarios: any[];
  pipelineOverrides: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertClient {
  organizationId: string;
  name: string;
  financialYear?: string;
  industrySector?: string;
  eapProvince?: string;
}

export interface Template {
  id: number;
  organizationId: string | null;
  name: string;
  description: string | null;
  version: string;
  entities: TemplateEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertTemplate {
  name: string;
  description?: string | null;
  version?: string;
  entities: TemplateEntity[];
  organizationId?: string | null;
}

export interface CalculatorConfigRow {
  id: number;
  clientId: string;
  config: CalculatorConfig;
  updatedAt: Date;
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

const organizationSchema = new Schema({
  name: { type: String, required: true },
  industry: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

organizationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const shareholderSubSchema = new Schema({
  name: { type: String, required: true },
  ownershipType: { type: String, default: "shareholder" },
  blackOwnership: { type: Number, default: 0 },
  blackWomenOwnership: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  shareValue: { type: Number, default: 0 },
  blackNewEntrant: { type: Boolean, default: false },
}, { _id: true });

shareholderSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const employeeSubSchema = new Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  race: { type: String, required: true },
  designation: { type: String, required: true },
  isDisabled: { type: Boolean, default: false },
}, { _id: true });

employeeSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const trainingProgramSubSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  categoryCode: { type: String, default: "D" },
  cost: { type: Number, default: 0 },
  courseCost: { type: Number, default: 0 },
  travelCost: { type: Number, default: 0 },
  accommodationCost: { type: Number, default: 0 },
  cateringCost: { type: Number, default: 0 },
  employeeId: { type: String, default: null },
  isEmployed: { type: Boolean, default: false },
  isBlack: { type: Boolean, default: false },
  gender: { type: String, default: null },
  race: { type: String, default: null },
  isDisabled: { type: Boolean, default: false },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
}, { _id: true });

trainingProgramSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const supplierSubSchema = new Schema({
  name: { type: String, required: true },
  beeLevel: { type: Number, default: 4 },
  blackOwnership: { type: Number, default: 0 },
  blackWomenOwnership: { type: Number, default: 0 },
  youthOwnership: { type: Number, default: 0 },
  disabledOwnership: { type: Number, default: 0 },
  enterpriseType: { type: String, default: "generic" },
  spend: { type: Number, default: 0 },
  certificateExpiryDate: { type: String, default: null },
}, { _id: true });

supplierSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const contributionSubSchema = new Schema({
  beneficiary: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, default: 0 },
  category: { type: String, required: true },
}, { _id: true });

contributionSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const financialYearSubSchema = new Schema({
  year: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  npat: { type: Number, default: 0 },
  indicativeNpat: { type: Number, default: null },
  notes: { type: String, default: "" },
}, { _id: true });

financialYearSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const scenarioSubSchema = new Schema({
  name: { type: String, required: true },
  snapshot: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

scenarioSubSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const clientSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true },
  financialYear: { type: String, default: () => new Date().getFullYear().toString() },
  measurementPeriodStart: { type: String, default: null },
  measurementPeriodEnd: { type: String, default: null },
  revenue: { type: Number, default: 0 },
  npat: { type: Number, default: 0 },
  leviableAmount: { type: Number, default: 0 },
  industrySector: { type: String, default: "Generic" },
  eapProvince: { type: String, default: "National" },
  industryNorm: { type: Number, default: null },
  logo: { type: String, default: null },
  ownership: {
    companyValue: { type: Number, default: 0 },
    outstandingDebt: { type: Number, default: 0 },
    yearsHeld: { type: Number, default: 0 },
    shareholders: [shareholderSubSchema],
  },
  management: {
    employees: [employeeSubSchema],
  },
  skills: {
    leviableAmount: { type: Number, default: 0 },
    trainingPrograms: [trainingProgramSubSchema],
  },
  procurement: {
    tmps: { type: Number, default: 0 },
    tmpsManualOverride: { type: Boolean, default: false },
    suppliers: [supplierSubSchema],
    graduationBonus: { type: Boolean, default: false },
    graduationEvidence: { type: String, default: "" },
    jobsCreatedBonus: { type: Boolean, default: false },
    jobsCreatedEvidence: { type: String, default: "" },
  },
  esd: {
    contributions: [contributionSubSchema],
    graduationBonus: { type: Boolean, default: false },
    graduationEvidence: { type: String, default: "" },
    jobsCreatedBonus: { type: Boolean, default: false },
    jobsCreatedCount: { type: Number, default: 0 },
    jobsCreatedEvidence: { type: String, default: "" },
  },
  sed: {
    contributions: [contributionSubSchema],
  },
  financialYears: [financialYearSubSchema],
  scenarios: [scenarioSubSchema],
  pipelineOverrides: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

clientSchema.index({ organizationId: 1, name: 1 });

clientSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: null },
  email: { type: String, default: null },
  role: { type: String, default: "user" },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  organizationName: { type: String, default: null },
  profilePicture: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const templateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  version: { type: String, default: "1.0" },
  entities: { type: Schema.Types.Mixed, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function getNextSequence(name: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

templateSchema.pre("save", async function () {
  if (this.isNew && !(this as any).seqId) {
    (this as any).seqId = await getNextSequence("template");
  }
});

templateSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret.seqId || ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

templateSchema.add({ seqId: { type: Number, unique: true, sparse: true } });

const calculatorConfigSchema = new Schema({
  clientId: { type: String, required: true, unique: true },
  config: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});

calculatorConfigSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const conversationSchema = new Schema({
  seqId: { type: Number, unique: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

conversationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret.seqId || ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const messageSchema = new Schema({
  seqId: { type: Number, unique: true },
  conversationId: { type: Number, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret.seqId || ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const OrganizationModel = mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
export const ClientModel = mongoose.models.Client || mongoose.model("Client", clientSchema);
export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const TemplateModel = mongoose.models.Template || mongoose.model("Template", templateSchema);
export const CalculatorConfigModel = mongoose.models.CalculatorConfig || mongoose.model("CalculatorConfig", calculatorConfigSchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);

export { getNextSequence };
