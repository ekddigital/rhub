/**
 * Debate scoring utility functions
 */

import { SCORING, SPEECH_CRITERIA, type SpeechTypeKey } from "./config";

/**
 * Validate a criteria score is within bounds
 */
export function isValidCriteriaScore(score: number): boolean {
  return score >= SCORING.MIN_CRITERIA && score <= SCORING.MAX_CRITERIA;
}

/**
 * Calculate total score for a speech from criteria scores
 */
export function calcSpeechTotal(
  criteriaScores: Record<string, number>,
): number {
  return Object.values(criteriaScores).reduce((sum, s) => sum + s, 0);
}

/**
 * Check if all criteria are filled for a speech
 */
export function isSpeechComplete(
  speechType: SpeechTypeKey,
  criteriaScores: Record<string, number>,
): boolean {
  const defs = SPEECH_CRITERIA[speechType];
  return defs.every(
    (c) =>
      criteriaScores[c.key] !== undefined &&
      isValidCriteriaScore(criteriaScores[c.key]),
  );
}

/**
 * Calculate judge total for one side across all speeches
 */
export function calcJudgeSideTotal(
  speechScores: { speechType: SpeechTypeKey; total: number }[],
): number {
  return speechScores.reduce((sum, s) => sum + s.total, 0);
}

/**
 * Determine winner from judge totals
 */
export function determineWinner(
  proTotal: number,
  conTotal: number,
): "PRO" | "CON" | "TIE" {
  if (proTotal > conTotal) return "PRO";
  if (conTotal > proTotal) return "CON";
  return "TIE";
}

/**
 * Calculate final decision from multiple judges.
 * Winner is determined by the highest accumulated grand total score
 * (not by majority judge vote count, which is kept only for display).
 */
export function calcFinalDecision(
  judgeTotals: { proTotal: number; conTotal: number }[],
): {
  proWins: number;
  conWins: number;
  winner: "PRO" | "CON" | "TIE";
  proGrandTotal: number;
  conGrandTotal: number;
} {
  let proWins = 0;
  let conWins = 0;
  let proGrandTotal = 0;
  let conGrandTotal = 0;

  for (const jt of judgeTotals) {
    proGrandTotal += jt.proTotal;
    conGrandTotal += jt.conTotal;
    const w = determineWinner(jt.proTotal, jt.conTotal);
    if (w === "PRO") proWins++;
    else if (w === "CON") conWins++;
  }

  // Winner is decided by highest grand total, not by judge vote count.
  const winner =
    proGrandTotal > conGrandTotal
      ? ("PRO" as const)
      : conGrandTotal > proGrandTotal
        ? ("CON" as const)
        : ("TIE" as const);

  return {
    proWins,
    conWins,
    winner,
    proGrandTotal,
    conGrandTotal,
  };
}

/**
 * Calculate the combined decision that merges judge grand totals
 * with audience vote counts.  Used when the "Combined Score" toggle is on.
 */
export function calcCombinedDecision(
  judgeTotals: { proTotal: number; conTotal: number }[],
  audienceVotes: { pro: number; con: number },
): {
  proJudgeTotal: number;
  conJudgeTotal: number;
  proAudienceVotes: number;
  conAudienceVotes: number;
  proCombined: number;
  conCombined: number;
  winner: "PRO" | "CON" | "TIE";
} {
  const base = calcFinalDecision(judgeTotals);
  const proCombined = base.proGrandTotal + audienceVotes.pro;
  const conCombined = base.conGrandTotal + audienceVotes.con;

  const winner =
    proCombined > conCombined
      ? ("PRO" as const)
      : conCombined > proCombined
        ? ("CON" as const)
        : ("TIE" as const);

  return {
    proJudgeTotal: base.proGrandTotal,
    conJudgeTotal: base.conGrandTotal,
    proAudienceVotes: audienceVotes.pro,
    conAudienceVotes: audienceVotes.con,
    proCombined,
    conCombined,
    winner,
  };
}

/**
 * Generate 6-digit OTP token
 */
export function genOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format score for display (e.g., 4.5 → "4.5", 5 → "5")
 */
export function fmtScore(score: number): string {
  return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}
