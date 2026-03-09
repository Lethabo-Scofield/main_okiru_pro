import type { ProcurementData, Supplier } from '../types';
import type { CalculatorConfig } from '../../../../shared/schema';
import { safeRatio, clampScore } from './shared';

const RECOGNITION_TABLE: Readonly<Record<number, number>> = {
  1: 1.35, 2: 1.25, 3: 1.10, 4: 1.00,
  5: 0.80, 6: 0.60, 7: 0.50, 8: 0.10, 0: 0,
};

const BLACK_WOMEN_OWNERSHIP_THRESHOLD = 0.30;

export interface ProcurementResult {
  base: number;
  designatedGroup: number;
  total: number;
  subMinimumMet: boolean;
  recognisedSpend: number;
  target: number;
  rawStats: {
    spendAllBlackOwned: number;
    spendBlackWomenOwned: number;
    spendQSE: number;
    spendEME: number;
    designatedGroupSpend: number;
  };
}

function getRecognitionMultiplier(beeLevel: number): number {
  return RECOGNITION_TABLE[beeLevel] ?? 0;
}

function sumSpendByType(suppliers: Supplier[], type: string): number {
  return suppliers.reduce((acc, s) => s.enterpriseType === type ? acc + s.spend : acc, 0);
}

export function calculateProcurementScore(data: ProcurementData, config?: CalculatorConfig): ProcurementResult {
  const { tmps } = data;
  const suppliers = data.suppliers || [];
  const pc = config?.procurement;

  const baseMax = pc?.baseMax ?? 25;
  const bonusMax = pc?.bonusMax ?? 2;
  const tmpsTarget = pc?.tmpsTarget ?? 0.8;
  const subMinThreshold = pc?.subMinThreshold ?? 11.6;
  const blackOwnedThreshold = pc?.blackOwnedThreshold ?? 0.51;

  const TARGET = tmps * tmpsTarget;

  let recognisedSpend = 0;
  let designatedGroupSpend = 0;

  for (const sup of suppliers) {
    recognisedSpend += sup.spend * getRecognitionMultiplier(sup.beeLevel);
    if (sup.blackOwnership >= blackOwnedThreshold) {
      designatedGroupSpend += sup.spend;
    }
  }

  const baseScore = safeRatio(recognisedSpend, TARGET, baseMax);
  const designatedGroupScore = safeRatio(designatedGroupSpend, tmps, 10);
  const cappedDesignatedGroup = clampScore(designatedGroupScore, bonusMax);
  const totalScore = clampScore(baseScore + cappedDesignatedGroup, baseMax + bonusMax);

  return {
    base: baseScore,
    designatedGroup: cappedDesignatedGroup,
    total: totalScore,
    subMinimumMet: baseScore >= subMinThreshold,
    recognisedSpend,
    target: TARGET,
    rawStats: {
      spendAllBlackOwned: suppliers.filter(s => s.blackOwnership >= blackOwnedThreshold).reduce((acc, s) => acc + s.spend, 0),
      spendBlackWomenOwned: suppliers.filter(s => s.blackWomenOwnership >= BLACK_WOMEN_OWNERSHIP_THRESHOLD).reduce((acc, s) => acc + s.spend, 0),
      spendQSE: sumSpendByType(suppliers, 'qse'),
      spendEME: sumSpendByType(suppliers, 'eme'),
      designatedGroupSpend,
    },
  };
}
