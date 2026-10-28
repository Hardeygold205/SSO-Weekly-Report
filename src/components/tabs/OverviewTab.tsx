import React, { useMemo } from 'react';
import {
  FileText,
  Clock,
  Users,
  Store,
  Building2,
  MapPin,
  GraduationCap,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CleanedReportRow, TargetItem } from '../../types/index.ts';
import { generateKeyInsights } from '../../utils/insights.ts';
import { formatNaira, formatNumber, formatPercent } from '../../utils/formatters.ts';
import { STATES } from '../../constants/index.ts';
import { resolveActiveStates } from '../../utils/cleaner.ts';

interface OverviewTabProps {
  rows: CleanedReportRow[];
  targets: TargetItem[];
  selectedWeek: string;
  selectedMonth: string;
  selectedState: string;
  selectedOfficer?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  rows,
  targets,
  selectedWeek,
  selectedMonth,
  selectedState,
  selectedOfficer,
}) => {
  // 1. KPI Calculations
  const distinctWeeks = Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean);
  const numberOfWeeks = distinctWeeks.length || 1;
  const isSingleOfficer = (selectedOfficer && selectedOfficer !== 'all') || selectedState !== 'all';
  const expectedOfficerCount = isSingleOfficer ? 1 : 7;
  const expectedReports = expectedOfficerCount * numberOfWeeks;
  const reportsReceived = rows.length;
  const reportingRate = expectedReports > 0 ? (reportsReceived / expectedReports) * 100 : 0;

  const onTimeCount = rows.filter((r) => r.submission_status === 'On time').length;
  const onTimeRate = reportsReceived > 0 ? (onTimeCount / reportsReceived) * 100 : 0;

  const agentsValidated = rows.reduce((sum, r) => sum + r.agent_val, 0);
  const vendorsValidated = rows.reduce((sum, r) => sum + r.vend_val, 0);
  const coopsIdentified = rows.reduce((sum, r) => sum + r.n_coop_id, 0);
  const facEstablished = rows.reduce((sum, r) => sum + r.fac_established, 0);
  const trainSessions = rows.reduce((sum, r) => sum + r.train_sess, 0);
  const coopTrainSessions = rows.reduce((sum, r) => sum + r.coop_train, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.rev, 0);

  // Active states reflecting selected filters strictly (All 7 states when 'all', or only the chosen state/officer)
  const activeStates = useMemo(() => {
    return resolveActiveStates(selectedState, selectedOfficer);
  }, [selectedState, selectedOfficer]);

  // Key insights generated deterministically
  const insights = generateKeyInsights(rows, targets, selectedWeek);

  return (
    <div className="space-y-6">
      {/* 8 Primary KPI Cards (Projector-Ready Big Numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Reports Received */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reports Received</span>
            <FileText className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {reportsReceived}
              </span>
              <span className="text-xs font-medium text-slate-400">/ {expectedReports} expected</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-slate-700">{formatPercent(reportingRate)}</span>
              <span>submission compliance</span>
            </div>
          </div>
        </div>

        {/* KPI 2: On-Time Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">On-Time Submissions</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono tabular-nums ${
                  onTimeRate >= 80 ? 'text-emerald-700' : onTimeRate >= 60 ? 'text-amber-600' : 'text-rose-600'
                }`}
              >
                {formatPercent(onTimeRate)}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-slate-700">{onTimeCount}</span>
              <span>on-time reports (by Thursday)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Agents Validated */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agents Validated</span>
            <Users className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(agentsValidated)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              New identified: <span className="font-medium text-slate-700">{formatNumber(rows.reduce((s, r) => s + r.n_agent_id, 0))}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Vendors Validated */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vendors Validated</span>
            <Store className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(vendorsValidated)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              New identified: <span className="font-medium text-slate-700">{formatNumber(rows.reduce((s, r) => s + r.n_vend_id, 0))}</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Cooperatives Identified */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cooperatives Identified</span>
            <Building2 className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(coopsIdentified)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Farmer groups mapped across states
            </div>
          </div>
        </div>

        {/* KPI 6: FAC Sites Established */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">FAC Sites Established</span>
            <MapPin className="w-4 h-4 text-[#E8A317]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(facEstablished)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Farmers Aggregation Centers established
            </div>
          </div>
        </div>

        {/* KPI 7: Training Sessions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Training Sessions</span>
            <GraduationCap className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(trainSessions)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Plus <span className="font-medium text-slate-700">{formatNumber(coopTrainSessions)}</span> coop trainings
            </div>
          </div>
        </div>

        {/* KPI 8: Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1F6B3A] font-mono tabular-nums truncate">
              {formatNaira(totalRevenue)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Net commercial revenue generated
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights Box (Section 5a) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Operational Key Insights</h3>
            <p className="text-xs text-slate-500">
              Automated deterministic analysis based on current weekly submissions and field quotas
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((sentence, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50/80 border border-slate-100 text-sm text-slate-800"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#1F6B3A] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </div>
              <p className="leading-snug text-slate-700">{sentence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick State Leaderboard Breakdown (Respects Selected Filters) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by State ranking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h4 className="font-bold text-slate-900 text-sm mb-3">
            {activeStates.length === 1 ? `${activeStates[0]} Revenue Performance` : 'State Revenue Performance'}
          </h4>
          <div className="space-y-2.5">
            {activeStates.map((state) => {
              const stateRev = rows.filter((r) => r.state === state).reduce((sum, r) => sum + r.rev, 0);
              const maxRev = Math.max(...activeStates.map((s) => rows.filter((r) => r.state === s).reduce((sum, r) => sum + r.rev, 0)), 1);
              const widthPct = Math.round((stateRev / maxRev) * 100);

              return (
                <div key={state} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{state}</span>
                    <span className="font-mono font-semibold text-slate-900">{formatNaira(stateRev)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#1F6B3A] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Validation ranking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h4 className="font-bold text-slate-900 text-sm mb-3">
            {activeStates.length === 1 ? `${activeStates[0]} Agent Validation` : 'State Agent Validation'}
          </h4>
          <div className="space-y-2.5">
            {activeStates.map((state) => {
              const stateVal = rows.filter((r) => r.state === state).reduce((sum, r) => sum + r.agent_val, 0);
              const maxVal = Math.max(...activeStates.map((s) => rows.filter((r) => r.state === s).reduce((sum, r) => sum + r.agent_val, 0)), 1);
              const widthPct = Math.round((stateVal / maxVal) * 100);

              return (
                <div key={state} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{state}</span>
                    <span className="font-mono font-semibold text-slate-900">{formatNumber(stateVal)} validated</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#E8A317] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
