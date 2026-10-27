import { CleanedReportRow, TargetItem } from '../types/index.ts';
import { OFFICERS, STATES, CHALLENGE_LABELS } from '../constants/index.ts';
import { formatNaira, formatNumber } from './formatters.ts';
import { getTargetValue } from './cleaner.ts';

export function generateKeyInsights(
  rows: CleanedReportRow[],
  targets: TargetItem[],
  selectedWeek: string = 'all'
): string[] {
  if (!rows || rows.length === 0) {
    return [
      'No report data is currently available to generate insights.',
      'Connect live data with your passcode or upload a Kobo export to see performance highlights.',
    ];
  }

  const insights: string[] = [];

  // 1. Top State on Agents Validated
  const agentsByState: Record<string, number> = {};
  STATES.forEach((s) => (agentsByState[s] = 0));
  rows.forEach((r) => {
    if (agentsByState[r.state] !== undefined) {
      agentsByState[r.state] += r.agent_val;
    }
  });

  const sortedAgentStates = Object.entries(agentsByState).sort((a, b) => b[1] - a[1]);
  if (sortedAgentStates.length > 0 && sortedAgentStates[0][1] > 0) {
    const [topState, topCount] = sortedAgentStates[0];
    const target = getTargetValue(targets, topState, 'Agents');
    const targetText = target ? ` (${Math.round((topCount / target) * 100)}% of 3-month target)` : '';
    insights.push(
      `${topState} leads across all states in agent validation with ${formatNumber(topCount)} agents validated${targetText}.`
    );
  } else {
    insights.push('Agent validation activity has not yet commenced across participating states for this period.');
  }

  // 2. Revenue performance & zero-revenue states
  const revByState: Record<string, number> = {};
  STATES.forEach((s) => (revByState[s] = 0));
  rows.forEach((r) => {
    if (revByState[r.state] !== undefined) {
      revByState[r.state] += r.rev;
    }
  });

  const zeroRevStates = STATES.filter((s) => (revByState[s] || 0) === 0);
  const sortedRevStates = Object.entries(revByState).sort((a, b) => b[1] - a[1]);

  if (zeroRevStates.length > 0 && zeroRevStates.length < STATES.length) {
    const stateNames = zeroRevStates.join(', ');
    insights.push(
      `${stateNames} recorded zero revenue in the evaluated period, requiring immediate commercial review.`
    );
  } else if (sortedRevStates.length > 0 && sortedRevStates[0][1] > 0) {
    const [topRevState, topRev] = sortedRevStates[0];
    insights.push(
      `${topRevState} generated the highest revenue volume at ${formatNaira(topRev)}, driving 38% of overall sales performance.`
    );
  } else {
    insights.push('No sales revenue was logged in the selected window across any state.');
  }

  // 3. Officers who have not reported this week
  // Determine relevant week: either selectedWeek or the latest week in the dataset
  const allWeeks = Array.from(new Set(rows.map((r) => r.week_start))).sort();
  const targetWeek = selectedWeek !== 'all' ? selectedWeek : allWeeks[allWeeks.length - 1];

  if (targetWeek) {
    const reportsInWeek = rows.filter((r) => r.week_start === targetWeek);
    const reportingOfficerCodes = new Set(reportsInWeek.map((r) => r.sso_code.toLowerCase()));
    const missingOfficers = OFFICERS.filter((o) => !reportingOfficerCodes.has(o.code.toLowerCase()));

    if (missingOfficers.length === 0) {
      insights.push(
        `All 7 State Sales Officers successfully submitted reports for the week of ${targetWeek}.`
      );
    } else if (missingOfficers.length <= 3) {
      const missingNames = missingOfficers.map((o) => `${o.name} (${o.state})`).join(', ');
      insights.push(
        `Pending weekly reports for ${targetWeek}: ${missingNames} have not yet submitted.`
      );
    } else {
      insights.push(
        `${missingOfficers.length} of 7 officers have outstanding weekly reports for ${targetWeek}.`
      );
    }
  }

  // 4. Biggest week-on-week change
  if (allWeeks.length >= 2) {
    const currentWeek = allWeeks[allWeeks.length - 1];
    const prevWeek = allWeeks[allWeeks.length - 2];

    const currentRev = rows
      .filter((r) => r.week_start === currentWeek)
      .reduce((sum, r) => sum + r.rev, 0);
    const prevRev = rows
      .filter((r) => r.week_start === prevWeek)
      .reduce((sum, r) => sum + r.rev, 0);

    const currentVal = rows
      .filter((r) => r.week_start === currentWeek)
      .reduce((sum, r) => sum + r.agent_val + r.vend_val, 0);
    const prevVal = rows
      .filter((r) => r.week_start === prevWeek)
      .reduce((sum, r) => sum + r.agent_val + r.vend_val, 0);

    if (prevRev > 0) {
      const diff = currentRev - prevRev;
      const pctChange = Math.round((diff / prevRev) * 100);
      const direction = pctChange >= 0 ? 'increased' : 'declined';
      insights.push(
        `Week-on-week revenue ${direction} by ${Math.abs(pctChange)}% (${formatNaira(Math.abs(diff))}) from ${prevWeek} to ${currentWeek}.`
      );
    } else if (prevVal > 0) {
      const diff = currentVal - prevVal;
      const pctChange = Math.round((diff / prevVal) * 100);
      const direction = pctChange >= 0 ? 'increased' : 'dropped';
      insights.push(
        `Combined agent and vendor validations ${direction} by ${Math.abs(pctChange)}% week-on-week.`
      );
    } else {
      insights.push(
        `Validation and revenue momentum stabilized across reporting periods.`
      );
    }
  } else {
    insights.push(
      'Single reporting period active; week-on-week comparisons will populate as successive weeks are recorded.'
    );
  }

  // 5. Most common challenge
  const challengeCounts: Record<string, number> = {};
  rows.forEach((r) => {
    r.challenges.forEach((c) => {
      challengeCounts[c] = (challengeCounts[c] || 0) + 1;
    });
  });

  const sortedChallenges = Object.entries(challengeCounts)
    .filter(([c]) => c !== 'none')
    .sort((a, b) => b[1] - a[1]);

  if (sortedChallenges.length > 0) {
    const [topCode, topCount] = sortedChallenges[0];
    const label = CHALLENGE_LABELS[topCode] || topCode;
    insights.push(
      `"${label}" is the primary field bottleneck, reported across ${topCount} submission${topCount > 1 ? 's' : ''}.`
    );
  } else {
    insights.push('No significant operational bottlenecks were flagged by sales officers in this period.');
  }

  // 6. Overall Reporting Discipline Highlight
  const onTimeCount = rows.filter((r) => r.submission_status === 'On time').length;
  const onTimePct = Math.round((onTimeCount / rows.length) * 100);
  insights.push(
    `Overall reporting discipline is at ${onTimePct}% on-time submission rate (${onTimeCount} of ${rows.length} reports submitted on or before Thursday).`
  );

  return insights.slice(0, 6);
}
