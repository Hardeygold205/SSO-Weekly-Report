import React from 'react';
import {
  RefreshCw,
  Printer,
  Lock,
  Upload,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters.ts';

interface HeaderProps {
  dataUpdatedTime?: string;
  targetsUpdatedTime?: string;
  isLiveConnected: boolean;
  isRefreshing: boolean;
  isSampleMode: boolean;
  refreshError: string | null;
  targetsWarning: string | null;
  onRefreshNow: () => void;
  onOpenUpload: () => void;
  onExitSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataUpdatedTime,
  targetsUpdatedTime,
  isLiveConnected,
  isRefreshing,
  isSampleMode,
  refreshError,
  targetsWarning,
  onRefreshNow,
  onOpenUpload,
  onExitSample,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1F6B3A] text-white shadow-md print:static print:bg-white print:text-black">
      {/* Sample data banner */}
      {isSampleMode && (
        <div className="bg-amber-500 text-slate-900 font-bold px-4 py-1.5 text-center text-xs tracking-wider uppercase flex items-center justify-center gap-2 print:hidden">
          <Info className="w-4 h-4" />
          <span>SAMPLE DATA ACTIVE — DISPLAYING DEMONSTRATION METRICS & TARGETS</span>
          <button
            onClick={onExitSample}
            className="ml-3 px-2 py-0.5 bg-black/20 hover:bg-black/30 text-slate-900 rounded text-[11px] font-semibold transition-colors"
          >
            Switch to Live Data
          </button>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 font-black text-lg tracking-tighter shrink-0 border border-white/20">
              EA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-emerald-200 font-semibold">Extension Africa</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SSO Weekly Performance Tracker
              </h1>
            </div>
          </div>

          {/* Status & Action Zone */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs print:hidden">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 text-white/90">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSampleMode
                    ? 'bg-amber-400'
                    : isLiveConnected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'
                }`}
                title={
                  isSampleMode
                    ? 'Sample Data Mode'
                    : isLiveConnected
                    ? 'Live Sync Operational'
                    : 'Sync Disconnected'
                }
              />
              <div className="leading-tight">
                <div className="font-semibold flex items-center gap-1">
                  {isSampleMode ? 'Sample Mode' : isLiveConnected ? 'Live Synced' : 'Sync Error'}
                </div>
                <div className="text-[10px] text-emerald-200/90 font-mono">
                  {dataUpdatedTime ? `Data: ${formatDateTime(dataUpdatedTime)}` : 'Waiting for sync'}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefreshNow}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg font-medium text-white transition-colors flex items-center gap-1.5 border border-white/10"
              title="Fetch latest submissions now (&refresh=1)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-white transition-colors flex items-center gap-1.5 border border-white/10"
              title="Upload Kobo export or targets spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Amber Accent Line */}
      <div className="h-1 bg-[#E8A317] w-full" />

      {/* Warnings & Notices Bar */}
      {(refreshError || targetsWarning) && (
        <div className="bg-amber-900/90 text-amber-100 px-4 py-2 text-xs border-b border-amber-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {refreshError
                ? `Sync Alert: ${refreshError}. Displaying last known valid data.`
                : targetsWarning}
            </span>
          </div>
          {dataUpdatedTime && (
            <span className="text-amber-300 font-mono text-[11px]">
              Last good sync: {formatDateTime(dataUpdatedTime)}
            </span>
          )}
        </div>
      )}
    </header>
  );
};
