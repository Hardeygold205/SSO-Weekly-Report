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
} from 'recharts';
import { CleanedReportRow, TargetItem } from '../../types/index.ts';
import { STATES, OFFICERS } from '../../constants/index.ts';
import { formatNumber, formatDateString } from '../../utils/formatters.ts';
import { getTargetValue } from '../../utils/cleaner.ts';
import { CheckCircle2, XCircle, AlertTriangle, GraduationCap, MapPin, Building } from 'lucide-react';

interface HubsTrainingTabProps {
  rows: CleanedReportRow[];
  targets: TargetItem[];
}

export const HubsTrainingTab: React.FC<HubsTrainingTabProps> = ({ rows, targets }) => {
  // 1. Data by State for Hubs
  const stateHubData = STATES.map((state) => {
    const officer = OFFICERS.find((o) => o.state === state);
    const stateRows = rows.filter((r) => r.state === state);
    const sorted = [...stateRows].sort((a, b) => a.week_start.localeCompare(b.week_start));
    const latestRow = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    const isFchOperational = latestRow ? latestRow.fch_operational : false;
    const facEstablished = stateRows.reduce((sum, r) => sum + r.fac_established, 0);
    const facTarget = getTargetValue(targets, state, 'FACs');

    const totalTrainings = stateRows.reduce((sum, r) => sum + r.train_sess, 0);
    const totalCoopTrainings = stateRows.reduce((sum, r) => sum + r.coop_train, 0);
    const hasZeroTraining = totalTrainings === 0 && totalCoopTrainings === 0;

    return {
      state,
      officerName: officer?.name || 'Assigned SSO',
      isFchOperational,
      facEstablished,
      facTarget,
      totalTrainings,
      totalCoopTrainings,
      hasZeroTraining,
      submissionCount: stateRows.length,
    };
  });

  // 2. Training by Week
  const allWeeks = Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean).sort();
  const weeklyTrainingData = allWeeks.map((week) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const trainSessions = weekRows.reduce((sum, r) => sum + r.train_sess, 0);
    const coopTrainings = weekRows.reduce((sum, r) => sum + r.coop_train, 0);
    const zeroTrainingStates = STATES.filter((state) => {
      const rep = weekRows.find((r) => r.state === state);
      return !rep || (rep.train_sess === 0 && rep.coop_train === 0);
    });

    return {
      week: formatDateString(week),
      rawWeek: week,
      trainSessions,
      coopTrainings,
      total: trainSessions + coopTrainings,
      zeroTrainingStates,
    };
  });

  // Identify all specific reports with zero training
  const zeroTrainingReports = rows.filter((r) => r.train_sess === 0 && r.coop_train === 0);

  return (
    <div className="space-y-8">
      {/* Section 1: 7 State Hub Tiles */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">1. State Operational Hubs & Infrastructure (7 States)</h3>
          <p className="text-xs text-slate-500">
            Latest operational status of Farmer Community Hubs (FCH) and Farm Access Centers (FAC)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stateHubData.map((hub) => (
            <div
              key={hub.state}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-slate-900 text-base">{hub.state}</h4>
                  <span className="text-[11px] text-slate-500 font-medium">{hub.officerName}</span>
                </div>

                {/* FCH Status */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Operational FCH</span>
                  </div>
                  {hub.isFchOperational ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      YES
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      <XCircle className="w-3.5 h-3.5" />
                      NO
                    </span>
                  )}
                </div>

                {/* FAC Sites Established */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#E8A317]" />
                      <span className="text-xs font-semibold text-slate-700">FAC Sites Established</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {hub.facEstablished} {hub.facTarget ? `/ ${hub.facTarget}` : ''}
                    </span>
                  </div>
                  {hub.facTarget && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-[#1F6B3A] h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((hub.facEstablished / hub.facTarget) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Zero Training Flag for the State */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                {hub.hasZeroTraining ? (
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Zero Training Logged</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-600 font-mono">
                    <span>Trainings: <strong>{hub.totalTrainings}</strong></span>
                    <span>Coop: <strong>{hub.totalCoopTrainings}</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Training Sessions & Cooperative Training Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Training Delivery by State</h4>
            <p className="text-xs text-slate-500">
              General field training sessions held vs specialized cooperative leadership trainings
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateHubData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="state" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="totalTrainings" name="Training Sessions Held" fill="#1F6B3A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCoopTrainings" name="Cooperative Trainings Held" fill="#E8A317" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 3: Zero-Training Attention Alert & Weekly Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1F6B3A]" />
            <h4 className="font-bold text-slate-900 text-sm">Weekly Training Tracking & Zero-Training Exception Flags</h4>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {zeroTrainingReports.length} reports flagged with zero training
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyTrainingData.map((w) => (
              <div
                key={w.rawWeek}
                className={`p-4 rounded-xl border ${
                  w.zeroTrainingStates.length > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-800">{w.week}</span>
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {w.total} total
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3 font-mono">
                  <div className="flex justify-between">
                    <span>Field sessions:</span>
                    <span className="font-semibold">{w.trainSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coop training:</span>
                    <span className="font-semibold">{w.coopTrainings}</span>
                  </div>
                </div>

                {w.zeroTrainingStates.length > 0 ? (
                  <div className="pt-2 border-t border-amber-200 text-xs text-rose-700">
                    <span className="font-bold flex items-center gap-1 text-[11px] uppercase">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Zero training in:
                    </span>
                    <p className="mt-1 font-medium text-slate-700 text-xs">
                      {w.zeroTrainingStates.join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Training held across all reporting states</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
