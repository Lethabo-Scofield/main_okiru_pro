import { useState, useMemo } from "react";
import { Switch } from "@toolkit/components/ui/switch";
import { Label } from "@toolkit/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@toolkit/components/ui/tooltip";
import { ChevronDown, ChevronRight, HelpCircle, Award, Shield, TrendingUp, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { useBbeeStore } from "@toolkit/lib/store";
import { calculateOwnershipScore } from "@toolkit/lib/calculators/ownership";
import { calculateManagementScore } from "@toolkit/lib/calculators/management";
import { calculateSkillsScore } from "@toolkit/lib/calculators/skills";
import { calculateProcurementScore } from "@toolkit/lib/calculators/procurement";
import { calculateEsdScore, calculateSedScore } from "@toolkit/lib/calculators/esd-sed";
import { cn } from "@toolkit/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SubIndicator {
  name: string;
  target: string;
  weighting: number;
  score: number;
  formula: string;
}

interface ScorecardElement {
  key: string;
  name: string;
  target: number;
  weighting: number;
  score: number;
  subMinimumMet?: boolean;
  subMinLabel?: string;
  subIndicators: SubIndicator[];
  accentColor: string;
  barColor: string;
}

function fmt(value: number, full: boolean): string {
  return full ? value.toFixed(4) : value.toFixed(2);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function Scorecard() {
  const { scorecard, ownership, management, skills, procurement, esd, sed, client } = useBbeeStore();
  const [wrapMode, setWrapMode] = useState(true);
  const [fullFigures, setFullFigures] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    if (expandedRows.size === elements.length) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(elements.map(e => e.key)));
    }
  };

  const ownResult = useMemo(() => calculateOwnershipScore(ownership), [ownership]);
  const mgtResult = useMemo(() => calculateManagementScore(management), [management]);
  const skillResult = useMemo(() => calculateSkillsScore(skills), [skills]);
  const procResult = useMemo(() => calculateProcurementScore(procurement), [procurement]);
  const esdResult = useMemo(() => calculateEsdScore(esd, client.npat), [esd, client.npat]);
  const sedResult = useMemo(() => calculateSedScore(sed, client.npat), [sed, client.npat]);

  const tmps = procurement.tmps || 1;

  const elements: ScorecardElement[] = [
    {
      key: "ownership",
      name: "Ownership",
      ...scorecard.ownership,
      accentColor: "text-violet-500 dark:text-violet-400",
      barColor: "bg-violet-500",
      subMinLabel: ownResult.fullOwnershipAwarded
        ? `Black Voting ${pct(ownResult.rawStats.blackVotingPercentage)} ≥ 25%: Full 25 pts awarded`
        : `Net Value ≥ 3.2 or Black Voting ≥ 25%: ${ownResult.subMinimumMet ? 'Met' : 'Not met'}`,
      subIndicators: [
        { name: "Exercisable Voting Rights of Black People", target: "25% + 1 vote", weighting: 4, score: ownResult.votingRights, formula: ownResult.fullOwnershipAwarded ? `Black voting ${pct(ownResult.rawStats.blackVotingPercentage)} ≥ 25% → full 4 pts awarded` : `Black voting ${pct(ownResult.rawStats.blackVotingPercentage)} ÷ 25% target × 4 pts` },
        { name: "Exercisable Voting Rights of Black Women", target: "≥ 10%", weighting: 2, score: ownResult.womenBonus, formula: `BWO voting ${pct(ownResult.rawStats.blackWomenVotingPercentage)} ÷ 10% target × 2 pts` },
        { name: "Economic Interest of Black People", target: "25%", weighting: 8, score: ownResult.economicInterest, formula: ownResult.fullOwnershipAwarded ? `Black voting ≥ 25% → full 8 pts awarded` : `Economic interest ${pct(ownResult.rawStats.economicInterestPercentage)} ÷ 25% target × 8 pts` },
        { name: "Net Value of Black People", target: "25%", weighting: 8, score: ownResult.netValue, formula: ownResult.fullOwnershipAwarded ? `Black voting ≥ 25% → full 8 pts awarded` : `Net value effective % = ${pct(ownResult.rawStats.netValuePercentage)}` },
        { name: "Black New Entrant Bonus", target: "New Entrant", weighting: 3, score: ownResult.newEntrantBonus, formula: `Bonus if any shareholder is a Black New Entrant` },
      ],
    },
    {
      key: "managementControl",
      name: "Management Control",
      ...scorecard.managementControl,
      accentColor: "text-blue-500 dark:text-blue-400",
      barColor: "bg-blue-500",
      subIndicators: [
        { name: "Board Participation – Executive Directors", target: "50% black", weighting: 3, score: mgtResult.boardExecBlack, formula: `Black board % ${pct(mgtResult.rawStats.boardBlackVotingPercentage)} ÷ 50% × 3 pts` },
        { name: "Board Participation – Non-Executive Directors", target: "50% black", weighting: 2, score: mgtResult.boardNonExec, formula: `Black board % ${pct(mgtResult.rawStats.boardBlackVotingPercentage)} ÷ 50% × 2 pts` },
        { name: "Board Participation – Black Women", target: "25% BWO", weighting: 1, score: mgtResult.boardBWO, formula: `BWO board % ${pct(mgtResult.rawStats.boardBlackWomenVotingPercentage)} ÷ 25% × 1 pt` },
        { name: "Other Executive Management – Black", target: "60% black", weighting: 2, score: mgtResult.otherExecBlack, formula: `Black exec % ${pct(mgtResult.rawStats.execBlackVotingPercentage)} ÷ 60% × 2 pts` },
        { name: "Other Executive Management – BWO", target: "30% BWO", weighting: 2, score: mgtResult.otherExecBWO, formula: `BWO exec % ${pct(mgtResult.rawStats.execBlackWomenVotingPercentage)} ÷ 30% × 2 pts` },
        { name: "Senior Management", target: "EAP / 60%", weighting: 5, score: mgtResult.senior, formula: `Black senior % ${pct(mgtResult.rawStats.seniorBlackPercentage)} ÷ 60% × 5 pts` },
        { name: "Middle Management", target: "EAP / 75%", weighting: 4, score: mgtResult.middle, formula: `Black middle % ${pct(mgtResult.rawStats.middleBlackPercentage)} ÷ 75% × 4 pts` },
        { name: "Junior Management", target: "EAP / 88%", weighting: 4, score: mgtResult.junior, formula: `Black junior % ${pct(mgtResult.rawStats.juniorBlackPercentage)} ÷ 88% × 4 pts` },
        { name: "Employees with Disabilities", target: "3%", weighting: 2, score: mgtResult.disabled, formula: `Black disabled % ${pct(mgtResult.rawStats.disabledBlackPercentage)} ÷ 3% × 2 pts` },
        { name: "Adjusted Recognition for Gender", target: "Gender parity", weighting: 2, score: mgtResult.adjustedRecognition, formula: `Bonus awarded if gender data captured` },
      ],
    },
    {
      key: "skillsDevelopment",
      name: "Skills Development",
      ...scorecard.skillsDevelopment,
      accentColor: "text-emerald-500 dark:text-emerald-400",
      barColor: "bg-emerald-500",
      subMinLabel: `Skills total ≥ 10 pts (40% of 25): ${skillResult.subMinimumMet ? 'Met' : 'Not met'}`,
      subIndicators: [
        { name: "Skills Development Expenditure on Learning Programmes", target: `3.5% of LA`, weighting: 20, score: skillResult.general, formula: `Spend R${(skillResult.actualSpend).toLocaleString()} ÷ target R${skillResult.targetOverall.toLocaleString()} × 20 pts` },
        { name: "  ↳ Black People (EAP)", target: skillResult.eapIndicators.blackPeople.targetPct, weighting: skillResult.eapIndicators.blackPeople.maxPoints, score: skillResult.eapIndicators.blackPeople.score, formula: `Black spend R${skillResult.eapIndicators.blackPeople.spend.toLocaleString()} ÷ ${skillResult.eapIndicators.blackPeople.targetPct} of LA × ${skillResult.eapIndicators.blackPeople.maxPoints} pts` },
        { name: "  ↳ Black Women (EAP)", target: skillResult.eapIndicators.blackWomen.targetPct, weighting: skillResult.eapIndicators.blackWomen.maxPoints, score: skillResult.eapIndicators.blackWomen.score, formula: `BWO spend R${skillResult.eapIndicators.blackWomen.spend.toLocaleString()} ÷ ${skillResult.eapIndicators.blackWomen.targetPct} of LA × ${skillResult.eapIndicators.blackWomen.maxPoints} pts` },
        { name: "  ↳ Black Disabled", target: skillResult.eapIndicators.disabled.targetPct, weighting: skillResult.eapIndicators.disabled.maxPoints, score: skillResult.eapIndicators.disabled.score, formula: `Disabled spend R${skillResult.eapIndicators.disabled.spend.toLocaleString()} ÷ ${skillResult.eapIndicators.disabled.targetPct} of LA × ${skillResult.eapIndicators.disabled.maxPoints} pts` },
        { name: "Bursaries for Black Students", target: `2.5% of LA`, weighting: 5, score: skillResult.bursaries, formula: `Bursary spend R${(skillResult.actualBursarySpend).toLocaleString()} ÷ target R${skillResult.targetBursaries.toLocaleString()} × 5 pts` },
        { name: "  ↳ Absorption Rate", target: "2.5%", weighting: 0, score: 0, formula: `${skillResult.eapIndicators.absorption.count} of ${skillResult.eapIndicators.absorption.total} learners absorbed (${(skillResult.eapIndicators.absorption.rate * 100).toFixed(0)}%)` },
      ],
    },
    {
      key: "procurement",
      name: "Preferential Procurement",
      ...scorecard.procurement,
      accentColor: "text-amber-500 dark:text-amber-400",
      barColor: "bg-amber-500",
      subMinLabel: `Procurement base ≥ 11.6 pts: ${procResult.subMinimumMet ? 'Met' : 'Not met'}`,
      subIndicators: [
        { name: "B-BBEE Procurement Spend from Empowering Suppliers", target: "80% of TMPS", weighting: 25, score: procResult.base, formula: `Recognised spend R${procResult.recognisedSpend.toLocaleString()} ÷ target R${procResult.target.toLocaleString()} × 25 pts` },
        { name: "Procurement from Designated Groups (51%+ black owned)", target: "12% of TMPS", weighting: 2, score: procResult.designatedGroup, formula: `Designated group spend R${(procResult.rawStats?.designatedGroupSpend || 0).toLocaleString()} ÷ TMPS R${tmps.toLocaleString()} × factor` },
      ],
    },
    {
      key: "enterpriseDevelopment",
      name: "Enterprise & Supplier Development",
      ...scorecard.enterpriseDevelopment,
      accentColor: "text-rose-500 dark:text-rose-400",
      barColor: "bg-rose-500",
      subIndicators: [
        { name: "Supplier Development Contributions", target: "2% of NPAT", weighting: 10, score: esdResult.supplierDev, formula: `SD spend R${esdResult.sdSpend.toLocaleString()} ÷ target R${esdResult.sdTarget.toLocaleString()} × 10 pts` },
        { name: "Enterprise Development Contributions", target: "1% of NPAT", weighting: 5, score: esdResult.enterpriseDev, formula: `ED spend R${esdResult.edSpend.toLocaleString()} ÷ target R${esdResult.edTarget.toLocaleString()} × 5 pts` },
      ],
    },
    {
      key: "socioEconomicDevelopment",
      name: "Socio-Economic Development",
      ...scorecard.socioEconomicDevelopment,
      accentColor: "text-sky-500 dark:text-sky-400",
      barColor: "bg-sky-500",
      subIndicators: [
        { name: "SED Contributions", target: "1% of NPAT", weighting: 5, score: sedResult.total, formula: `SED spend R${sedResult.actualSpend.toLocaleString()} ÷ target R${sedResult.target.toLocaleString()} × 5 pts` },
      ],
    },
    {
      key: "yesInitiative",
      name: "YES Initiative",
      ...scorecard.yesInitiative,
      accentColor: "text-purple-500 dark:text-purple-400",
      barColor: "bg-purple-500",
      subIndicators: [
        { name: "Youth Employment Service Programme", target: "Jobs absorbed", weighting: 5, score: scorecard.yesInitiative.score, formula: `Bonus points for YES programme participation` },
      ],
    },
  ];

  const displayLevel = scorecard.isDiscounted ? scorecard.discountedLevel : scorecard.achievedLevel;
  const levelLabel = displayLevel >= 9 ? "Non-Compliant" : `Level ${displayLevel}`;
  const totalPct = scorecard.total.weighting > 0 ? Math.min(100, (scorecard.total.score / scorecard.total.weighting) * 100) : 0;

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto" data-testid="page-scorecard">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight" data-testid="text-scorecard-title">Full Scorecard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generic B-BBEE Scorecard with sub-indicator breakdown.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="wrap-toggle" checked={wrapMode} onCheckedChange={setWrapMode} data-testid="toggle-wrap" />
              <Label htmlFor="wrap-toggle" className="text-xs text-muted-foreground cursor-pointer">Wrap</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="figures-toggle" checked={fullFigures} onCheckedChange={setFullFigures} data-testid="toggle-full-figures" />
              <Label htmlFor="figures-toggle" className="text-xs text-muted-foreground cursor-pointer">Full figures</Label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="p-5 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0",
                displayLevel <= 3 ? "bg-emerald-500/10" : displayLevel <= 6 ? "bg-amber-500/10" : "bg-destructive/10"
              )}>
                <Trophy className={cn(
                  "h-7 w-7",
                  displayLevel <= 3 ? "text-emerald-500" : displayLevel <= 6 ? "text-amber-500" : "text-destructive"
                )} />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">B-BBEE Status</div>
                <div className="text-xl font-heading font-bold" data-testid="text-level">{levelLabel}</div>
                {scorecard.isDiscounted && (
                  <div className="text-[11px] text-destructive font-medium">Discounted from Level {scorecard.achievedLevel}</div>
                )}
              </div>
            </div>

            <div className="h-10 w-px bg-border/50 hidden md:block" />

            <div className="flex-1 grid grid-cols-3 gap-5">
              <div>
                <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Total Score</div>
                <div className="text-xl font-bold tabular-nums" data-testid="text-total-score">{fmt(scorecard.total.score, fullFigures)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${totalPct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{scorecard.total.weighting}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Recognition</div>
                <div className="text-xl font-bold tabular-nums" data-testid="text-recognition">{scorecard.recognitionLevel}</div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Procurement multiplier
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Sub-minimum</div>
                <div className={cn(
                  "text-xl font-bold",
                  scorecard.isDiscounted ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {scorecard.isDiscounted ? "Discounted" : "Clear"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  3 priority elements
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/30">
            <div>
              <h2 className="text-sm font-semibold">Generic Scorecard Translation</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Click any row to expand sub-indicators with formulas.</p>
            </div>
            <button
              onClick={expandAll}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              data-testid="btn-expand-all"
            >
              {expandedRows.size === elements.length ? "Collapse all" : "Expand all"}
            </button>
          </div>

          <div className={wrapMode ? "" : "overflow-x-auto"}>
            <table className={cn("w-full text-sm", wrapMode && "table-fixed")}>
              <thead>
                <tr className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <th className={cn("px-4 py-2.5 text-left border-b border-border/30", wrapMode ? "w-[40%]" : "min-w-[240px]")}>Element</th>
                  <th className="px-4 py-2.5 text-right border-b border-border/30 w-[12%]">Target</th>
                  <th className="px-4 py-2.5 text-right border-b border-border/30 w-[12%]">Weight</th>
                  <th className="px-4 py-2.5 text-right border-b border-border/30 w-[18%]">Score</th>
                  <th className="px-4 py-2.5 text-center border-b border-border/30 w-[18%]">Sub-min</th>
                </tr>
              </thead>
              <tbody>
                {elements.map((el) => (
                  <ElementRow
                    key={el.key}
                    element={el}
                    isExpanded={expandedRows.has(el.key)}
                    onToggle={() => toggleRow(el.key)}
                    fullFigures={fullFigures}
                    wrapMode={wrapMode}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Award className="h-4 w-4" />
                      Total Score
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground font-mono text-xs">{scorecard.total.target}</td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground font-mono text-xs">{scorecard.total.weighting}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold font-mono text-base text-primary tabular-nums" data-testid="text-scorecard-total">
                      {fmt(scorecard.total.score, fullFigures)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {scorecard.isDiscounted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-bold uppercase" data-testid="badge-discounted">
                        <XCircle className="h-3 w-3" />
                        Discounted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase" data-testid="badge-no-discount">
                        <CheckCircle2 className="h-3 w-3" />
                        No Discount
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Sub-minimum Compliance
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Priority elements that must meet 40% threshold to avoid level discounting.</p>
          </div>
          <div className="p-4 grid gap-3 sm:grid-cols-3">
            {[
              { name: "Ownership", threshold: "≥ 10 pts", detail: "40% of 25", met: scorecard.ownership.subMinimumMet, score: scorecard.ownership.score, target: 25, color: "text-violet-500 dark:text-violet-400" },
              { name: "Skills Development", threshold: "≥ 10 pts", detail: "40% of 25", met: scorecard.skillsDevelopment.subMinimumMet, score: scorecard.skillsDevelopment.score, target: 25, color: "text-emerald-500 dark:text-emerald-400" },
              { name: "Pref. Procurement", threshold: "≥ 11.6 pts", detail: "40% of 29", met: scorecard.procurement.subMinimumMet, score: scorecard.procurement.score, target: 25, color: "text-amber-500 dark:text-amber-400" },
            ].map(sm => (
              <div
                key={sm.name}
                className="rounded-lg border border-border/40 p-3.5"
                data-testid={`submin-${sm.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs font-semibold", sm.color)}>{sm.name}</span>
                  {sm.met ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold tabular-nums">{sm.score.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{sm.threshold} ({sm.detail})</div>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {Math.round((sm.score / sm.target) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ElementRow({ element, isExpanded, onToggle, fullFigures, wrapMode }: {
  element: ScorecardElement;
  isExpanded: boolean;
  onToggle: () => void;
  fullFigures: boolean;
  wrapMode: boolean;
}) {
  const el = element;
  const achievement = el.weighting > 0 ? Math.min(100, (el.score / el.weighting) * 100) : 0;

  return (
    <>
      <tr
        className="hover:bg-muted/20 transition-colors cursor-pointer group border-b border-border/20 last:border-b-0"
        onClick={onToggle}
        data-testid={`row-element-${el.key}`}
      >
        <td className={cn("px-4 py-3", wrapMode && "break-words")}>
          <div className="flex items-center gap-2">
            <div className="shrink-0">
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-primary" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
              }
            </div>
            <span className={cn("font-medium text-[13px]", isExpanded && el.accentColor)}>{el.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">{el.target}</td>
        <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">{el.weighting}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block w-12 h-1 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", el.barColor)} style={{ width: `${achievement}%` }} />
            </div>
            <span className="font-mono font-bold text-[13px] tabular-nums">{fmt(el.score, fullFigures)}</span>
            {el.subMinLabel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/30 hover:text-primary cursor-help shrink-0" data-testid={`tooltip-${el.key}`} />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px] text-[11px]">
                  <p>{el.subMinLabel}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {'subMinimumMet' in el && el.subMinimumMet === false ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-bold uppercase">
              <XCircle className="h-3 w-3" />
              Failed
            </span>
          ) : 'subMinimumMet' in el && el.subMinimumMet === true ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              <CheckCircle2 className="h-3 w-3" />
              Passed
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={5} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/10 border-b border-border/20">
                  <table className={cn("w-full text-xs", wrapMode && "table-fixed")}>
                    <tbody>
                      {el.subIndicators.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-muted/15 border-b border-border/10 last:border-b-0">
                          <td className={cn("px-4 py-2 pl-11 text-muted-foreground", wrapMode ? "w-[40%] break-words" : "min-w-[240px]")}>
                            {sub.name}
                          </td>
                          <td className="px-4 py-2 text-right text-muted-foreground/50 font-mono w-[12%]">{sub.target}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground/50 font-mono w-[12%]">{sub.weighting}</td>
                          <td className="px-4 py-2 text-right w-[18%]">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-semibold text-foreground/70 tabular-nums">{fmt(sub.score, fullFigures)}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/25 hover:text-primary cursor-help shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[280px] text-[11px]">
                                  <p>{sub.formula}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="px-4 py-2 w-[18%]"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
