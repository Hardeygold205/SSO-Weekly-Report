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
  ComposedChart,
} from 'recharts';
import { CleanedReportRow } from '../../types/index.ts';
import { STATES } from '../../constants/index.ts';
import { formatNumber, formatPercent, formatDateString } from '../../utils/formatters.ts';
import { Users, Store, Building2, TrendingUp } from 'lucide-react';

import { getTargetValue, resolveActiveStates } from '../../utils/cleaner.ts';

interface PipelineTabProps {
  rows: CleanedReportRow[];
  selectedState?: string;
  selectedOfficer?: string;
}

export const PipelineTab: React.FC<PipelineTabProps> = ({
  rows,
  selectedState = 'all',
  selectedOfficer = 'all',
}) => {
  // Determine active states strictly matching the active filter selection
  const activeStates = useMemo(() => {
    return resolveActiveStates(selectedState, selectedOfficer);
  }, [selectedState, selectedOfficer]);

  // 1. Aggregation by State
  const pipelineByState = activeStates.map((state) => {
    const stateRows = rows.filter((r) => r.state === state);
    const n_agent_id = stateRows.reduce((sum, r) => sum + r.n_agent_id, 0);
    const agent_val = stateRows.reduce((sum, r) => sum + r.agent_val, 0);
    const agentRate = n_agent_id > 0 ? (agent_val / n_agent_id) * 100 : 0;

    const n_vend_id = stateRows.reduce((sum, r) => sum + r.n_vend_id, 0);
    const vend_val = stateRows.reduce((sum, r) => sum + r.vend_val, 0);
    const vendRate = n_vend_id > 0 ? (vend_val / n_vend_id) * 100 : 0;

    const n_coop_id = stateRows.reduce((sum, r) => sum + r.n_coop_id, 0);

    return {
      state,
      n_agent_id,
      agent_val,
      agentRate: Math.round(agentRate * 10) / 10,
      n_vend_id,
      vend_val,
      vendRate: Math.round(vendRate * 10) / 10,
      n_coop_id,
    };
  });

  // Calculate cumulative cooperatives by state
  let runningCoopSum = 0;
  const coopDataWithCumulative = pipelineByState
    .map((item) => {
      runningCoopSum += item.n_coop_id;
      return {
        state: item.state,
        cooperatives: item.n_coop_id,
        cumulative: runningCoopSum,
      };
    });

  // 2. Aggregation by Week
  const allWeeks = Array.from(new Set(rows.map((r) => r.week_start))).filter(Boolean).sort();
  const pipelineByWeek = allWeeks.map((week) => {
    const weekRows = rows.filter((r) => r.week_start === week);
    const n_agent_id = weekRows.reduce((sum, r) => sum + r.n_agent_id, 0);
    const agent_val = weekRows.reduce((sum, r) => sum + r.agent_val, 0);
    const agentRate = n_agent_id > 0 ? (agent_val / n_agent_id) * 100 : 0;

    const n_vend_id = weekRows.reduce((sum, r) => sum + r.n_vend_id, 0);
    const vend_val = weekRows.reduce((sum, r) => sum + r.vend_val, 0);
    const vendRate = n_vend_id > 0 ? (vend_val / n_vend_id) * 100 : 0;

    return {
      week: formatDateString(week),
      rawWeek: week,
      agentRate: Math.round(agentRate * 10) / 10,
      vendRate: Math.round(vendRate * 10) / 10,
      n_agent_id,
      agent_val,
      n_vend_id,
      vend_val,
    };
  });

  // Totals
  const totalAgentsIdentified = pipelineByState.reduce((s, r) => s + r.n_agent_id, 0);
  const totalAgentsValidated = pipelineByState.reduce((s, r) => s + r.agent_val, 0);
  const totalAgentRate = totalAgentsIdentified > 0 ? (totalAgentsValidated / totalAgentsIdentified) * 100 : 0;

  const totalVendorsIdentified = pipelineByState.reduce((s, r) => s + r.n_vend_id, 0);
  const totalVendorsValidated = pipelineByState.reduce((s, r) => s + r.vend_val, 0);
  const totalVendorRate = totalVendorsIdentified > 0 ? (totalVendorsValidated / totalVendorsIdentified) * 100 : 0;

  const totalCoopsIdentified = pipelineByState.reduce((s, r) => s + r.n_coop_id, 0);

  return (
    <div className="space-y-8">
      {/* 3 Summary Pipeline KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Agents Validation Funnel</span>
            <Users className="w-4 h-4 text-[#1F6B3A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1F6B3A] font-mono tabular-nums">
              {formatPercent(totalAgentRate)}
            </span>
            <span className="text-xs font-medium text-slate-500">overall conversion</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2 font-mono">
            <span>Identified: <strong>{formatNumber(totalAgentsIdentified)}</strong></span>
            <span>Validated: <strong>{formatNumber(totalAgentsValidated)}</strong></span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vendors Validation Funnel</span>
            <Store className="w-4 h-4 text-[#E8A317]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums">
              {formatPercent(totalVendorRate)}
            </span>
            <span className="text-xs font-medium text-slate-500">overall conversion</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2 font-mono">
            <span>Identified: <strong>{formatNumber(totalVendorsIdentified)}</strong></span>
            <span>Validated: <strong>{formatNumber(totalVendorsValidated)}</strong></span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cooperatives Identified</span>
            <Building2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(totalCoopsIdentified)}
            </span>
            <span className="text-xs font-medium text-slate-500">across 7 states</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2 font-mono">
            <span>State average: <strong>{formatNumber(Math.round(totalCoopsIdentified / 7))}</strong></span>
            <span>Q4 Target: <strong>1,960</strong></span>
          </div>
        </div>
      </div>

      {/* Chart 1: Identified vs Validated Bar Chart by State */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Agents & Vendors: Identified vs Validated by State</h4>
            <p className="text-xs text-slate-500">Comparison of newly identified prospects against successfully onboarded & validated actors</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineByState} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="state" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="n_agent_id" name="New Agents Identified" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              <Bar dataKey="agent_val" name="Agents Validated" fill="#1F6B3A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="n_vend_id" name="New Vendors Identified" fill="#FDE68A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vend_val" name="Vendors Validated" fill="#E8A317" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Validation Rate Trend by Week & Cooperatives Cumulative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Validation Rates by Week */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">Weekly Validation Rate Trends (%)</h4>
          <p className="text-xs text-slate-500 mb-4">Conversion efficiency over successive reporting cycles</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pipelineByWeek} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="agentRate" name="Agent Validation Rate (%)" stroke="#1F6B3A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="vendRate" name="Vendor Validation Rate (%)" stroke="#E8A317" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cooperatives Identified with Cumulative Line */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-1">Cooperatives Identified by State (with Cumulative)</h4>
          <p className="text-xs text-slate-500 mb-4">Farmer organization mapping and cumulative total</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={coopDataWithCumulative} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="cooperatives" name="Cooperatives (State)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Total" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Pipeline Table by State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h4 className="font-bold text-slate-900 text-sm">State Pipeline Breakdown Table</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <th className="px-4 py-3">State</th>
                <th className="px-3 py-3 text-right">Agents Identified</th>
                <th className="px-3 py-3 text-right">Agents Validated</th>
                <th className="px-3 py-3 text-right">Agent Val. Rate</th>
                <th className="px-3 py-3 text-right border-l border-slate-200">Vendors Identified</th>
                <th className="px-3 py-3 text-right">Vendors Validated</th>
                <th className="px-3 py-3 text-right">Vendor Val. Rate</th>
                <th className="px-3 py-3 text-right border-l border-slate-200">Cooperatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pipelineByState.map((row) => (
                <tr key={row.state} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-800">{row.state}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">{formatNumber(row.n_agent_id)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-emerald-800">{formatNumber(row.agent_val)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-700">{formatPercent(row.agentRate)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600 border-l border-slate-100">{formatNumber(row.n_vend_id)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-amber-800">{formatNumber(row.vend_val)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-700">{formatPercent(row.vendRate)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-800 border-l border-slate-100">{formatNumber(row.n_coop_id)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="px-4 py-3 uppercase">Total / Average</td>
                <td className="px-3 py-3 text-right font-mono">{formatNumber(totalAgentsIdentified)}</td>
                <td className="px-3 py-3 text-right font-mono text-emerald-800">{formatNumber(totalAgentsValidated)}</td>
                <td className="px-3 py-3 text-right font-mono text-emerald-900">{formatPercent(totalAgentRate)}</td>
                <td className="px-3 py-3 text-right font-mono border-l border-slate-200">{formatNumber(totalVendorsIdentified)}</td>
                <td className="px-3 py-3 text-right font-mono text-amber-800">{formatNumber(totalVendorsValidated)}</td>
                <td className="px-3 py-3 text-right font-mono text-amber-900">{formatPercent(totalVendorRate)}</td>
                <td className="px-3 py-3 text-right font-mono border-l border-slate-200">{formatNumber(totalCoopsIdentified)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
