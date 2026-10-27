/**
 * Data structures and types for SSO Weekly Performance Tracker
 */

export interface OfficerInfo {
  code: string;
  name: string;
  state: string;
}

export interface RawKoboRow {
  week_start?: string;
  sso?: string;
  state?: string;
  submitted_on?: string;
  deadline?: string;
  submission_status?: string;
  days_late?: number | string;
  month?: string;
  report_key?: string;
  n_agent_id?: number | string;
  n_vend_id?: number | string;
  n_coop_id?: number | string;
  agent_val?: number | string;
  vend_val?: number | string;
  fch_operational?: string | number | boolean;
  fac_established?: number | string;
  train_sess?: number | string;
  coop_train?: number | string;
  rev?: number | string;
  proj?: string;
  intel?: string;
  Main_challenge_category?: string;
  _id?: string | number;
  _submission_time?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

export interface CleanedReportRow {
  id: string;
  report_key: string;
  week_start: string; // YYYY-MM-DD (Monday)
  sso_code: string;
  sso_name: string;
  state: string;
  submitted_on: string; // YYYY-MM-DD
  deadline: string; // computed: week_start + 3 days (Thursday)
  submission_status: 'On time' | 'Late';
  raw_submission_status?: string;
  days_late: number;
  month: string; // e.g. "October 2026"
  n_agent_id: number;
  n_vend_id: number;
  n_coop_id: number;
  agent_val: number;
  vend_val: number;
  fch_operational: boolean;
  fac_established: number;
  train_sess: number;
  coop_train: number;
  rev: number;
  proj: string;
  proj_label: string;
  intel: 'yes' | 'no';
  challenges: string[];
  submission_time: string;
  has_data_anomaly: boolean;
  anomaly_reasons: string[];
}

export interface TargetItem {
  state: string;
  metric: string; // 'Agents' | 'Vendors' | 'FCHs' | 'FACs' | 'Cooperatives' | 'Revenue'
  period: string; // '3-month' | 'October 2026' | 'November 2026' | 'December 2026' | etc.
  target: number;
}

export interface ApiResponse {
  ok: boolean;
  updated?: string;
  targetsUpdated?: string;
  count?: number;
  rows?: RawKoboRow[];
  targets?: TargetItem[];
  targetsError?: string;
  error?: string;
}

export interface GlobalFilterState {
  month: string; // 'all' or month string
  week: string; // 'all' or YYYY-MM-DD
  state: string; // 'all' or state name
  officer: string; // 'all' or officer name
  showTargets: boolean; // eye-icon toggle
}

export interface DataQualityReport {
  totalRawRows: number;
  validRows: number;
  duplicatesIgnoredCount: number;
  duplicateKeys: string[];
  missingOfficerOrStateCount: number;
  missingRowsDetails: Array<{ rowNum: number; error: string; raw: RawKoboRow }>;
  nonNumericOrNegativeCount: number;
  anomaliesDetails: Array<{ id: string; sso: string; reason: string }>;
  statusDisagreementCount: number;
  statusDisagreements: Array<{
    id: string;
    sso: string;
    week_start: string;
    submitted_on: string;
    rawStatus: string;
    computedStatus: string;
  }>;
  targetChecks: {
    missingTargetStates: string[];
    missingTargetMetrics: string[];
    unrecognizedMetrics: string[];
    usingDefaultTargets: boolean;
    targetsCount: number;
  };
}
