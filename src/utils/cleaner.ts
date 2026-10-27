import {
  RawKoboRow,
  CleanedReportRow,
  DataQualityReport,
  TargetItem,
} from '../types/index.ts';
import {
  OFFICERS,
  STATES,
  PROJECT_LABELS,
  CHALLENGE_LABELS,
  RECOGNISED_TARGET_METRICS,
  DEFAULT_TARGETS,
} from '../constants/index.ts';

// Helper: strip section prefix (anything before last '/') and clean string
export function stripPrefix(key: string): string {
  if (!key) return '';
  const lastSlash = key.lastIndexOf('/');
  const rawKey = lastSlash >= 0 ? key.substring(lastSlash + 1) : key;
  return rawKey.trim();
}

// Helper: safe numeric conversion
export function safeNumber(val: unknown): { num: number; isNegative: boolean; isInvalid: boolean } {
  if (val === null || val === undefined || val === '') {
    return { num: 0, isNegative: false, isInvalid: false };
  }
  if (typeof val === 'number') {
    if (isNaN(val)) return { num: 0, isNegative: false, isInvalid: true };
    return { num: val, isNegative: val < 0, isInvalid: false };
  }
  const str = String(val).replace(/,/g, '').trim();
  if (str === '') return { num: 0, isNegative: false, isInvalid: false };
  const parsed = Number(str);
  if (isNaN(parsed)) {
    return { num: 0, isNegative: false, isInvalid: true };
  }
  return { num: parsed, isNegative: parsed < 0, isInvalid: false };
}

// Helper: Add days to YYYY-MM-DD
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;

  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

// Helper: Day diff
export function dateDiffDays(laterStr: string, earlierStr: string): number {
  if (!laterStr || !earlierStr) return 0;
  const d1 = new Date(laterStr).getTime();
  const d2 = new Date(earlierStr).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
}

// Find officer from raw value (code or name)
export function resolveOfficer(rawSso: unknown): { code: string; name: string; state: string } {
  if (!rawSso) return { code: '', name: '', state: '' };
  const s = String(rawSso).trim().toLowerCase();

  // Try exact code match
  const byCode = OFFICERS.find((o) => o.code.toLowerCase() === s);
  if (byCode) return byCode;

  // Try exact or partial name match
  const byName = OFFICERS.find(
    (o) => o.name.toLowerCase() === s || s.includes(o.name.toLowerCase()) || o.name.toLowerCase().includes(s)
  );
  if (byName) return byName;

  // Check state match
  const byState = OFFICERS.find((o) => o.state.toLowerCase() === s);
  if (byState) return byState;

  // Fallback: format name from code or string
  const cleanName = s
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { code: s, name: cleanName, state: '' };
}

// Normalize state name
export function normalizeState(rawState: unknown, officerState?: string): string {
  if (officerState) return officerState;
  if (!rawState) return '';
  const s = String(rawState).trim().toLowerCase();
  const found = STATES.find((st) => st.toLowerCase() === s || s.includes(st.toLowerCase()));
  if (found) return found;
  return String(rawState).trim();
}

// Normalize boolean (FCH operational)
export function parseFchOperational(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'operational';
}

// Extract challenges from raw row
export function extractChallenges(row: Record<string, unknown>, strippedMainChallenge: unknown): string[] {
  const challengeSet = new Set<string>();

  // 1. Check space-separated string from main column
  if (strippedMainChallenge) {
    const rawVal = String(strippedMainChallenge).trim();
    const parts = rawVal.split(/[\s,]+/);
    for (const part of parts) {
      const code = part.toLowerCase();
      if (code && code !== 'none') {
        challengeSet.add(code);
      }
    }
  }

  // 2. Check multiple-choice question columns from Kobo exports (e.g. "Main challenge category/pricing")
  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('challenge') && key.includes('/')) {
      const optionPart = key.substring(key.lastIndexOf('/') + 1).trim().toLowerCase();
      const valStr = String(value).trim().toLowerCase();
      const isSelected = valStr === '1' || valStr === 'true' || valStr === 'yes';

      if (isSelected && optionPart !== 'none') {
        // Match optionPart to known codes
        if (optionPart.includes('pricing')) challengeSet.add('pricing');
        else if (optionPart.includes('logistics')) challengeSet.add('logistics');
        else if (optionPart.includes('funding')) challengeSet.add('funding');
        else if (optionPart.includes('security')) challengeSet.add('security');
        else if (optionPart.includes('connectivity') || optionPart.includes('network')) challengeSet.add('connectivity');
        else if (optionPart.includes('dropoff') || optionPart.includes('drop-off') || optionPart.includes('agent_vendor')) challengeSet.add('agent_vendor_dropoff');
        else if (optionPart.includes('supply')) challengeSet.add('product_supply');
        else if (optionPart.includes('other')) challengeSet.add('other');
        else challengeSet.add(optionPart);
      }
    }
  }

  return Array.from(challengeSet);
}

