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
import { formatDateTime } from './utils/formatters.ts';
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

// ============================================================================
// APPS SCRIPT WEB APP DATA SOURCE (DIRECT BROWSER FETCH)
// ============================================================================
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzypVMhN2uEtnXqR-Gjs0WrvYht6Xwr4y3RDaTUkDOO7n_UMwZsz44Q9WiZ14kCGQZG/exec';

// ============================================================================
// ACCESS KEY (AUTOMATICALLY SENT WITH EVERY DATA REQUEST)
// ============================================================================
export const ACCESS_KEY = 'EXAF001';

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
  const [lastSuccessfulLoadTime, setLastSuccessfulLoadTime] = useState<string>('');
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

  // Direct fetch from browser to Apps Script Web App sending ACCESS_KEY automatically
  const fetchDirectFromAppsScript = useCallback(
    async (isManualRefresh = false) => {
      const cleanUrl = APPS_SCRIPT_URL.trim();
      const cleanKey = ACCESS_KEY.trim();

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const targetUrl = `${cleanUrl}?key=${encodeURIComponent(cleanKey)}${isManualRefresh ? '&refresh=1' : ''}`;
        const res = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
        });

        const rawText = await res.text();
        let data: ApiResponse;

        try {
          data = JSON.parse(rawText);
        } catch {
          // If response is not valid JSON, show clear message with HTTP status, first 80 chars, and required hint
          const snippet = rawText.slice(0, 80).replace(/\s+/g, ' ');
          const detailedError = `HTTP ${res.status}: "${snippet}...". The data link returned a web page instead of data. Check that the Apps Script web app is deployed as 'Anyone' and that the URL ends in /exec.`;
          setRefreshError(detailedError);
          setIsLiveConnected(false);

          if (cleanedRows.length === 0) {
            setIsSampleMode(true);
            processData(SAMPLE_KOBO_ROWS, SAMPLE_TARGETS);
          }
          return;
        }

        if (!data.ok) {
          let errText = data.error || 'Failed to fetch data';
          // If the data request returns "Wrong passcode", show required clear message
          if (errText.toLowerCase().includes('wrong passcode')) {
            errText = 'The dashboard access key is out of date. Contact the administrator.';
          }
          setRefreshError(errText);
          setIsLiveConnected(false);

          if (cleanedRows.length === 0) {
            setIsSampleMode(true);
            processData(SAMPLE_KOBO_ROWS, SAMPLE_TARGETS);
          }
          return;
        }

        // Successfully received JSON data!
        setIsSampleMode(false);
        setIsLiveConnected(true);
        setRefreshError(null);

        const now = new Date().toISOString();
        setDataUpdatedTime(data.updated || now);
        setLastSuccessfulLoadTime(now);
        if (data.targetsUpdated) {
          setTargetsUpdatedTime(data.targetsUpdated);
        }

        processData(data.rows || [], data.targets, data.targetsError);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error connecting to data source';
        setRefreshError(msg);
        setIsLiveConnected(false);

        if (cleanedRows.length === 0) {
          setIsSampleMode(true);
          processData(SAMPLE_KOBO_ROWS, SAMPLE_TARGETS);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [cleanedRows.length, processData]
  );

  // On mount, immediately fetch straight to data with no login
  useEffect(() => {
    fetchDirectFromAppsScript(false);
  }, [fetchDirectFromAppsScript]);

  // Auto-refresh every 5 minutes while page is open
  useEffect(() => {
    if (isSampleMode) return;

    const intervalId = setInterval(() => {
      fetchDirectFromAppsScript(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [isSampleMode, fetchDirectFromAppsScript]);

  // Load sample data fallback
  const handleLoadSample = () => {
    setIsSampleMode(true);
    setRefreshError(null);
    setIsLiveConnected(false);
    const now = new Date().toISOString();
    setDataUpdatedTime(now);
    setTargetsUpdatedTime(now);
    setLastSuccessfulLoadTime(now);
    setTargets(SAMPLE_TARGETS);
    setIsUsingDefaultTargets(true);
    processData(SAMPLE_KOBO_ROWS, SAMPLE_TARGETS);
  };

  // Exit sample mode and return to live fetch
  const handleExitSample = () => {
    setIsSampleMode(false);
    fetchDirectFromAppsScript(false);
  };

  // Upload handlers
  const handleKoboDataLoaded = (uploadedRows: RawKoboRow[]) => {
    setIsSampleMode(false);
    const now = new Date().toISOString();
    setDataUpdatedTime(now);
    setLastSuccessfulLoadTime(now);
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

  // Parsed host for Connection details
  const appsScriptHost = useMemo(() => {
    try {
      return new URL(APPS_SCRIPT_URL.trim()).host;
    } catch {
      return 'script.google.com';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-slate-800 flex flex-col font-sans">
      {/* 1. Branded Header (No Passcode Screen, No Lock Button) */}
      <Header
        dataUpdatedTime={dataUpdatedTime}
        targetsUpdatedTime={targetsUpdatedTime}
        isLiveConnected={isLiveConnected}
        isRefreshing={isRefreshing}
        isSampleMode={isSampleMode}
        refreshError={refreshError}
        targetsWarning={targetsWarning}
        onRefreshNow={() => fetchDirectFromAppsScript(true)}
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
            <h3 className="text-base font-bold text-slate-900">Connecting to SSO Performance Tracker...</h3>
            <p className="text-xs text-slate-500 mt-1">Fetching weekly Kobo submissions and targets from Google Apps Script</p>
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
                onClick={() => fetchDirectFromAppsScript(true)}
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

      {/* 4. Footer with Connection Details */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">Extension Africa</span>
            <span>·</span>
            <span>SSO Weekly Performance Tracker</span>
          </div>

          {/* Connection details line */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Connection details:</span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{appsScriptHost}</span>
            <span>·</span>
            <span>
              Last successful load:{' '}
              <strong className="text-slate-700">
                {lastSuccessfulLoadTime ? formatDateTime(lastSuccessfulLoadTime) : 'Not loaded yet'}
              </strong>
            </span>
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
