import * as XLSX from 'xlsx';
import { RawKoboRow, TargetItem } from '../types/index.ts';

/**
 * Parses an uploaded file (ArrayBuffer) into Kobo raw rows
 */
export function parseKoboFile(buffer: ArrayBuffer): RawKoboRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded spreadsheet contains no sheets');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false, // get formatted text strings for dates and numbers
  });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('The uploaded file does not contain any data rows');
  }

  return jsonData as RawKoboRow[];
}

/**
 * Parses an uploaded file (ArrayBuffer) into TargetItem[]
 * Expected headers: state, metric, period, target
 */
export function parseTargetsFile(buffer: ArrayBuffer): TargetItem[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded targets spreadsheet contains no sheets');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  const parsedTargets: TargetItem[] = [];

  jsonData.forEach((row) => {
    // Case-insensitive header matching
    let state = '';
    let metric = '';
    let period = '';
    let target = 0;

    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase();
      const valStr = String(val).trim();

      if (cleanKey === 'state' || cleanKey.includes('location')) {
        state = valStr;
      } else if (cleanKey === 'metric' || cleanKey.includes('kpi') || cleanKey.includes('indicator')) {
        metric = valStr;
      } else if (cleanKey === 'period' || cleanKey.includes('month') || cleanKey.includes('quarter') || cleanKey.includes('timeline')) {
        period = valStr;
      } else if (cleanKey === 'target' || cleanKey.includes('goal') || cleanKey.includes('quota')) {
        const numVal = Number(valStr.replace(/,/g, ''));
        target = isNaN(numVal) ? 0 : numVal;
      }
    }

    if (state && metric) {
      parsedTargets.push({
        state,
        metric,
        period: period || '3-month',
        target,
      });
    }
  });

  if (parsedTargets.length === 0) {
    throw new Error('No valid target rows found. Please ensure headers include: state, metric, period, target');
  }

  return parsedTargets;
}
