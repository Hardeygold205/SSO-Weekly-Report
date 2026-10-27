import React, { useMemo } from 'react';
import { CleanedReportRow, TargetItem } from '../../types/index.ts';
import { STATES } from '../../constants/index.ts';
import { formatNaira, formatNumber, formatPercent, getPercentStatusClass } from '../../utils/formatters.ts';
import { getTargetValue } from '../../utils/cleaner.ts';

interface ProgressTabProps {
  rows: CleanedReportRow[];
  targets: TargetItem[];
  showTargets: boolean;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  rows,
  targets,
  showTargets,
}) => {
  // Determine active states matching the active filter selection
  const activeStates = useMemo(() => {
    const statesInRows = Array.from(new Set(rows.map((r) => r.state))).filter(Boolean);
    if (statesInRows.length > 0 && statesInRows.length < STATES.length) {
      return STATES.filter((s) => statesInRows.includes(s));
    }
    return STATES;
  }, [rows]);

  // Helper for KPI metric progress by state
  const getStateMetrics = (state: string) => {
    const stateRows = rows.filter((r) => r.state === state);
    const sortedStateRows = [...stateRows].sort((a, b) => a.week_start.localeCompare(b.week_start));
    const latestRow = sortedStateRows.length > 0 ? sortedStateRows[sortedStateRows.length - 1] : null;

    const agentsActual = stateRows.reduce((sum, r) => sum + r.agent_val, 0);
    const vendorsActual = stateRows.reduce((sum, r) => sum + r.vend_val, 0);
    // FCHs: latest reported fch_operational per state (not a sum)
    const fchsActual = latestRow ? (latestRow.fch_operational ? 1 : 0) : 0;
    const facsActual = stateRows.reduce((sum, r) => sum + r.fac_established, 0);
    const coopsActual = stateRows.reduce((sum, r) => sum + r.n_coop_id, 0);

    const agentsTarget = getTargetValue(targets, state, 'Agents');
    const vendorsTarget = getTargetValue(targets, state, 'Vendors');
    const fchsTarget = getTargetValue(targets, state, 'FCHs');
    const facsTarget = getTargetValue(targets, state, 'FACs');
    const coopsTarget = getTargetValue(targets, state, 'Cooperatives');

    const agentsPct = agentsTarget && agentsTarget > 0 ? (agentsActual / agentsTarget) * 100 : null;
    const vendorsPct = vendorsTarget && vendorsTarget > 0 ? (vendorsActual / vendorsTarget) * 100 : null;
    const fchsPct = fchsTarget && fchsTarget > 0 ? (fchsActual / fchsTarget) * 100 : null;
    const facsPct = facsTarget && facsTarget > 0 ? (facsActual / facsTarget) * 100 : null;
    const coopsPct = coopsTarget && coopsTarget > 0 ? (coopsActual / coopsTarget) * 100 : null;

    return {
      state,
      agents: { target: agentsTarget, actual: agentsActual, pct: agentsPct },
      vendors: { target: vendorsTarget, actual: vendorsActual, pct: vendorsPct },
      fchs: { target: fchsTarget, actual: fchsActual, pct: fchsPct },
      facs: { target: facsTarget, actual: facsActual, pct: facsPct },
      coops: { target: coopsTarget, actual: coopsActual, pct: coopsPct },
    };
  };

  const stateMetricRows = activeStates.map(getStateMetrics);

  // Totals for Table 1
  const totalAgentsTarget = stateMetricRows.reduce((s, r) => s + (r.agents.target || 0), 0);
  const totalAgentsActual = stateMetricRows.reduce((s, r) => s + r.agents.actual, 0);
  const totalAgentsPct = totalAgentsTarget > 0 ? (totalAgentsActual / totalAgentsTarget) * 100 : null;

  const totalVendorsTarget = stateMetricRows.reduce((s, r) => s + (r.vendors.target || 0), 0);
  const totalVendorsActual = stateMetricRows.reduce((s, r) => s + r.vendors.actual, 0);
  const totalVendorsPct = totalVendorsTarget > 0 ? (totalVendorsActual / totalVendorsTarget) * 100 : null;

  const totalFchsTarget = stateMetricRows.reduce((s, r) => s + (r.fchs.target || 0), 0);
  const totalFchsActual = stateMetricRows.reduce((s, r) => s + r.fchs.actual, 0);
  const totalFchsPct = totalFchsTarget > 0 ? (totalFchsActual / totalFchsTarget) * 100 : null;

  const totalFacsTarget = stateMetricRows.reduce((s, r) => s + (r.facs.target || 0), 0);
  const totalFacsActual = stateMetricRows.reduce((s, r) => s + r.facs.actual, 0);
  const totalFacsPct = totalFacsTarget > 0 ? (totalFacsActual / totalFacsTarget) * 100 : null;

  const totalCoopsTarget = stateMetricRows.reduce((s, r) => s + (r.coops.target || 0), 0);
  const totalCoopsActual = stateMetricRows.reduce((s, r) => s + r.coops.actual, 0);
  const totalCoopsPct = totalCoopsTarget > 0 ? (totalCoopsActual / totalCoopsTarget) * 100 : null;

  // Revenue Table calculations (Oct, Nov, Dec, Q4 total)
  const getRevenueForStateMonth = (state: string, monthName: string) => {
    const revActual = rows
      .filter(
        (r) =>
          r.state === state &&
          (r.month?.toLowerCase().includes(monthName.toLowerCase()) ||
            (monthName === 'October' && r.week_start.startsWith('2026-10')) ||
            (monthName === 'November' && r.week_start.startsWith('2026-11')) ||
            (monthName === 'December' && r.week_start.startsWith('2026-12')))
      )
      .reduce((sum, r) => sum + r.rev, 0);

    const fullMonthStr = `${monthName} 2026`;
    const target = getTargetValue(targets, state, 'Revenue', fullMonthStr);
    const pct = target && target > 0 ? (revActual / target) * 100 : null;

    return { target, actual: revActual, pct };
  };

  const stateRevenueRows = activeStates.map((state) => {
    const oct = getRevenueForStateMonth(state, 'October');
    const nov = getRevenueForStateMonth(state, 'November');
    const dec = getRevenueForStateMonth(state, 'December');

    const q4Actual = oct.actual + nov.actual + dec.actual;
    const q4Target =
      (oct.target || 0) + (nov.target || 0) + (dec.target || 0) ||
      getTargetValue(targets, state, 'Revenue', 'Q4');
    const q4Pct = q4Target && q4Target > 0 ? (q4Actual / q4Target) * 100 : null;

    return {
      state,
      oct,
      nov,
      dec,
      q4: { target: q4Target, actual: q4Actual, pct: q4Pct },
    };
  });

  // Revenue Totals
  const totalOctTarget = stateRevenueRows.reduce((s, r) => s + (r.oct.target || 0), 0);
  const totalOctActual = stateRevenueRows.reduce((s, r) => s + r.oct.actual, 0);
  const totalOctPct = totalOctTarget > 0 ? (totalOctActual / totalOctTarget) * 100 : null;

  const totalNovTarget = stateRevenueRows.reduce((s, r) => s + (r.nov.target || 0), 0);
  const totalNovActual = stateRevenueRows.reduce((s, r) => s + r.nov.actual, 0);
  const totalNovPct = totalNovTarget > 0 ? (totalNovActual / totalNovTarget) * 100 : null;

  const totalDecTarget = stateRevenueRows.reduce((s, r) => s + (r.dec.target || 0), 0);
  const totalDecActual = stateRevenueRows.reduce((s, r) => s + r.dec.actual, 0);
  const totalDecPct = totalDecTarget > 0 ? (totalDecActual / totalDecTarget) * 100 : null;

  const totalQ4Target = stateRevenueRows.reduce((s, r) => s + (r.q4.target || 0), 0);
  const totalQ4Actual = stateRevenueRows.reduce((s, r) => s + r.q4.actual, 0);
  const totalQ4Pct = totalQ4Target > 0 ? (totalQ4Actual / totalQ4Target) * 100 : null;

  // Helper for rendering table cells with color code
  const renderMetricCells = (data: { target: number | null; actual: number; pct: number | null }) => {
    const status = getPercentStatusClass(data.pct);

    return (
      <>
        {showTargets && (
          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-500 tabular-nums border-l border-slate-100">
            {data.target !== null ? formatNumber(data.target) : <span className="text-[11px] italic text-slate-400">No target</span>}
          </td>
        )}
        <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold text-slate-800 tabular-nums ${!showTargets ? 'border-l border-slate-100' : ''}`}>
          {formatNumber(data.actual)}
        </td>
        <td className={`px-3 py-2.5 text-right font-mono text-xs tabular-nums ${status.text}`}>
          {data.pct !== null ? (
            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${status.bg}`}>
              {formatPercent(data.pct)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">N/A</span>
          )}
        </td>
      </>
    );
  };

  const renderRevenueCells = (data: { target: number | null; actual: number; pct: number | null }) => {
    const status = getPercentStatusClass(data.pct);

    return (
      <>
        {showTargets && (
          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-500 tabular-nums border-l border-slate-100">
            {data.target !== null ? formatNaira(data.target) : <span className="text-[11px] italic text-slate-400">No target</span>}
          </td>
        )}
        <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold text-slate-800 tabular-nums ${!showTargets ? 'border-l border-slate-100' : ''}`}>
          {formatNaira(data.actual)}
        </td>
        <td className={`px-3 py-2.5 text-right font-mono text-xs tabular-nums ${status.text}`}>
          {data.pct !== null ? (
            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${status.bg}`}>
              {formatPercent(data.pct)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">N/A</span>
          )}
        </td>
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Legend & Presentation Mode Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Key Operational Deliverables vs Targets</h3>
          <p className="text-xs text-slate-500">
            {showTargets
              ? 'Management View: Showing Target Quotas, Actual Achievements, and Attainment %'
              : 'SSO Presentation View: Target columns hidden, showing Actual Deliverables and Attainment %'}
          </p>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">Attainment:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            ≥ 100% On Track
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
            50% - 99% Near Goal
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            &lt; 50% Underperforming
          </span>
        </div>
      </div>

      {/* Table 1: State Operational Targets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm">1. Operational Deliverables by State (Q4 / 3-Month Quotas)</h4>
          <span className="text-xs font-mono text-slate-500">7 State Sales Officers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10">State</th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-emerald-50/50 text-[#1F6B3A]">
                  Agents Validated
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-emerald-50/50 text-[#1F6B3A]">
                  Vendors Validated
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-emerald-50/50 text-[#1F6B3A]">
                  FCHs Operational
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-emerald-50/50 text-[#1F6B3A]" title="Farmers Aggregation Centers Established">
                  FACs Established
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-emerald-50/50 text-[#1F6B3A]">
                  Cooperatives Identified
                </th>
              </tr>
              <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="px-4 py-2 sticky left-0 bg-slate-50 z-10">Location</th>
                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stateMetricRows.map((row) => (
                <tr key={row.state} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-xs text-slate-800 sticky left-0 bg-white z-10 shadow-xs">
                    {row.state}
                  </td>
                  {renderMetricCells(row.agents)}
                  {renderMetricCells(row.vendors)}
                  {renderMetricCells(row.fchs)}
                  {renderMetricCells(row.facs)}
                  {renderMetricCells(row.coops)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <td className="px-4 py-3 sticky left-0 bg-slate-100/90 z-10 uppercase tracking-wider">
                  Total (All States)
                </td>
                {renderMetricCells({ target: totalAgentsTarget, actual: totalAgentsActual, pct: totalAgentsPct })}
                {renderMetricCells({ target: totalVendorsTarget, actual: totalVendorsActual, pct: totalVendorsPct })}
                {renderMetricCells({ target: totalFchsTarget, actual: totalFchsActual, pct: totalFchsPct })}
                {renderMetricCells({ target: totalFacsTarget, actual: totalFacsActual, pct: totalFacsPct })}
                {renderMetricCells({ target: totalCoopsTarget, actual: totalCoopsActual, pct: totalCoopsPct })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Table 2: Revenue vs Monthly Targets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm">2. Revenue Performance by Month & Q4 Total (in Naira)</h4>
          <span className="text-xs font-mono text-slate-500">October - December 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10">State</th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-amber-50/50 text-amber-900">
                  October 2026
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-amber-50/50 text-amber-900">
                  November 2026
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l border-slate-200 bg-amber-50/50 text-amber-900">
                  December 2026
                </th>
                <th colSpan={showTargets ? 3 : 2} className="px-3 py-2 text-center border-l-2 border-emerald-600 bg-emerald-50 text-[#1F6B3A]">
                  Q4 Total Revenue
                </th>
              </tr>
              <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                <th className="px-4 py-2 sticky left-0 bg-slate-50 z-10">Location</th>
                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>

                {showTargets && <th className="px-3 py-2 text-right border-l border-slate-100">Target</th>}
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stateRevenueRows.map((row) => (
                <tr key={row.state} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-xs text-slate-800 sticky left-0 bg-white z-10 shadow-xs">
                    {row.state}
                  </td>
                  {renderRevenueCells(row.oct)}
                  {renderRevenueCells(row.nov)}
                  {renderRevenueCells(row.dec)}
                  {renderRevenueCells(row.q4)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <td className="px-4 py-3 sticky left-0 bg-slate-100/90 z-10 uppercase tracking-wider">
                  Total (All States)
                </td>
                {renderRevenueCells({ target: totalOctTarget, actual: totalOctActual, pct: totalOctPct })}
                {renderRevenueCells({ target: totalNovTarget, actual: totalNovActual, pct: totalNovPct })}
                {renderRevenueCells({ target: totalDecTarget, actual: totalDecActual, pct: totalDecPct })}
                {renderRevenueCells({ target: totalQ4Target, actual: totalQ4Actual, pct: totalQ4Pct })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
