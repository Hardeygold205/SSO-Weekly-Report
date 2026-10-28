import React from 'react';
import { RotateCcw, Eye, EyeOff, Filter } from 'lucide-react';
import { GlobalFilterState } from '../types/index.ts';
import { OFFICERS, STATES } from '../constants/index.ts';
import { formatDateString } from '../utils/formatters.ts';

interface FilterBarProps {
  filters: GlobalFilterState;
  onFilterChange: (filters: Partial<GlobalFilterState>) => void;
  onReset: () => void;
  availableMonths: string[];
  availableWeeks: string[];
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableMonths,
  availableWeeks,
  filteredCount,
  totalCount,
}) => {
  const isFiltered =
    filters.month !== 'all' ||
    filters.week !== 'all' ||
    filters.state !== 'all' ||
    filters.officer !== 'all';

  return (
    <div className="sticky top-[150px] sm:top-[105px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#1F6B3A]" />
            <span>Filters:</span>
          </div>

          {/* Month selector */}
          <div className="flex items-center">
            <select
              value={filters.month}
              onChange={(e) => onFilterChange({ month: e.target.value })}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#1F6B3A] focus:outline-none">
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Week selector */}
          <div className="flex items-center">
            <select
              value={filters.week}
              onChange={(e) => onFilterChange({ week: e.target.value })}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#1F6B3A] focus:outline-none">
              <option value="all">All Weeks</option>
              {availableWeeks.map((w) => (
                <option key={w} value={w}>
                  Week of {formatDateString(w)}
                </option>
              ))}
            </select>
          </div>

          {/* State selector */}
          <div className="flex items-center">
            <select
              value={filters.state}
              onChange={(e) => {
                const newState = e.target.value;
                if (newState !== "all" && filters.officer !== "all") {
                  const currentOfficer = OFFICERS.find(
                    (o) =>
                      o.name.toLowerCase() === filters.officer.toLowerCase() ||
                      o.code.toLowerCase() === filters.officer.toLowerCase(),
                  );
                  if (
                    currentOfficer &&
                    currentOfficer.state.toLowerCase() !==
                      newState.toLowerCase()
                  ) {
                    onFilterChange({ state: newState, officer: "all" });
                    return;
                  }
                }
                onFilterChange({ state: newState });
              }}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#1F6B3A] focus:outline-none cursor-pointer">
              <option value="all">All States (7)</option>
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Officer selector */}
          <div className="flex items-center">
            <select
              value={filters.officer}
              onChange={(e) => {
                const newOfficer = e.target.value;
                if (newOfficer !== "all") {
                  const off = OFFICERS.find(
                    (o) =>
                      o.name.toLowerCase() === newOfficer.toLowerCase() ||
                      o.code.toLowerCase() === newOfficer.toLowerCase(),
                  );
                  if (
                    off &&
                    filters.state !== "all" &&
                    filters.state.toLowerCase() !== off.state.toLowerCase()
                  ) {
                    onFilterChange({ officer: newOfficer, state: off.state });
                    return;
                  }
                }
                onFilterChange({ officer: newOfficer });
              }}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium text-xs focus:ring-1 focus:ring-[#1F6B3A] focus:outline-none cursor-pointer">
              <option value="all">All Officers (7 SSOs)</option>
              {OFFICERS.map((o) => (
                <option key={o.code} value={o.name}>
                  {o.name} ({o.state})
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="px-2 py-1.5 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1 font-medium"
              title="Reset all filters">
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right side: Targets toggle & row count */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 font-mono">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredCount}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
            reports
          </div>

          {/* Eye toggle for Targets */}
          <button
            onClick={() =>
              onFilterChange({ showTargets: !filters.showTargets })
            }
            className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors border ${
              filters.showTargets
                ? "bg-emerald-50 text-[#1F6B3A] border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
            title={
              filters.showTargets
                ? "Targets currently shown (Management view). Click to hide target columns for SSO presentation."
                : "Targets currently hidden (SSO presentation view). Click to show target columns."
            }>
            {filters.showTargets ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#1F6B3A]" />
                <span>Targets Shown</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Targets Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