// Main cleaner: cleans raw rows, deduplicates, and generates quality report
export function cleanKoboRows(rawRows: RawKoboRow[] = []): {
  cleanedRows: CleanedReportRow[];
  qualityReport: DataQualityReport;
} {
  const duplicatesMap = new Map<string, { latestRow: CleanedReportRow; count: number }>();
  const duplicateKeysList: string[] = [];
  const missingRowsList: Array<{ rowNum: number; error: string; raw: RawKoboRow }> = [];
  const anomaliesList: Array<{ id: string; sso: string; reason: string }> = [];
  const statusDisagreements: Array<{
    id: string;
    sso: string;
    week_start: string;
    submitted_on: string;
    rawStatus: string;
    computedStatus: string;
  }> = [];

  const intermediateCleaned: CleanedReportRow[] = [];

  rawRows.forEach((raw, idx) => {
    // Flatten / normalize keys (case-insensitive & stripped of section prefix)
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const cleanKey = stripPrefix(k).toLowerCase();
      normalized[cleanKey] = v;
      // also retain original key for export column lookups
      normalized[k] = v;
    }

    // Week start (Monday)
    const week_start_raw = String(
      normalized['week_start'] ||
      normalized['week start date (monday)'] ||
      normalized['week start date'] ||
      normalized['week'] ||
      ''
    ).trim();

    // Officer
    const rawSso = normalized['sso'] || normalized['sales officer'] || normalized['officer'] || '';
    const officer = resolveOfficer(rawSso);

    // State
    const rawState = normalized['state'] || '';
    const state = normalizeState(rawState, officer.state);

    // Missing checks
    const missingErrors: string[] = [];
    if (!officer.name) missingErrors.push('Missing Officer');
    if (!state) missingErrors.push('Missing State');
    if (!week_start_raw) missingErrors.push('Missing Week Start');

    if (missingErrors.length > 0) {
      missingRowsList.push({
        rowNum: idx + 1,
        error: missingErrors.join(', '),
        raw,
      });
      // If no officer or week start, we cannot track this row reliably
      if (!officer.name && !week_start_raw) return;
    }

    // Submitted on
    const submitted_on_raw = String(
      normalized['submitted_on'] ||
      normalized['date submitted'] ||
      normalized['submission date'] ||
      normalized['_submission_time'] ||
      week_start_raw
    ).slice(0, 10);

    // Computed deadline = week_start + 3 days (Thursday)
    const deadline = addDaysToDate(week_start_raw, 3);

    // Computed submission status
    // Form refuses reports after Friday.
    // On time if submitted_on <= deadline (Thursday).
    // Late if Friday (days_late = days after Thursday).
    const diffFromDeadline = dateDiffDays(submitted_on_raw, deadline);
    const isLate = diffFromDeadline > 0;
    const computedStatus: 'On time' | 'Late' = isLate ? 'Late' : 'On time';
    const computedDaysLate = isLate ? Math.max(1, diffFromDeadline) : 0;

    // Check status disagreement with raw status if provided
    const rawStatus = String(normalized['submission_status'] || '').trim();
    if (rawStatus && rawStatus.toLowerCase() !== computedStatus.toLowerCase()) {
      statusDisagreements.push({
        id: String(raw['_id'] || `row-${idx + 1}`),
        sso: officer.name || 'Unknown Officer',
        week_start: week_start_raw,
        submitted_on: submitted_on_raw,
        rawStatus,
        computedStatus,
      });
    }

    // Month name
    let month = String(normalized['month'] || '').trim();
    if (!month && week_start_raw) {
      try {
        const parts = week_start_raw.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
          month = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      } catch {
        month = 'October 2026';
      }
    }

    // Numeric fields
    const anomalyReasons: string[] = [];
    const checkNumericField = (fieldKey: string, val: unknown): number => {
      const { num, isNegative, isInvalid } = safeNumber(val);
      if (isNegative) {
        anomalyReasons.push(`Negative value in ${fieldKey} (${num})`);
      }
      if (isInvalid) {
        anomalyReasons.push(`Non-numeric value in ${fieldKey} ("${val}")`);
      }
      return num;
    };

    const n_agent_id = checkNumericField('n_agent_id', normalized['n_agent_id'] ?? normalized['new agents identified']);
    const n_vend_id = checkNumericField('n_vend_id', normalized['n_vend_id'] ?? normalized['new vendors identified']);
    const n_coop_id = checkNumericField('n_coop_id', normalized['n_coop_id'] ?? normalized['cooperatives identified']);
    const agent_val = checkNumericField('agent_val', normalized['agent_val'] ?? normalized['agents validated']);
    const vend_val = checkNumericField('vend_val', normalized['vend_val'] ?? normalized['vendors validated']);
    const fac_established = checkNumericField('fac_established', normalized['fac_established'] ?? normalized['fac sites established']);
    const train_sess = checkNumericField('train_sess', normalized['train_sess'] ?? normalized['training sessions held']);
    const coop_train = checkNumericField('coop_train', normalized['coop_train'] ?? normalized['cooperative training held']);
    const rev = checkNumericField('rev', normalized['rev'] ?? normalized['revenue in naira'] ?? normalized['revenue']);

    if (anomalyReasons.length > 0) {
      anomaliesList.push({
        id: String(raw['_id'] || `row-${idx + 1}`),
        sso: officer.name || 'Unknown Officer',
        reason: anomalyReasons.join('; '),
      });
    }

    // Operational FCH
    const fch_operational = parseFchOperational(
      normalized['fch_operational'] ?? normalized['operational fch']
    );

    // Project deliverable
    const rawProj = String(normalized['proj'] || normalized['project deliverable'] || 'none').toLowerCase().trim();
    const proj = PROJECT_LABELS[rawProj] ? rawProj : 'other';
    const proj_label = PROJECT_LABELS[proj] || rawProj;

    // Intelligence
    const rawIntel = String(normalized['intel'] || normalized['weekly state intelligence submitted'] || 'no').toLowerCase().trim();
    const intel: 'yes' | 'no' = rawIntel === 'yes' || rawIntel === 'true' || rawIntel === '1' ? 'yes' : 'no';

    // Challenges
    const challenges = extractChallenges(
      raw as Record<string, unknown>,
      normalized['main_challenge_category'] || normalized['main challenge category']
    );

    // Report Key for deduplication
    const rawReportKey = String(
      normalized['report_key'] ||
      `${officer.code || officer.name}_${week_start_raw}`
    ).trim();

    const submission_time = String(
      raw['_submission_time'] || raw['start'] || submitted_on_raw
    );

    const cleanedRow: CleanedReportRow = {
      id: String(raw['_id'] || `rep-${idx + 1}`),
      report_key: rawReportKey,
      week_start: week_start_raw,
      sso_code: officer.code,
      sso_name: officer.name,
      state: state || officer.state,
      submitted_on: submitted_on_raw,
      deadline,
      submission_status: computedStatus,
      raw_submission_status: rawStatus,
      days_late: computedDaysLate,
      month,
      n_agent_id,
      n_vend_id,
      n_coop_id,
      agent_val,
      vend_val,
      fch_operational,
      fac_established,
      train_sess,
      coop_train,
      rev,
      proj,
      proj_label,
      intel,
      challenges,
      submission_time,
      has_data_anomaly: anomalyReasons.length > 0,
      anomaly_reasons: anomalyReasons,
    };

    intermediateCleaned.push(cleanedRow);
  });

  // Deduplication logic: "If two rows share the same report_key, keep the latest and show 'N duplicates ignored'."
  intermediateCleaned.forEach((row) => {
    const key = row.report_key;
    if (!duplicatesMap.has(key)) {
      duplicatesMap.set(key, { latestRow: row, count: 1 });
    } else {
      const existing = duplicatesMap.get(key)!;
      existing.count += 1;
      duplicateKeysList.push(key);

      // Keep the latest submission
      const existingTime = new Date(existing.latestRow.submission_time).getTime() || 0;
      const newTime = new Date(row.submission_time).getTime() || 0;
      if (newTime >= existingTime) {
        existing.latestRow = row;
      }
    }
  });

  const finalCleanedRows = Array.from(duplicatesMap.values())
    .map((item) => item.latestRow)
    .sort((a, b) => {
      // sort by week_start ascending, then state
      const dateCompare = a.week_start.localeCompare(b.week_start);
      if (dateCompare !== 0) return dateCompare;
      return a.state.localeCompare(b.state);
    });

  const qualityReport: DataQualityReport = {
    totalRawRows: rawRows.length,
    validRows: finalCleanedRows.length,
    duplicatesIgnoredCount: duplicateKeysList.length,
    duplicateKeys: Array.from(new Set(duplicateKeysList)),
    missingOfficerOrStateCount: missingRowsList.length,
    missingRowsDetails: missingRowsList,
    nonNumericOrNegativeCount: anomaliesList.length,
    anomaliesDetails: anomaliesList,
    statusDisagreementCount: statusDisagreements.length,
    statusDisagreements,
    targetChecks: {
      missingTargetStates: [],
      missingTargetMetrics: [],
      unrecognizedMetrics: [],
      usingDefaultTargets: false,
      targetsCount: 0,
    },
  };

  return { cleanedRows: finalCleanedRows, qualityReport };
}

