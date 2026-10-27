import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, Database, Upload, AlertCircle, Sparkles } from 'lucide-react';

interface PasscodeScreenProps {
  onUnlock: (passcode: string) => Promise<void>;
  onLoadSample: () => void;
  onOpenUpload: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const PasscodeScreen: React.FC<PasscodeScreenProps> = ({
  onUnlock,
  onLoadSample,
  onOpenUpload,
  isLoading,
  errorMessage,
}) => {
  const [passcode, setPasscode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim()) {
      onUnlock(passcode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top brand banner */}
        <div className="bg-[#1F6B3A] p-6 text-white text-center relative border-b-4 border-[#E8A317]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3 text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Extension Africa</h1>
          <p className="text-emerald-100 text-sm mt-1">SSO Weekly Performance Tracker</p>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Enter Access Passcode</h2>
            <p className="text-sm text-slate-500 mt-1">
              Please enter the security key to fetch live weekly submissions and performance targets.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs uppercase tracking-wider text-rose-900">Connection Alert</p>
                <p className="text-xs text-rose-700 mt-1 break-words leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter authorized key..."
                  disabled={isLoading}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6B3A] focus:bg-white transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passcode.trim()}
              className="w-full py-2.5 px-4 bg-[#1F6B3A] hover:bg-[#18532D] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting to Live Data...</span>
                </>
              ) : (
                <>
                  <span>Unlock Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or explore options</span>
            </div>
          </div>

          {/* Fallback actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onLoadSample}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Load Q4 Sample Data</span>
            </button>

            <button
              type="button"
              onClick={onOpenUpload}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Upload Kobo Export (.xlsx / .csv)</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Direct Google Apps Script Web App Connection</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
