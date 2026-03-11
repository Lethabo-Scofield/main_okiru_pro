import type { SkillsData, TrainingProgram, TrainingCategoryCode } from '../types';
import type { CalculatorConfig } from '../../../../shared/schema';
import { safeRatio, clampScore } from './shared';

const EAP_BLACK_PEOPLE_TARGET_PCT = 0.06;
const EAP_BLACK_WOMEN_TARGET_PCT = 0.03;
const EAP_DISABLED_TARGET_PCT = 0.003;

const CATEGORY_E_CAP = 0.25;
const CATEGORY_F_CAP = 0.15;

export interface EapIndicator {
  score: number;
  maxPoints: number;
  spend: number;
  target: number;
  targetPct: string;
}

export interface AbsorptionIndicator {
  count: number;
  total: number;
  rate: number;
  targetRate: number;
}

export interface CategoryBreakdown {
  code: TrainingCategoryCode;
  label: string;
  examples: string;
  spend: number;
  recognisedSpend: number;
  cap?: number;
  capApplied: boolean;
}

export interface SkillsResult {
  general: number;
  bursaries: number;
  total: number;
  subMinimumMet: boolean;
  targetOverall: number;
  targetBursaries: number;
  actualSpend: number;
  actualBursarySpend: number;
  categoryBreakdown: CategoryBreakdown[];
  eapIndicators: {
    blackPeople: EapIndicator;
    blackWomen: EapIndicator;
    disabled: EapIndicator;
    absorption: AbsorptionIndicator;
  };
  rawStats: {
    blackSpend: number;
    blackWomenSpend: number;
    disabledSpend: number;
    absorbedCount: number;
  };
}

const CATEGORY_LABELS: Record<TrainingCategoryCode, { label: string; examples: string }> = {
  A: { label: "Bursaries", examples: "Bursaries" },
  B: { label: "Internships & Learnerships", examples: "Internships, Learnerships" },
  C: { label: "Short Courses & Workshops", examples: "Short courses, workshops" },
  D: { label: "Other Accredited Training", examples: "Other accredited training" },
  E: { label: "Non-accredited / Informal", examples: "Non-accredited, informal" },
  F: { label: "Other (Travel, Venue, etc.)", examples: "Travel, venue, catering" },
};

interface SpendAccumulator {
  total: number;
  bursary: number;
  blackWomen: number;
  disabled: number;
  blackPeople: number;
  byCategory: Record<TrainingCategoryCode, number>;
}

function accumulateSpend(programs: TrainingProgram[]): SpendAccumulator {
  const acc: SpendAccumulator = {
    total: 0, bursary: 0, blackWomen: 0, disabled: 0, blackPeople: 0,
    byCategory: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
  };

  for (const prog of programs) {
    if (!prog.isBlack) continue;

    const catCode = prog.categoryCode || mapLegacyCategory(prog.category);
    acc.byCategory[catCode] += prog.cost;
    acc.blackPeople += prog.cost;

    if (prog.category === 'bursary' || catCode === 'A') acc.bursary += prog.cost;
    if (prog.gender === 'Female') acc.blackWomen += prog.cost;
    if (prog.isDisabled) acc.disabled += prog.cost;
  }

  return acc;
}

function mapLegacyCategory(cat: TrainingProgram['category']): TrainingCategoryCode {
  switch (cat) {
    case 'bursary': return 'A';
    case 'learnership':
    case 'internship': return 'B';
    case 'short_course': return 'C';
    default: return 'D';
  }
}