// Audit Targets list for Data Quality check
export function auditTargets(targets: TargetItem[] = []): {
  missingTargetStates: string[];
  missingTargetMetrics: string[];
  unrecognizedMetrics: string[];
  isUsingDefault: boolean;
} {
  const missingStates = new Set<string>();
  const missingMetrics = new Set<string>();
  const unrecognized = new Set<string>();

  // Check unrecognized metrics
  targets.forEach((t) => {
    const cleanMetric = t.metric?.trim();
    if (!cleanMetric) return;
    const isRecognised = RECOGNISED_TARGET_METRICS.some(
      (m) => m.toLowerCase() === cleanMetric.toLowerCase()
    );
    if (!isRecognised) {
      unrecognized.add(cleanMetric);
    }
  });

  // Check all 7 states have 3-month metrics
  const standardMetrics = ['Agents', 'Vendors', 'FCHs', 'FACs', 'Cooperatives'];
  STATES.forEach((state) => {
    standardMetrics.forEach((metric) => {
      const match = targets.find(
        (t) =>
          t.state?.trim().toLowerCase() === state.toLowerCase() &&
          t.metric?.trim().toLowerCase() === metric.toLowerCase()
      );
      if (!match) {
        missingStates.add(`${state} (${metric})`);
      }
    });

    // Check revenue targets exist for Oct, Nov, Dec
    const revMonths = ['October 2026', 'November 2026', 'December 2026'];
    revMonths.forEach((m) => {
      const revMatch = targets.find(
        (t) =>
          t.state?.trim().toLowerCase() === state.toLowerCase() &&
          t.metric?.trim().toLowerCase() === 'revenue' &&
          t.period?.trim().toLowerCase() === m.toLowerCase()
      );
      if (!revMatch) {
        missingMetrics.add(`${state} Revenue (${m})`);
      }
    });
  });

  return {
    missingTargetStates: Array.from(missingStates),
    missingTargetMetrics: Array.from(missingMetrics),
    unrecognizedMetrics: Array.from(unrecognized),
    isUsingDefault: false,
  };
}

