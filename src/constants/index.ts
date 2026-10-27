import { OfficerInfo, TargetItem } from '../types/index.ts';

export const OFFICERS: OfficerInfo[] = [
  { code: 'uga_blessing', name: 'Uga Blessing', state: 'Benue' },
  { code: 'musbhu_isah', name: 'Musbhu Isah', state: 'Jigawa' },
  { code: 'yunusa_ayuba', name: 'Yunusa Ayuba', state: 'Kaduna' },
  { code: 'abdullahi_yakubu', name: 'Abdullahi Yakubu', state: 'Kano' },
  { code: 'abubakar_muhammed', name: 'Abubakar Muhammed', state: 'Nasarawa' },
  { code: 'mading_john_paul', name: 'Mading John Paul', state: 'Taraba' },
  { code: 'audu_gambo', name: 'Audu Gambo', state: 'Yobe' },
];

export const STATES = [
  'Benue',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Nasarawa',
  'Taraba',
  'Yobe',
];

export const PROJECT_LABELS: Record<string, string> = {
  none: 'None',
  heifer: 'Heifer International',
  sha: 'Self Help Africa (SHA)',
  ignitia: 'Ignitia Weather',
  other: 'Other Project',
};

export const CHALLENGE_LABELS: Record<string, string> = {
  none: 'None / No Major Issue',
  logistics: 'Logistics',
  funding: 'Funding / Working Capital',
  security: 'Security Concerns',
  connectivity: 'Network & Connectivity',
  agent_vendor_dropoff: 'Agent or vendor drop-off',
  product_supply: 'Product supply',
  pricing: 'Pricing',
  other: 'Other Challenges',
};

export const RECOGNISED_TARGET_METRICS = [
  'Agents',
  'Vendors',
  'FCHs',
  'FACs',
  'Cooperatives',
  'Revenue',
];

// Built-in default targets
export const DEFAULT_TARGETS: TargetItem[] = [
  // 3-Month cumulative targets for 7 states
  ...STATES.flatMap((state) => [
    { state, metric: 'Agents', period: '3-month', target: 35 },
    { state, metric: 'Vendors', period: '3-month', target: 35 },
    { state, metric: 'FCHs', period: '3-month', target: 1 },
    { state, metric: 'Cooperatives', period: '3-month', target: 280 },
  ]),

  // FAC targets: Benue 3, Jigawa 3, Kaduna 2, Kano 1, Nasarawa 2, Taraba 5, Yobe 3
  { state: 'Benue', metric: 'FACs', period: '3-month', target: 3 },
  { state: 'Jigawa', metric: 'FACs', period: '3-month', target: 3 },
  { state: 'Kaduna', metric: 'FACs', period: '3-month', target: 2 },
  { state: 'Kano', metric: 'FACs', period: '3-month', target: 1 },
  { state: 'Nasarawa', metric: 'FACs', period: '3-month', target: 2 },
  { state: 'Taraba', metric: 'FACs', period: '3-month', target: 5 },
  { state: 'Yobe', metric: 'FACs', period: '3-month', target: 3 },

  // Revenue (Oct / Nov / Dec):
  // Taraba 3,000,000 / 5,000,000 / 4,000,000
  { state: 'Taraba', metric: 'Revenue', period: 'October 2026', target: 3000000 },
  { state: 'Taraba', metric: 'Revenue', period: 'November 2026', target: 5000000 },
  { state: 'Taraba', metric: 'Revenue', period: 'December 2026', target: 4000000 },

  // Benue 1,500,000 / 3,000,000 / 1,500,000
  { state: 'Benue', metric: 'Revenue', period: 'October 2026', target: 1500000 },
  { state: 'Benue', metric: 'Revenue', period: 'November 2026', target: 3000000 },
  { state: 'Benue', metric: 'Revenue', period: 'December 2026', target: 1500000 },

  // Yobe 1,500,000 / 3,000,000 / 1,500,000
  { state: 'Yobe', metric: 'Revenue', period: 'October 2026', target: 1500000 },
  { state: 'Yobe', metric: 'Revenue', period: 'November 2026', target: 3000000 },
  { state: 'Yobe', metric: 'Revenue', period: 'December 2026', target: 1500000 },

  // Jigawa 750,000 / 1,500,000 / 750,000
  { state: 'Jigawa', metric: 'Revenue', period: 'October 2026', target: 750000 },
  { state: 'Jigawa', metric: 'Revenue', period: 'November 2026', target: 1500000 },
  { state: 'Jigawa', metric: 'Revenue', period: 'December 2026', target: 750000 },

  // Nasarawa 250,000 / 1,000,000 / 250,000
  { state: 'Nasarawa', metric: 'Revenue', period: 'October 2026', target: 250000 },
  { state: 'Nasarawa', metric: 'Revenue', period: 'November 2026', target: 1000000 },
  { state: 'Nasarawa', metric: 'Revenue', period: 'December 2026', target: 250000 },

  // Kaduna 100,000 / 400,000 / 250,000
  { state: 'Kaduna', metric: 'Revenue', period: 'October 2026', target: 100000 },
  { state: 'Kaduna', metric: 'Revenue', period: 'November 2026', target: 400000 },
  { state: 'Kaduna', metric: 'Revenue', period: 'December 2026', target: 250000 },

  // Kano 100,000 / 400,000 / 250,000
  { state: 'Kano', metric: 'Revenue', period: 'October 2026', target: 100000 },
  { state: 'Kano', metric: 'Revenue', period: 'November 2026', target: 400000 },
  { state: 'Kano', metric: 'Revenue', period: 'December 2026', target: 250000 },
];
