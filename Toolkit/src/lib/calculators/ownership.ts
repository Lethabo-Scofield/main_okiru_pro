import type { OwnershipData } from '../types';
import type { CalculatorConfig } from '../../../../shared/schema';
import { safeRatio, clampScore } from './shared';

const FULL_OWNERSHIP_THRESHOLD = 0.25;
const WOMEN_BONUS_THRESHOLD = 0.10;
const NEW_ENTRANT_BONUS_POINTS = 3;
const MAX_TOTAL = 25;

const GRADUATION_TABLE: Record<number, number> = {
  1: 0.1, 2: 0.2, 3: 0.4, 4: 0.6,
  5: 0.8, 6: 1.0, 7: 1.0, 8: 1.0,
  9: 1.0, 10: 1.0,
};

export interface OwnershipResult {
  votingRights: number;
  womenBonus: number;
  economicInterest: number;
  netValue: number;
  newEntrantBonus: number;
  total: number;
  subMinimumMet: boolean;
  fullOwnershipAwarded: boolean;
  rawStats: {
    blackVotingPercentage: number;
    blackWomenVotingPercentage: number;
    economicInterestPercentage: number;
    netValuePercentage: number;
  };
}

function getGraduationFactor(years: number): number {
  if (years <= 0) return 0;
  const yearKeys = Object.keys(GRADUATION_TABLE).map(Number).sort((a, b) => a - b);
  let factor = 0;
  for (const y of yearKeys) {
    if (y <= years) factor = GRADUATION_TABLE[y];
    else break;
  }
  return factor;
}

export function calculateOwnershipScore(data: OwnershipData, config?: CalculatorConfig): OwnershipResult {
  const shareholders = data.shareholders || [];
  const { companyValue, outstandingDebt, yearsHeld } = data;

  const oc = config?.ownership;
  const MAX_POINTS = {
    votingRights: oc?.votingRightsMax ?? 4,
    womenBonus: oc?.womenBonusMax ?? 2,
    economicInterest: oc?.economicInterestMax ?? 8,
    netValue: oc?.netValueMax ?? 8,
  };
  const TARGET_ECONOMIC_INTEREST = oc?.targetEconomicInterest ?? FULL_OWNERSHIP_THRESHOLD;
  const SUB_MIN_NET_VALUE = oc?.subMinNetValue ?? 3.2;

  const totalSharesRaw = shareholders.reduce((acc, sh) => acc + sh.shares, 0);
  const hasShares = totalSharesRaw > 0;

  let totalBlackVoting = 0;
  let totalBlackWomenVoting = 0;
  let totalEconomicInterest = 0;
  let netValuePointsAgg = 0;

  for (const sh of shareholders) {
    const pct = hasShares
      ? sh.shares / totalSharesRaw
      : shareholders.length > 0 ? 1 / shareholders.length : 0;

    totalBlackVoting += pct * sh.blackOwnership;
    totalBlackWomenVoting += pct * sh.blackWomenOwnership;
    totalEconomicInterest += pct * sh.blackOwnership;

    if (sh.shareValue > 0 && sh.blackOwnership > 0) {
      const debtAttributable = outstandingDebt * pct;
      const carryingValue = sh.shareValue * pct;
      const shareValueAllocated = companyValue * pct;
      const deemedValue = (shareValueAllocated - debtAttributable) / carryingValue;
      netValuePointsAgg += Math.max(0, deemedValue) * sh.blackOwnership;
    }
  }

  const fullOwnershipAwarded = totalBlackVoting >= FULL_OWNERSHIP_THRESHOLD && hasShares;

  const votingRightsPoints = fullOwnershipAwarded
    ? MAX_POINTS.votingRights
    : safeRatio(totalBlackVoting, FULL_OWNERSHIP_THRESHOLD, MAX_POINTS.votingRights);

  const womenBonusPoints = (totalBlackWomenVoting >= WOMEN_BONUS_THRESHOLD && shareholders.length >= 1)
    ? MAX_POINTS.womenBonus
    : safeRatio(totalBlackWomenVoting, WOMEN_BONUS_THRESHOLD, MAX_POINTS.womenBonus);

  let economicInterestPoints: number;
  let netValuePoints: number;

  if (fullOwnershipAwarded) {
    economicInterestPoints = MAX_POINTS.economicInterest;
    netValuePoints = MAX_POINTS.netValue;
  } else {
    const gradFactor = getGraduationFactor(yearsHeld);
    const formulaA = gradFactor > 0
      ? totalEconomicInterest * (1 / (TARGET_ECONOMIC_INTEREST * gradFactor)) * 8
      : 0;
    const formulaB = (totalEconomicInterest / TARGET_ECONOMIC_INTEREST) * 8;
    economicInterestPoints = clampScore(Math.max(formulaA, formulaB), MAX_POINTS.economicInterest);

    const hasNetValue = companyValue > 0 && shareholders.some(s => s.shareValue > 0);
    if (hasNetValue) {
      netValuePoints = clampScore(netValuePointsAgg, MAX_POINTS.netValue);
    } else {
      netValuePoints = totalBlackVoting >= 1.0
        ? MAX_POINTS.netValue
        : safeRatio(totalBlackVoting, FULL_OWNERSHIP_THRESHOLD, MAX_POINTS.netValue);
    }
  }

  const newEntrantBonus = shareholders.some(s => s.blackNewEntrant === true) ? NEW_ENTRANT_BONUS_POINTS : 0;
  const subMinimumMet = fullOwnershipAwarded || netValuePoints >= SUB_MIN_NET_VALUE;
  const totalPoints = votingRightsPoints + womenBonusPoints + economicInterestPoints + netValuePoints + newEntrantBonus;

  return {
    votingRights: votingRightsPoints,
    womenBonus: womenBonusPoints,
    economicInterest: economicInterestPoints,
    netValue: netValuePoints,
    newEntrantBonus,
    total: clampScore(totalPoints, MAX_TOTAL),
    subMinimumMet,
    fullOwnershipAwarded,
    rawStats: {
      blackVotingPercentage: totalBlackVoting,
      blackWomenVotingPercentage: totalBlackWomenVoting,
      economicInterestPercentage: totalEconomicInterest,
      netValuePercentage: fullOwnershipAwarded ? 1.0 : netValuePointsAgg / MAX_POINTS.netValue,
    },
  };
}
