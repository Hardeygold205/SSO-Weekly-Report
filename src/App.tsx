import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Target,
  GitFork,
  Building,
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  RawKoboRow,
  CleanedReportRow,
  TargetItem,
  GlobalFilterState,
  ApiResponse,
  DataQualityReport,
} from './types/index.ts';
import { DEFAULT_TARGETS } from './constants/index.ts';
import { cleanKoboRows, auditTargets } from './utils/cleaner.ts';
import { SAMPLE_KOBO_ROWS, SAMPLE_TARGETS } from './services/sampleData.ts';

// Components
import { Header } from './components/Header.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { UploadModal } from './components/UploadModal.tsx';

// Tabs
import { OverviewTab } from './components/tabs/OverviewTab.tsx';
import { ProgressTab } from './components/tabs/ProgressTab.tsx';
import { PipelineTab } from './components/tabs/PipelineTab.tsx';
import { HubsTrainingTab } from './components/tabs/HubsTrainingTab.tsx';
import { RevenueTab } from './components/tabs/RevenueTab.tsx';
import { DisciplineTab } from './components/tabs/DisciplineTab.tsx';
import { ProjectsChallengesTab } from './components/tabs/ProjectsChallengesTab.tsx';
import { DataQualityTab } from './components/tabs/DataQualityTab.tsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'progress', label: 'Progress vs Targets', icon: Target },
  { id: 'pipeline', label: 'Activity Pipeline', icon: GitFork },
  { id: 'hubs', label: 'Hubs & Training', icon: Building },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'discipline', label: 'Reporting Discipline', icon: Clock },
  { id: 'projects', label: 'Projects & Challenges', icon: Layers },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
] as const;

type TabId = typeof TABS[number]['id'];

