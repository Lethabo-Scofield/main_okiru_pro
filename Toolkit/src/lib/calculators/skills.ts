import type { SkillsData, TrainingProgram } from '../types';
import type { CalculatorConfig } from '../../../../shared/schema';
import { safeRatio, clampScore } from './shared';

const EAP_BLACK_PEOPLE_TARGET_PCT = 0.06;
const EAP_BLACK_WOMEN_TARGET_PCT = 0.03;
const EAP_DISABLED_TARGET_PCT = 0.003;

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

export interface SkillsResult {
  general: number;
  bursaries: number;
  total: number;
  subMinimumMet: boolean;
  targetOverall: number;
  targetBursaries: number;
  actualSpend: number;
  actualBursarySpend: number;
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

interface SpendAccumulator {
  total: number;
  bursary: number;
  blackWomen: number;
  disabled: number;
  blackPeople: number;
}

function accumulateSpend(programs: TrainingProgram[]): SpendAccumulator {
  const acc: SpendAccumulator = { total: 0, bursary: 0, blackWomen: 0, disabled: 0, blackPeople: 0 };

  for (const prog of programs) {
    if (!prog.isBlack) continue;

    acc.total += prog.cost;
    acc.blackPeople += prog.cost;

    if (prog.category === 'bursary') acc.bursary += prog.cost;
    if (prog.gender === 'Female') acc.blackWomen += prog.cost;
    if (prog.isDisabled) acc.disabled += prog.cost;
  }

  return acc;
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

  const generalScore = safeRatio(spend.total, TARGET_OVERALL, generalMax);
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
    actualSpend: spend.total,
    actualBursarySpend: spend.bursary,
    eapIndicators: {
      blackPeople: { score: safeRatio(spend.blackPeople, TARGET_BLACK_PEOPLE, 3), maxPoints: 3, spend: spend.blackPeople, target: TARGET_BLACK_PEOPLE, targetPct: '6%' },
      blackWomen: { score: safeRatio(spend.blackWomen, TARGET_BLACK_WOMEN, 3), maxPoints: 3, spend: spend.blackWomen, target: TARGET_BLACK_WOMEN, targetPct: '3%' },
      disabled: { score: safeRatio(spend.disabled, TARGET_BLACK_DISABLED, 4), maxPoints: 4, spend: spend.disabled, target: TARGET_BLACK_DISABLED, targetPct: '0.3%' },
      absorption: { count: absorbedCount, total: blackLearners.length, rate: absorptionRate, targetRate: 0.025 },
    },
    rawStats: {
      blackSpend: spend.total,
      blackWomenSpend: spend.blackWomen,
      disabledSpend: spend.disabled,
      absorbedCount,
    },
  };
}