// Target resolution helper
export function getTargetValue(
  targets: TargetItem[],
  state: string,
  metric: string,
  period?: string
): number | null {
  if (!targets || targets.length === 0) return null;

  const cleanState = state.trim().toLowerCase();
  const cleanMetric = metric.trim().toLowerCase();

  if (cleanMetric === 'revenue') {
    if (period && period !== 'Q4' && period !== 'all') {
      const cleanPeriod = period.trim().toLowerCase();
      const item = targets.find(
        (t) =>
          t.state?.trim().toLowerCase() === cleanState &&
          t.metric?.trim().toLowerCase() === 'revenue' &&
          t.period?.trim().toLowerCase() === cleanPeriod
      );
      return item ? item.target : null;
    }
    // Sum for Q4 / All
    const q4Months = ['october 2026', 'november 2026', 'december 2026'];
    let sum = 0;
    let foundAny = false;
    targets.forEach((t) => {
      if (
        t.state?.trim().toLowerCase() === cleanState &&
        t.metric?.trim().toLowerCase() === 'revenue' &&
        q4Months.includes(t.period?.trim().toLowerCase())
      ) {
        sum += t.target;
        foundAny = true;
      }
    });
    return foundAny ? sum : null;
  }

  // Non-revenue target (3-month or general)
  const item = targets.find(
    (t) =>
      t.state?.trim().toLowerCase() === cleanState &&
      t.metric?.trim().toLowerCase() === cleanMetric
  );
  return item ? item.target : null;
}