export default function App() {
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Raw & Cleaned Data
  const [rawRows, setRawRows] = useState<RawKoboRow[]>([]);
  const [cleanedRows, setCleanedRows] = useState<CleanedReportRow[]>([]);
  const [targets, setTargets] = useState<TargetItem[]>(DEFAULT_TARGETS);
  const [isUsingDefaultTargets, setIsUsingDefaultTargets] = useState<boolean>(true);

  // Status & Metadata
  const [dataUpdatedTime, setDataUpdatedTime] = useState<string>('');
  const [targetsUpdatedTime, setTargetsUpdatedTime] = useState<string>('');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [targetsWarning, setTargetsWarning] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Global Filters
  const [filters, setFilters] = useState<GlobalFilterState>({
    month: 'all',
    week: 'all',
    state: 'all',
    officer: 'all',
    showTargets: true,
  });

  // Reusable data processing function
  const processData = useCallback(
    (newRawRows: RawKoboRow[], newTargets?: TargetItem[], targetsErrorMsg?: string) => {
      setRawRows(newRawRows);
      const { cleanedRows: cleaned, qualityReport: qr } = cleanKoboRows(newRawRows);
      setCleanedRows(cleaned);

      let activeTargets = targets;
      let usingDefaults = isUsingDefaultTargets;

      if (newTargets && newTargets.length > 0) {
        activeTargets = newTargets;
        usingDefaults = false;
        setTargets(newTargets);
        setIsUsingDefaultTargets(false);
      } else if (targetsErrorMsg) {
        setTargetsWarning(`Targets sync issue: ${targetsErrorMsg}. Using default targets.`);
      }

      const targetAudit = auditTargets(activeTargets);
      qr.targetChecks = {
        ...targetAudit,
        usingDefaultTargets: usingDefaults,
        targetsCount: activeTargets.length,
      };

      setQualityReport(qr);
    },
    [targets, isUsingDefaultTargets]
  );

  // Fetch data from /api/data endpoint directly without requiring user passcode entry
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setRefreshError(null);

      try {
        const refreshParam = isManualRefresh ? '?refresh=1' : '';
        const res = await fetch(`/api/data${refreshParam}`);
        const data: ApiResponse = await res.json();

        if (!data.ok) {
          const errText = data.error || 'Failed to fetch live data.';
          setRefreshError(errText);
          setIsLiveConnected(false);
          return;
        }

        // Successfully received live data
        setIsSampleMode(false);
        setIsLiveConnected(true);
        setRefreshError(null);

        const now = new Date().toISOString();
        setDataUpdatedTime(data.updated || now);
        if (data.targetsUpdated) {
          setTargetsUpdatedTime(data.targetsUpdated);
        }

        processData(data.rows || [], data.targets, data.targetsError);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch data';
        setRefreshError(msg);
        setIsLiveConnected(false);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [processData]
  );

  // Fetch live data immediately on mount
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-refresh every 5 minutes while page is open
  useEffect(() => {
    if (isSampleMode) return;

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [isSampleMode, fetchData]);

  // Load sample data
  const handleLoadSample = () => {
    setIsSampleMode(true);
    setRefreshError(null);
    setIsLiveConnected(false);
    setDataUpdatedTime(new Date().toISOString());
    setTargetsUpdatedTime(new Date().toISOString());
    setTargets(SAMPLE_TARGETS);
    setIsUsingDefaultTargets(true);
    processData(SAMPLE_KOBO_ROWS, SAMPLE_TARGETS);
  };

  // Exit sample mode and return to live data
  const handleExitSample = () => {
    setIsSampleMode(false);
    fetchData(false);
  };

  // Upload handlers
  const handleKoboDataLoaded = (uploadedRows: RawKoboRow[]) => {
    setIsSampleMode(false);
    setDataUpdatedTime(new Date().toISOString());
    processData(uploadedRows);
  };

  const handleTargetsLoaded = (uploadedTargets: TargetItem[]) => {
    setTargets(uploadedTargets);
    setIsUsingDefaultTargets(false);
    setTargetsUpdatedTime(new Date().toISOString());
    setTargetsWarning(null);
    processData(rawRows, uploadedTargets);
  };

  // Available Filter Options (Distinct months and weeks)
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(cleanedRows.map((r) => r.month))).filter(Boolean);
    return months.sort();
  }, [cleanedRows]);

  const availableWeeks = useMemo(() => {
    const weeks = Array.from(new Set(cleanedRows.map((r) => r.week_start))).filter(Boolean);
    return weeks.sort();
  }, [cleanedRows]);

  // Filter application
  const filteredRows = useMemo(() => {
    return cleanedRows.filter((r) => {
      if (filters.month !== 'all' && r.month !== filters.month) return false;
      if (filters.week !== 'all' && r.week_start !== filters.week) return false;
      if (filters.state !== 'all' && r.state.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters.officer !== 'all' && r.sso_name.toLowerCase() !== filters.officer.toLowerCase()) return false;
      return true;
    });
  }, [cleanedRows, filters]);

  const handleFilterChange = (newFilters: Partial<GlobalFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      month: 'all',
      week: 'all',
      state: 'all',
      officer: 'all',
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-slate-800 flex flex-col font-sans">
      {/* 1. Branded Header (Passcode, Print, and Lock removed) */}
      <Header
        dataUpdatedTime={dataUpdatedTime}
        targetsUpdatedTime={targetsUpdatedTime}
        isLiveConnected={isLiveConnected}
        isRefreshing={isRefreshing}
        isSampleMode={isSampleMode}
        refreshError={refreshError}
        targetsWarning={targetsWarning}
        onRefreshNow={() => fetchData(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onExitSample={handleExitSample}
      />

      {/* 2. Global Sticky Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        availableMonths={availableMonths}
        availableWeeks={availableWeeks}
        filteredCount={filteredRows.length}
        totalCount={cleanedRows.length}
      />

      {/* 3. Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none mb-6 print:hidden">
          <div className="flex space-x-1 sm:space-x-2 min-w-max pb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-[#1F6B3A] text-[#1F6B3A] bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1F6B3A]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state on initial load */}
        {isLoading && cleanedRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 border-3 border-[#1F6B3A]/20 border-t-[#1F6B3A] rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">Loading SSO Weekly Performance Data...</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to live KoboToolbox submissions and Google Sheet targets</p>
          </div>
        ) : cleanedRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#1F6B3A] mx-auto flex items-center justify-center mb-4">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Weekly Submissions Recorded</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              There is currently no submission data available from the connected endpoint. You can refresh live data,
              load demonstration sample data, or upload a Kobo export spreadsheet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => fetchData(true)}
                className="px-4 py-2 bg-[#1F6B3A] text-white text-xs font-semibold rounded-lg hover:bg-[#18532D] transition-colors"
              >
                Refresh Now
              </button>
              <button
                onClick={handleLoadSample}
                className="px-4 py-2 bg-amber-500 text-slate-900 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Load Demonstration Data
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Upload File (.xlsx / .csv)
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Active Tab View */}
            {activeTab === 'overview' && (
              <OverviewTab
                rows={filteredRows}
                targets={targets}
                selectedWeek={filters.week}
                selectedMonth={filters.month}
                selectedState={filters.state}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTab
                rows={filteredRows}
                targets={targets}
                showTargets={filters.showTargets}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineTab rows={filteredRows} />
            )}

            {activeTab === 'hubs' && (
              <HubsTrainingTab
                rows={filteredRows}
                targets={targets}
              />
            )}

            {activeTab === 'revenue' && (
              <RevenueTab
                rows={filteredRows}
                targets={targets}
              />
            )}

            {activeTab === 'discipline' && (
              <DisciplineTab rows={filteredRows} />
            )}

            {activeTab === 'projects' && (
              <ProjectsChallengesTab rows={filteredRows} />
            )}

            {activeTab === 'quality' && qualityReport && (
              <DataQualityTab
                qualityReport={qualityReport}
                targets={targets}
                isUsingDefaultTargets={isUsingDefaultTargets}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Extension Africa</span>
            <span>·</span>
            <span>SSO Weekly Performance Tracker</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-slate-400">Projector & Management Mode</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Form Cutoff: Thursday / Friday</span>
            <span>·</span>
            <span>Currency: NGN (₦)</span>
          </div>
        </div>
      </footer>

      {/* Upload modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onKoboDataLoaded={handleKoboDataLoaded}
        onTargetsLoaded={handleTargetsLoaded}
      />
    </div>
  );
}