function applyCapToSpend(spendByCategory: Record<TrainingCategoryCode, number>): {
  totalRecognised: number;
  breakdown: CategoryBreakdown[];
} {
  const uncappedTotal = Object.values(spendByCategory).reduce((a, b) => a + b, 0);

  const breakdown: CategoryBreakdown[] = [];
  let totalRecognised = 0;

  for (const code of ['A', 'B', 'C', 'D', 'E', 'F'] as TrainingCategoryCode[]) {
    const spend = spendByCategory[code];
    const meta = CATEGORY_LABELS[code];
    let recognisedSpend = spend;
    let capApplied = false;
    let cap: number | undefined;

    if (code === 'E' && uncappedTotal > 0) {
      cap = CATEGORY_E_CAP;
      const maxAllowed = uncappedTotal * CATEGORY_E_CAP;
      if (spend > maxAllowed) {
        recognisedSpend = maxAllowed;
        capApplied = true;
      }
    } else if (code === 'F' && uncappedTotal > 0) {
      cap = CATEGORY_F_CAP;
      const maxAllowed = uncappedTotal * CATEGORY_F_CAP;
      if (spend > maxAllowed) {
        recognisedSpend = maxAllowed;
        capApplied = true;
      }
    }

    totalRecognised += recognisedSpend;
    breakdown.push({
      code,
      label: meta.label,
      examples: meta.examples,
      spend,
      recognisedSpend,
      cap,
      capApplied,
    });
  }

  return { totalRecognised, breakdown };
}

export function calculateSkillsScore(data: SkillsData, config?: CalculatorConfig): SkillsResult {
  const { leviableAmount } = data;
  const trainingPrograms = data.trainingPrograms || [];
  const sc = config?.skills;

  const overallTargetPct = sc?.overallTarget ?? 0.035;
  const bursaryTargetPct = sc?.bursaryTarget ?? 0.025;
  const generalMax = sc?.generalMax ?? 20;
  const bursaryMax = sc?.bursaryMax ?? 5;
  const subMinThreshold = sc?.subMinThreshold ?? 10;

  const TARGET_OVERALL = leviableAmount * overallTargetPct;
  const TARGET_BURSARIES = leviableAmount * bursaryTargetPct;
  const TARGET_BLACK_PEOPLE = leviableAmount * EAP_BLACK_PEOPLE_TARGET_PCT;
  const TARGET_BLACK_WOMEN = leviableAmount * EAP_BLACK_WOMEN_TARGET_PCT;
  const TARGET_BLACK_DISABLED = leviableAmount * EAP_DISABLED_TARGET_PCT;

  const spend = accumulateSpend(trainingPrograms);
  const { totalRecognised, breakdown } = applyCapToSpend(spend.byCategory);

  const generalScore = safeRatio(totalRecognised, TARGET_OVERALL, generalMax);
  const bursaryScore = safeRatio(spend.bursary, TARGET_BURSARIES, bursaryMax);
  const totalScore = clampScore(generalScore + bursaryScore, generalMax + bursaryMax);

  const blackLearners = trainingPrograms.filter(p => p.isBlack);
  const absorbedCount = blackLearners.filter(p => p.isEmployed).length;
  const absorptionRate = blackLearners.length > 0 ? absorbedCount / blackLearners.length : 0;

  return {
    general: generalScore,
    bursaries: bursaryScore,
    total: totalScore,
    subMinimumMet: totalScore >= subMinThreshold,
    targetOverall: TARGET_OVERALL,
    targetBursaries: TARGET_BURSARIES,
    actualSpend: totalRecognised,
    actualBursarySpend: spend.bursary,
    categoryBreakdown: breakdown,
    eapIndicators: {
      blackPeople: { score: safeRatio(spend.blackPeople, TARGET_BLACK_PEOPLE, 3), maxPoints: 3, spend: spend.blackPeople, target: TARGET_BLACK_PEOPLE, targetPct: '6%' },
      blackWomen: { score: safeRatio(spend.blackWomen, TARGET_BLACK_WOMEN, 3), maxPoints: 3, spend: spend.blackWomen, target: TARGET_BLACK_WOMEN, targetPct: '3%' },
      disabled: { score: safeRatio(spend.disabled, TARGET_BLACK_DISABLED, 4), maxPoints: 4, spend: spend.disabled, target: TARGET_BLACK_DISABLED, targetPct: '0.3%' },
      absorption: { count: absorbedCount, total: blackLearners.length, rate: absorptionRate, targetRate: 0.025 },
    },
    rawStats: {
      blackSpend: totalRecognised,
      blackWomenSpend: spend.blackWomen,
      disabledSpend: spend.disabled,
      absorbedCount,
    },
  };
}
