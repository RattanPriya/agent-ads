// Approval policy: the anti-bypass guard for WebMCP-style tool calls.
// Mirrors the open WebMCP #288 concern: an agent must not silently
// bypass human approval for consequential actions by splitting them
// into small, individually innocent tool calls.
//
// Policy is declarative so a publisher, browser, or exchange can
// enforce the *same* rule without sharing user data.

export const DEFAULT_POLICY = {
  // Any single action at/above this needs explicit approval.
  singleActionThresholdUSD: 50,
  // Cumulative spend in a session at/above this needs approval, even if
  // each action is below the single-action threshold (anti-splitting).
  sessionCumulativeThresholdUSD: 100,
  // These always need approval, regardless of price.
  alwaysRequireApprovalFor: ['subscription', 'purchase', 'payment-method-change', 'account-change', 'data-export'],
  // These never need approval on their own (read-only / reversible).
  neverRequireApprovalFor: ['search', 'compare', 'read', 'add-to-cart'],
};

/**
 * @param {Array<{action:string, amountUSD:number}>} actionsInSession - prior + current, in order
 * @param {object} policy
 * @returns {{requiresApproval:boolean, reasons:string[], cumulativeUSD:number}}
 */
export function evaluateApproval(actionsInSession, policy = DEFAULT_POLICY) {
  const cumulativeUSD = actionsInSession.reduce((s, a) => s + (a.amountUSD || 0), 0);
  const reasons = [];
  const last = actionsInSession[actionsInSession.length - 1];
  if (!last) return { requiresApproval: false, reasons: ['no action'], cumulativeUSD: 0 };
  if (policy.alwaysRequireApprovalFor.includes(last.action)) reasons.push(`action ${last.action} always requires approval`);
  if ((last.amountUSD || 0) >= policy.singleActionThresholdUSD) reasons.push(`single action $${last.amountUSD} >= $${policy.singleActionThresholdUSD}`);
  if (cumulativeUSD >= policy.sessionCumulativeThresholdUSD) reasons.push(`session cumulative $${cumulativeUSD} >= $${policy.sessionCumulativeThresholdUSD} (anti-splitting)`);
  // Splitting detection: many small purchases in one session.
  const purchases = actionsInSession.filter(a => a.action === 'purchase');
  if (purchases.length >= 3 && cumulativeUSD >= 50) reasons.push('3+ purchases in one session totalling >= $50: treat as one consequential decision');
  return { requiresApproval: reasons.length > 0, reasons, cumulativeUSD };
}
