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
} from 'recharts';
import { CleanedReportRow } from '../../types/index.ts';
import { OFFICERS } from '../../constants/index.ts';
import { formatPercent, formatDateString } from '../../utils/formatters.ts';
import { addDaysToDate, resolveActiveOfficers } from '../../utils/cleaner.ts';
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';

interface DisciplineTabProps {
  rows: CleanedReportRow[];
  selectedState?: string;
  selectedOfficer?: string;
  availableWeeks?: string[];
}

export const DisciplineTab: React.FC<DisciplineTabProps> = ({
  rows,
  selectedState = 'all',
  selectedOfficer = 'all',
  availableWeeks = [],
}) => {
  // Derive active officers strictly matching the active filter selection
  const activeOfficers = useMemo(() => {
    return resolveActiveOfficers(selectedOfficer, selectedState);
  }, [selectedOfficer, selectedState]);

  // 1. Overall Metrics
  const totalReports = rows.length;
  const onTimeReports = rows.filter((r) => r.submission_status === 'On time');
  const lateReports = rows.filter((r) => r.submission_status === 'Late');

  const onTimeRate = totalReports > 0 ? (onTimeReports.length / totalReports) * 100 : 0;
  const avgDaysLate =
    lateReports.length > 0
      ? lateReports.reduce((sum, r) => sum + r.days_late, 0) / lateReports.length
      : 0;

  // 2. Discipline by Week (Stacked Bar)
  const allWeeks = useMemo(() => {
    if (availableWeeks && availableWeeks.length > 0) return availableWeeks;
    return Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean).sort();
  }, [availableWeeks, rows]);

  const weeklyDiscipline = allWeeks.map((week) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const onTime = weekRows.filter((r) => r.submission_status === 'On time').length;
    const late = weekRows.filter((r) => r.submission_status === 'Late').length;

    return {
      week: formatDateString(week),
      rawWeek: week,
      'On time': onTime,
      Late: late,
      total: weekRows.length,
    };
  });

  // 3. Discipline by Officer (scoped to active officers)
  const officerDiscipline = activeOfficers.map((officer) => {
    const officerRows = rows.filter(
      (r) => r.sso_code === officer.code || r.sso_name.toLowerCase() === officer.name.toLowerCase()
    );
    const onTime = officerRows.filter((r) => r.submission_status === 'On time').length;
    const late = officerRows.filter((r) => r.submission_status === 'Late').length;
    const total = officerRows.length;
    const rate = total > 0 ? (onTime / total) * 100 : 0;

    return {
      name: officer.name,
      state: officer.state,
      onTime,
      late,
      total,
      rate: Math.round(rate * 10) / 10,
    };
  }).sort((a, b) => b.rate - a.rate);

  // 4. Reporting Tracker Grid
  // Columns = allWeeks; Rows = OFFICERS
  // Cell status:
  // - On time (green)
  // - Late (amber)
  // - Missing (red): if Friday of that week has passed and no report exists
  // - Pending (slate): if Friday has not yet passed and no report exists
  const todayStr = new Date().toISOString().slice(0, 10);

  const getCellStatus = (officerCode: string, officerName: string, weekMonday: string) => {
    const match = rows.find(
      (r) =>
        r.week_start === weekMonday &&
        (r.sso_code === officerCode || r.sso_name.toLowerCase() === officerName.toLowerCase())
    );

    if (match) {
      if (match.submission_status === 'On time') {
        return {
          type: 'on_time' as const,
          label: 'On time',
          subtext: `Submitted ${formatDateString(match.submitted_on)}`,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      }
      return {
        type: 'late' as const,
        label: `Late (+${match.days_late}d)`,
        subtext: `Submitted ${formatDateString(match.submitted_on)}`,
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }

    // No report exists for this week
    // Friday deadline = weekMonday + 4 days
    const fridayDate = addDaysToDate(weekMonday, 4);
    const isFridayPassed = todayStr > fridayDate;

    if (isFridayPassed) {
      return {
        type: 'missing' as const,
        label: 'Missing',
        subtext: `Past Friday ${formatDateString(fridayDate)}`,
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }

    return {
      type: 'pending' as const,
      label: 'Pending',
      subtext: `Due Fri ${formatDateString(fridayDate)}`,
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
    };
  };

  return (
    <div className="space-y-8">
      {/* 2 Primary Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall On-Time Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {formatPercent(onTimeRate)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {onTimeReports.length} of {totalReports} reports submitted on or before Thursday
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Late Submissions</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums">
            {lateReports.length}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Submitted on Friday before form cutoff
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency (Late Reports)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {avgDaysLate.toFixed(1)} <span className="text-base font-normal text-slate-500">days</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Average delay beyond Thursday deadline
          </p>
        </div>
      </div>

      {/* Reporting Tracker Grid (Officers as Rows, Weeks as Columns) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1F6B3A]" />
            <h4 className="font-bold text-slate-900 text-sm">SSO Reporting Tracker Matrix</h4>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
              On time
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
              Late
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
              Missing
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              Pending
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10 min-w-[180px]">State Sales Officer</th>
                <th className="px-3 py-3 min-w-[100px]">State</th>
                {allWeeks.map((week) => (
                  <th key={week} className="px-3 py-3 text-center min-w-[130px] border-l border-slate-200">
                    Week of {formatDateString(week)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeOfficers.map((officer) => (
                <tr key={officer.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-xs">
                    {officer.name}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-600">
                    {officer.state}
                  </td>
                  {allWeeks.map((week) => {
                    const status = getCellStatus(officer.code, officer.name, week);
                    return (
                      <td key={week} className="px-3 py-3 text-center border-l border-slate-100">
                        <div
                          className={`inline-block w-full py-1.5 px-2 rounded-lg border text-center font-bold text-[11px] shadow-2xs ${status.bg}`}
                          title={`${officer.name} (${officer.state}) - ${status.subtext}`}
                        >
                          <div>{status.label}</div>
                          <div className="text-[9px] font-normal opacity-85 truncate mt-0.5">
                            {status.subtext}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Comparison Charts: By Week (Stacked Bar) and By Officer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* On time vs Late by Week */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">On-Time vs Late Reports by Week</h4>
          <p className="text-xs text-slate-500 mb-4">Volume breakdown of reports received per reporting cycle</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDiscipline} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="On time" stackId="a" fill="#1F6B3A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Late" stackId="a" fill="#E8A317" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* On-Time Rate by Officer */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">On-Time Compliance by Officer (%)</h4>
          <p className="text-xs text-slate-500 mb-4">Percentage of submissions received on or before Thursday</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerDiscipline} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} width={90} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'On-time Rate']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="rate" name="On-Time Rate (%)" fill="#1F6B3A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
