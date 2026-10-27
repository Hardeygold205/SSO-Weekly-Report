import React from 'react';
import { DataQualityReport, TargetItem } from '../../types/index.ts';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  CopyCheck,
  FileQuestion,
  Database,
  Hash,
} from 'lucide-react';

interface DataQualityTabProps {
  qualityReport: DataQualityReport;
  targets: TargetItem[];
  isUsingDefaultTargets: boolean;
}

export const DataQualityTab: React.FC<DataQualityTabProps> = ({
  qualityReport,
  targets,
  isUsingDefaultTargets,
}) => {
  const {
    totalRawRows,
    validRows,
    duplicatesIgnoredCount,
    duplicateKeys,
    missingOfficerOrStateCount,
    missingRowsDetails,
    nonNumericOrNegativeCount,
    anomaliesDetails,
    statusDisagreementCount,
    statusDisagreements,
    targetChecks,
  } = qualityReport;

  return (
    <div className="space-y-8">
      {/* Overview Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1F6B3A] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Data Pipeline Quality & Audit Console</h3>
            <p className="text-xs text-slate-500">
              Automated data validation rules, integrity sanitization, and target registry reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            Raw submissions: <strong className="text-slate-900">{totalRawRows}</strong>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
            Sanitized valid rows: <strong className="text-emerald-950">{validRows}</strong>
          </div>
        </div>
      </div>

      {/* 4 Quality Metric Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Duplicates Ignored */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicates Ignored</span>
            <CopyCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {duplicatesIgnoredCount}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {duplicatesIgnoredCount === 0
              ? 'Zero duplicate report keys found'
              : `${duplicatesIgnoredCount} duplicate submission(s) ignored, latest retained`}
          </p>
        </div>

        {/* Card 2: Missing Officer or State */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Officer/State</span>
            <FileQuestion className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-3xl font-extrabold font-mono tabular-nums ${missingOfficerOrStateCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {missingOfficerOrStateCount}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {missingOfficerOrStateCount === 0
              ? 'All rows successfully linked to SSO & State'
              : `${missingOfficerOrStateCount} row(s) missing vital identifying fields`}
          </p>
        </div>

        {/* Card 3: Non-numeric / Negative Coerced */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Anomalous Numbers Coerced</span>
            <Hash className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {nonNumericOrNegativeCount}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Safely normalized (empty/text = 0, negative flagged)
          </p>
        </div>

        {/* Card 4: Status Disagreements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Status Disagreements</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums">
            {statusDisagreementCount}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Recomputed via Thursday deadline formula
          </p>
        </div>
      </div>

      {/* Targets Reconciliation Check (Section 3 Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#1F6B3A]" />
            <h4 className="font-bold text-slate-900 text-sm">Target Sheet Integrity Check</h4>
          </div>
          {isUsingDefaultTargets ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Using Default Targets
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Custom Targets Sheet Loaded ({targets.length} targets)
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Missing target states */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1">States / Metrics Missing Targets</span>
              {targetChecks.missingTargetStates.length === 0 ? (
                <div className="text-emerald-700 flex items-center gap-1.5 mt-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All 7 states have active quotas</span>
                </div>
              ) : (
                <ul className="list-disc pl-4 mt-2 space-y-1 text-rose-700 font-mono">
                  {targetChecks.missingTargetStates.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Missing Revenue Target Months */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1">Monthly Revenue Targets Check</span>
              {targetChecks.missingTargetMetrics.length === 0 ? (
                <div className="text-emerald-700 flex items-center gap-1.5 mt-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete (Oct, Nov, Dec set for all states)</span>
                </div>
              ) : (
                <ul className="list-disc pl-4 mt-2 space-y-1 text-amber-700 font-mono">
                  {targetChecks.missingTargetMetrics.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Unrecognized Metrics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1">Unrecognized Target Metrics</span>
              {targetChecks.unrecognizedMetrics.length === 0 ? (
                <div className="text-emerald-700 flex items-center gap-1.5 mt-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All metrics match recognized indicators</span>
                </div>
              ) : (
                <ul className="list-disc pl-4 mt-2 space-y-1 text-rose-700 font-mono">
                  {targetChecks.unrecognizedMetrics.map((u, i) => (
                    <li key={i}>"{u}"</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Disagreements Table */}
      {statusDisagreements.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Computed Status Disagreements</h4>
            <span className="text-xs text-slate-500">
              Overridden: Computed deadline (Thursday) takes strict precedence
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <th className="px-4 py-3">Report ID</th>
                  <th className="px-3 py-3">Officer</th>
                  <th className="px-3 py-3">Week Start</th>
                  <th className="px-3 py-3">Date Submitted</th>
                  <th className="px-3 py-3 text-rose-700">Raw Kobo Status</th>
                  <th className="px-3 py-3 text-emerald-700 font-bold">Computed Validated Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statusDisagreements.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{d.id}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{d.sso}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{d.week_start}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{d.submitted_on}</td>
                    <td className="px-3 py-2.5 font-semibold text-rose-700 bg-rose-50/50">{d.rawStatus}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-800 bg-emerald-50/50">{d.computedStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duplicates Detail Table if any */}
      {duplicateKeys.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm">Deduplicated Keys Handled</h4>
            <p className="text-xs text-slate-500">Multiple reports with same report_key were deduplicated, keeping latest</p>
          </div>
          <div className="p-4 space-y-1">
            {duplicateKeys.map((key, i) => (
              <div key={i} className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
                <span>Key: {key}</span>
                <span className="text-[11px] text-emerald-700 font-semibold">Latest version retained</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
