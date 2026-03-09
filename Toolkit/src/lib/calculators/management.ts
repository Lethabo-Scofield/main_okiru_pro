import type { ManagementData, Employee } from '../types';
import type { CalculatorConfig } from '../../../../shared/schema';
import { isBlackRace, safeRatio, clampScore } from './shared';

const SENIOR_TARGET = 0.60;
const MIDDLE_TARGET = 0.75;
const JUNIOR_TARGET = 0.88;
const DISABLED_TARGET = 0.03;
const MAX_TOTAL = 27;

export interface ManagementResult {
  boardExecBlack: number;
  boardNonExec: number;
  boardBWO: number;
  boardTotal: number;
  otherExecBlack: number;
  otherExecBWO: number;
  execTotal: number;
  senior: number;
  middle: number;
  junior: number;
  disabled: number;
  adjustedRecognition: number;
  total: number;
  subMinimumMet: boolean;
  rawStats: {
    boardBlackVotingPercentage: number;
    boardBlackWomenVotingPercentage: number;
    execBlackVotingPercentage: number;
    execBlackWomenVotingPercentage: number;
    seniorBlackPercentage: number;
    middleBlackPercentage: number;
    juniorBlackPercentage: number;
    disabledBlackPercentage: number;
  };
}

const countBlack = (emps: Employee[]): number =>
  emps.filter(e => isBlackRace(e.race)).length;

const countBlackWomen = (emps: Employee[]): number =>
  emps.filter(e => isBlackRace(e.race) && e.gender === 'Female').length;

function groupByDesignation(employees: Employee[]): Record<string, Employee[]> {
  const groups: Record<string, Employee[]> = {};
  for (const emp of employees) {
    (groups[emp.designation] ??= []).push(emp);
  }
  return groups;
}

function designationScore(emps: Employee[], target: number, maxPoints: number): { score: number; blackPct: number } {
  if (emps.length === 0) return { score: 0, blackPct: 0 };
  const blackPct = countBlack(emps) / emps.length;
  return { score: safeRatio(blackPct, target, maxPoints), blackPct };
}

export function calculateManagementScore(data: ManagementData, config?: CalculatorConfig): ManagementResult {
  const employees = data.employees || [];
  const grouped = groupByDesignation(employees);
  const mc = config?.management;

  const boardBlackTarget = mc?.boardBlackTarget ?? 0.5;
  const boardWomenTarget = mc?.boardWomenTarget ?? 0.25;
  const boardBlackPoints = mc?.boardBlackPoints ?? 6;
  const boardWomenPoints = mc?.boardWomenPoints ?? 1;
  const execBlackTarget = mc?.execBlackTarget ?? 0.6;
  const execWomenTarget = mc?.execWomenTarget ?? 0.3;
  const execBlackPoints = mc?.execBlackPoints ?? 4;
  const execWomenPoints = mc?.execWomenPoints ?? 2;

  const board = grouped['Board'] || [];
  const allExec = [
    ...(grouped['Executive'] || []),
    ...(grouped['Executive Director'] || []),
    ...(grouped['Other Executive Management'] || []),
  ];
  const senior = grouped['Senior'] || [];
  const middle = grouped['Middle'] || [];
  const junior = grouped['Junior'] || [];

  const boardBlackPct = board.length > 0 ? countBlack(board) / board.length : 0;
  const boardBWOPct = board.length > 0 ? countBlackWomen(board) / board.length : 0;
  const boardExecBlack = board.length > 0 ? safeRatio(boardBlackPct, boardBlackTarget, 3) : 0;
  const boardNonExec = board.length > 0 ? safeRatio(boardBlackPct, boardBlackTarget, 2) : 0;
  const boardBWO = board.length > 0 ? safeRatio(boardBWOPct, boardWomenTarget, boardWomenPoints) : 0;
  const boardTotal = clampScore(boardExecBlack + boardNonExec + boardBWO, boardBlackPoints);

  const execBlackPct = allExec.length > 0 ? countBlack(allExec) / allExec.length : 0;
  const execBWOPct = allExec.length > 0 ? countBlackWomen(allExec) / allExec.length : 0;
  const otherExecBlack = allExec.length > 0 ? safeRatio(execBlackPct, execBlackTarget, 2) : 0;
  const otherExecBWO = allExec.length > 0 ? safeRatio(execBWOPct, execWomenTarget, execWomenPoints) : 0;
  const execTotal = clampScore(otherExecBlack + otherExecBWO, execBlackPoints);

  const seniorResult = designationScore(senior, SENIOR_TARGET, 5);
  const middleResult = designationScore(middle, MIDDLE_TARGET, 4);
  const juniorResult = designationScore(junior, JUNIOR_TARGET, 4);

  const disabledEmps = employees.filter(e => e.isDisabled);
  const blackDisabled = countBlack(disabledEmps);
  const disabledScore = employees.length > 0
    ? safeRatio(blackDisabled / Math.max(employees.length, 1), DISABLED_TARGET, 2)
    : 0;

  const adjustedRecognition = employees.some(e => e.gender === 'Female') ? 2 : 0;

  const totalPoints = boardTotal + execTotal +
    seniorResult.score + middleResult.score + juniorResult.score +
    disabledScore + adjustedRecognition;

  return {
    boardExecBlack,
    boardNonExec,
    boardBWO,
    boardTotal,
    otherExecBlack,
    otherExecBWO,
    execTotal,
    senior: seniorResult.score,
    middle: middleResult.score,
    junior: juniorResult.score,
    disabled: disabledScore,
    adjustedRecognition,
    total: clampScore(totalPoints, MAX_TOTAL),
    subMinimumMet: true,
    rawStats: {
      boardBlackVotingPercentage: boardBlackPct,
      boardBlackWomenVotingPercentage: boardBWOPct,
      execBlackVotingPercentage: execBlackPct,
      execBlackWomenVotingPercentage: execBWOPct,
      seniorBlackPercentage: seniorResult.blackPct,
      middleBlackPercentage: middleResult.blackPct,
      juniorBlackPercentage: juniorResult.blackPct,
      disabledBlackPercentage: employees.length > 0 ? blackDisabled / employees.length : 0,
    },
  };
}
