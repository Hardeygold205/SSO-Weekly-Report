import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { RawKoboRow, TargetItem } from '../types/index.ts';
import { parseKoboFile, parseTargetsFile } from '../utils/fileParser.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKoboDataLoaded: (rows: RawKoboRow[]) => void;
  onTargetsLoaded: (targets: TargetItem[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onKoboDataLoaded,
  onTargetsLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'kobo' | 'targets'>('kobo');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleKoboFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseKoboFile(buffer);
      onKoboDataLoaded(rows);
      setStatusMsg({
        type: 'success',
        text: `Successfully parsed ${rows.length} Kobo submission rows from ${file.name}.`,
      });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleTargetsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const targets = parseTargetsFile(buffer);
      onTargetsLoaded(targets);
      setStatusMsg({
        type: 'success',
        text: `Successfully parsed ${targets.length} target records from ${file.name}.`,
      });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse targets file';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#1F6B3A]" />
            <h3 className="font-semibold text-slate-900">Upload Manual Data Fallback</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => {
              setActiveTab('kobo');
              setStatusMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'kobo'
                ? 'border-[#1F6B3A] text-[#1F6B3A] bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Kobo Export (.xlsx / .csv)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('targets');
              setStatusMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'targets'
                ? 'border-[#1F6B3A] text-[#1F6B3A] bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Targets Sheet (.xlsx / .csv)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'kobo' ? (
            <div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Upload raw export files directly from KoboToolbox. Section prefixes (e.g.{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">group_name/question</code>)
                are stripped automatically, and challenge columns are parsed cleanly.
              </p>

              <label className="border-2 border-dashed border-slate-300 hover:border-[#1F6B3A] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all text-center">
                <FileSpreadsheet className="w-10 h-10 text-emerald-700 mb-2" />
                <span className="text-sm font-medium text-slate-800">
                  {isProcessing ? 'Processing file...' : 'Choose Kobo export spreadsheet'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, and .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleKoboFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Upload target quotas for the 7 states. File should include columns:{' '}
                <strong className="text-slate-800">state</strong>,{' '}
                <strong className="text-slate-800">metric</strong> (Agents, Vendors, FCHs, FACs, Cooperatives, Revenue),{' '}
                <strong className="text-slate-800">period</strong> (3-month or specific month), and{' '}
                <strong className="text-slate-800">target</strong>.
              </p>

              <label className="border-2 border-dashed border-slate-300 hover:border-[#1F6B3A] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all text-center">
                <Target className="w-10 h-10 text-[#E8A317] mb-2" />
                <span className="text-sm font-medium text-slate-800">
                  {isProcessing ? 'Processing file...' : 'Choose Targets spreadsheet'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, and .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleTargetsFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
