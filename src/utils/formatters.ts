/**
 * Formatting utilities for Extension Africa SSO Dashboard
 */

export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₦0';
  const rounded = Math.round(amount);
  return '₦' + rounded.toLocaleString('en-NG');
}

export function formatNumber(num: number | null | undefined, decimals = 0): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (decimals > 0) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Math.round(num).toLocaleString('en-US');
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '0%';
  return `${Math.round(rate * 10) / 10}%`;
}

export function getPercentStatusClass(percent: number | null | undefined): {
  bg: string;
  text: string;
  badge: string;
} {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      badge: 'bg-slate-100 text-slate-700',
    };
  }
  if (percent >= 100) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700 font-semibold',
      badge: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (percent >= 50) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700 font-semibold',
      badge: 'bg-amber-100 text-amber-800',
    };
  }
  return {
    bg: 'bg-rose-50',
    text: 'text-rose-700 font-semibold',
    badge: 'bg-rose-100 text-rose-800',
  };
}

export function formatDateString(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function formatDateTime(isoOrTimeStr?: string): string {
  if (!isoOrTimeStr) return 'Not available';
  try {
    const d = new Date(isoOrTimeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: 'numeric',
        month: 'short',
      });
    }
  } catch {
    // fallback
  }
  return isoOrTimeStr;
}
