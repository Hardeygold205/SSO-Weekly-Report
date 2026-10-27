import React, { useMemo } from 'react';
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
} from 'recharts';
import { CleanedReportRow } from '../../types/index.ts';
import { STATES, PROJECT_LABELS, CHALLENGE_LABELS } from '../../constants/index.ts';
import { formatNumber, formatPercent, formatDateString } from '../../utils/formatters.ts';
import { Briefcase, AlertOctagon, FileCheck, Layers } from 'lucide-react';

interface ProjectsChallengesTabProps {
  rows: CleanedReportRow[];
}

interface ProjectStateRow {
  state: string;
  totalReports: number;
  none: number;
  heifer: number;
  sha: number;
  ignitia: number;
  other: number;
  [key: string]: string | number;
}

export const ProjectsChallengesTab: React.FC<ProjectsChallengesTabProps> = ({ rows }) => {
  // Determine active states matching the active filter selection
  const activeStates = useMemo(() => {
    const statesInRows = Array.from(new Set(rows.map((r) => r.state))).filter(Boolean);
    if (statesInRows.length > 0 && statesInRows.length < STATES.length) {
      return STATES.filter((s) => statesInRows.includes(s));
    }
    return STATES;
  }, [rows]);

  // 1. Projects Breakdown by Project and State
  const projectKeys = Object.keys(PROJECT_LABELS);

  const projectsByState: ProjectStateRow[] = activeStates.map((state) => {
    const stateRows = rows.filter((r) => r.state === state);
    const breakdown: Record<string, number> = {
      none: 0,
      heifer: 0,
      sha: 0,
      ignitia: 0,
      other: 0,
    };
    projectKeys.forEach((p) => (breakdown[p] = 0));

    stateRows.forEach((r) => {
      const p = r.proj || 'none';
      breakdown[p] = (breakdown[p] || 0) + 1;
    });

    return {
      state,
      totalReports: stateRows.length,
      none: breakdown.none || 0,
      heifer: breakdown.heifer || 0,
      sha: breakdown.sha || 0,
      ignitia: breakdown.ignitia || 0,
      other: breakdown.other || 0,
      ...breakdown,
    };
  });

  // Projects total counts
  const projectTotalCounts = projectKeys.map((k) => {
    const count = rows.filter((r) => r.proj === k).length;
    return {
      code: k,
      label: PROJECT_LABELS[k] || k,
      count,
      pct: rows.length > 0 ? (count / rows.length) * 100 : 0,
    };
  }).filter((p) => p.count > 0 || p.code !== 'other');

  // 2. Weekly State Intelligence Submitted Share (yes/no)
  const intelByState = activeStates.map((state) => {
    const stateRows = rows.filter((r) => r.state === state);
    const yesCount = stateRows.filter((r) => r.intel === 'yes').length;
    const total = stateRows.length;
    const rate = total > 0 ? (yesCount / total) * 100 : 0;

    return {
      state,
      yesCount,
      total,
      rate: Math.round(rate * 10) / 10,
    };
  });

  const allWeeks = Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean).sort();
  const intelByWeek = allWeeks.map((week) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const yesCount = weekRows.filter((r) => r.intel === 'yes').length;
    const total = weekRows.length;
    const rate = total > 0 ? (yesCount / total) * 100 : 0;

    return {
      week: formatDateString(week),
      rawWeek: week,
      yesCount,
      total,
      rate: Math.round(rate * 10) / 10,
    };
  });

  const totalIntelYes = rows.filter((r) => r.intel === 'yes').length;
  const overallIntelRate = rows.length > 0 ? (totalIntelYes / rows.length) * 100 : 0;

  // 3. Challenge Categories Frequency (Bar Chart)
  const challengeKeys = Object.keys(CHALLENGE_LABELS).filter((k) => k !== 'none');
  const challengeFrequency: Record<string, number> = {};
  challengeKeys.forEach((k) => (challengeFrequency[k] = 0));

  rows.forEach((r) => {
    r.challenges.forEach((c) => {
      if (challengeFrequency[c] !== undefined) {
        challengeFrequency[c] += 1;
      } else if (c !== 'none') {
        challengeFrequency[c] = (challengeFrequency[c] || 0) + 1;
      }
    });
  });

  const challengeBarData = Object.entries(challengeFrequency)
    .map(([code, count]) => ({
      code,
      label: CHALLENGE_LABELS[code] || code,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Challenges by State Matrix (scoped to active states)
  const challengesByState = activeStates.map((state) => {
    const stateRows = rows.filter((r) => r.state === state);
    const stateChallenges: Record<string, number> = {};
    challengeKeys.forEach((k) => (stateChallenges[k] = 0));

    stateRows.forEach((r) => {
      r.challenges.forEach((c) => {
        if (stateChallenges[c] !== undefined) {
          stateChallenges[c] += 1;
        }
      });
    });

    return {
      state,
      ...stateChallenges,
    };
  });

  // 5. Weekly Challenge Trend
  const weeklyChallengeTrend = allWeeks.map((week) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const trendItem: Record<string, any> = {
      week: formatDateString(week),
      rawWeek: week,
    };

    challengeKeys.forEach((c) => {
      trendItem[c] = weekRows.filter((r) => r.challenges.includes(c)).length;
    });

    return trendItem;
  });

  return (
    <div className="space-y-8">
      {/* 2 Intelligence & Project Overview Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weekly State Intelligence Submitted</span>
            <div className="text-3xl font-extrabold text-[#1F6B3A] font-mono tabular-nums mt-1">
              {formatPercent(overallIntelRate)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalIntelYes} of {rows.length} reports included competitive / market intelligence
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1F6B3A] flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Field Projects</span>
            <div className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
              {rows.filter((r) => r.proj && r.proj !== 'none').length}{' '}
              <span className="text-base font-normal text-slate-400">reports</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deliverables tagged with Heifer, SHA, Ignitia or partner initiatives
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Section 1: Challenge Categories Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Most Frequently Reported Field Challenges</h4>
            <p className="text-xs text-slate-500">Frequency of operational bottlenecks flagged by SSOs in weekly submissions</p>
          </div>
          <AlertOctagon className="w-5 h-5 text-amber-600" />
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={challengeBarData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} width={140} />
              <Tooltip
                formatter={(val: any) => [`${val} reports`, 'Frequency']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" name="Report Count" fill="#E8A317" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 2: Projects Breakdown by State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm">
            {activeStates.length === 1 ? `Project Deliverables — ${activeStates[0]}` : 'Project Deliverables by State'}
          </h4>
          <span className="text-xs font-mono text-slate-500">Heifer, SHA, Ignitia & Core Ops</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <th className="px-4 py-3">State</th>
                <th className="px-3 py-3 text-center">None (Core SSO)</th>
                <th className="px-3 py-3 text-center text-[#1F6B3A]">Heifer International</th>
                <th className="px-3 py-3 text-center text-amber-800">Self Help Africa (SHA)</th>
                <th className="px-3 py-3 text-center text-sky-800">Ignitia Weather</th>
                <th className="px-3 py-3 text-center text-slate-600">Other Projects</th>
                <th className="px-3 py-3 text-right font-bold">Total Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectsByState.map((row) => (
                <tr key={row.state} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-800">{row.state}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-500">{row.none || 0}</td>
                  <td className="px-3 py-2.5 text-center font-mono font-semibold text-emerald-800 bg-emerald-50/30">
                    {row.heifer || 0}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-semibold text-amber-800 bg-amber-50/30">
                    {row.sha || 0}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-semibold text-sky-800 bg-sky-50/30">
                    {row.ignitia || 0}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-600">{row.other || 0}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{row.totalReports}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: State Intelligence Submissions Share (by State & Week) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Intel Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">State Intelligence Submission Rate by State</h4>
          <p className="text-xs text-slate-500 mb-4">% of reports that include weekly state intelligence</p>
          <div className="space-y-3">
            {intelByState.map((item) => (
              <div key={item.state} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.state}</span>
                  <span className="font-mono font-bold text-slate-900">{formatPercent(item.rate)} ({item.yesCount}/{item.total})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${item.rate >= 80 ? 'bg-emerald-600' : item.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Intel Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">Weekly Intelligence Submission Compliance</h4>
          <p className="text-xs text-slate-500 mb-4">Progression of weekly market intelligence delivery over time</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intelByWeek} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Intel Submission Rate']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="rate" name="Intel Submission Rate (%)" stroke="#1F6B3A" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
