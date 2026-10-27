import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { CleanedReportRow, TargetItem } from '../../types/index.ts';
import { STATES } from '../../constants/index.ts';
import { formatNaira, formatNumber, formatPercent, formatDateString } from '../../utils/formatters.ts';
import { getTargetValue } from '../../utils/cleaner.ts';
import { TrendingUp, DollarSign, Award, Target } from 'lucide-react';

interface RevenueTabProps {
  rows: CleanedReportRow[];
  targets: TargetItem[];
}

export const RevenueTab: React.FC<RevenueTabProps> = ({ rows, targets }) => {
  // 1. Revenue by State
  const revenueByState = STATES.map((state) => {
    const stateRows = rows.filter((r) => r.state === state);
    const actualRev = stateRows.reduce((sum, r) => sum + r.rev, 0);
    const q4Target = getTargetValue(targets, state, 'Revenue', 'Q4') || 0;
    const attainment = q4Target > 0 ? (actualRev / q4Target) * 100 : 0;

    return {
      state,
      revenue: actualRev,
      target: q4Target,
      attainment: Math.round(attainment * 10) / 10,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // 2. Weekly Trend and Cumulative Revenue
  const allWeeks = Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean).sort();
  let cumulativeActual = 0;

  // Calculate overall Q4 target across 7 states
  const totalQ4Target = STATES.reduce(
    (sum, state) => sum + (getTargetValue(targets, state, 'Revenue', 'Q4') || 0),
    0
  );

  const weeklyTrendData = allWeeks.map((week, idx) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const weeklyRev = weekRows.reduce((sum, r) => sum + r.rev, 0);
    cumulativeActual += weeklyRev;

    // Prorated weekly target pace (12 weeks in Q4)
    const weeksInQ4 = 12;
    const proratedTarget = Math.round((totalQ4Target / weeksInQ4) * (idx + 1));

    return {
      week: formatDateString(week),
      rawWeek: week,
      weeklyRevenue: weeklyRev,
      cumulative: cumulativeActual,
      targetPace: proratedTarget,
      q4FullTarget: totalQ4Target,
    };
  });

  const totalActualRevenue = rows.reduce((sum, r) => sum + r.rev, 0);
  const overallAttainment = totalQ4Target > 0 ? (totalActualRevenue / totalQ4Target) * 100 : 0;

  // Top revenue generating state
  const topState = revenueByState.length > 0 ? revenueByState[0] : null;

  return (
    <div className="space-y-8">
      {/* 4 Revenue High-Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Actual Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F6B3A] font-mono tabular-nums">
            {formatNaira(totalActualRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Generated across {rows.length} validated officer reports
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Q4 Target</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {formatNaira(totalQ4Target)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Combined 3-month quota for all 7 states
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Attainment</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums">
            {formatPercent(overallAttainment)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Attainment toward overall quarterly target
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commercial Leader</span>
            <Award className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 truncate">
            {topState ? topState.state : 'None'}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            {topState ? `${formatNaira(topState.revenue)} (${topState.attainment}% of quota)` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart 1: Revenue by State vs Q4 Target */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Revenue by State vs Q4 Target (₦)</h4>
            <p className="text-xs text-slate-500">Commercial revenue performance compared against allocated state quotas</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByState} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="state" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis
                tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <Tooltip
                formatter={(val: any) => [formatNaira(Number(val)), '']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Actual Revenue (₦)" fill="#1F6B3A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Q4 Quota (₦)" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Weekly Trend and Cumulative Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Revenue Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">Weekly Sales Revenue Trajectory</h4>
          <p className="text-xs text-slate-500 mb-4">Revenue recorded across all states by week</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChartComponent data={weeklyTrendData} />
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Revenue vs Target Pace */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">Cumulative Revenue vs Target Progression</h4>
          <p className="text-xs text-slate-500 mb-4">Cumulative actual earnings vs prorated target trajectory</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatNaira(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="cumulative" name="Actual Cumulative (₦)" stroke="#1F6B3A" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="targetPace" name="Target Pace (₦)" stroke="#E8A317" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for weekly revenue area chart
const AreaChartComponent: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <AreaChartComponentInner data={data} />
  );
};

import { AreaChart } from 'recharts';

const AreaChartComponentInner: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1F6B3A" stopOpacity={0.4} />
          <stop offset="95%" stopColor="#1F6B3A" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569' }} />
      <YAxis
        tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
        tick={{ fontSize: 11, fill: '#475569' }}
      />
      <Tooltip
        formatter={(val: any) => [formatNaira(Number(val)), 'Weekly Revenue']}
        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
      />
      <Area type="monotone" dataKey="weeklyRevenue" stroke="#1F6B3A" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
    </AreaChart>
  );
};
