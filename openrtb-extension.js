// OpenRTB 2.6 extension: how AATAP rides on existing plumbing
// instead of requiring a new auction protocol.
// A Prebid.js bidder adapter or Prebid Server bidder can copy
// ext.agent verbatim; a DSP that does not understand it ignores
// unknown ext fields, per OpenRTB rules. No breaking change.

import { validateAgentIdentity } from './agent-identity.js';
import { evaluateApproval } from './approval-policy.js';

/**
 * Build an OpenRTB bid-request fragment from a validated agent manifest.
 * @param {object} agentManifest
 * @param {Array} sessionActions
 */
export function toOpenRTBExt(agentManifest, sessionActions = []) {
  const identity = validateAgentIdentity(agentManifest);
  if (!identity.valid) throw new Error(`invalid agent identity: ${identity.errors.join('; ')}`);
  const approval = evaluateApproval(sessionActions);
  return {
    // OpenRTB: bidRequest.ext.agent  (proposed, not yet in the IAB spec)
    agent: {
      ...identity.normalized,
      approval: {
        requiresApproval: approval.requiresApproval,
        reasons: approval.reasons,
        cumulativeUSD: approval.cumulativeUSD,
      },
      // Privacy invariant, stated in the wire format itself:
      containsUserIdentifier: false,
    },
  };
}

/** Minimal JSON Schema for ext.agent, for validators / Prebid docs. */
export const AGENT_EXT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'AATAP ext.agent (draft 0.1)',
  type: 'object',
  required: ['version', 'actorType', 'principalType', 'attestationMethod', 'sponsored'],
  properties: {
    version: { const: 'aatap/0.1' },
    actorType: { enum: ['user-agent', 'merchant-agent', 'publisher-agent', 'unknown-agent'] },
    principalType: { enum: ['user', 'merchant', 'publisher'] },
    attestationMethod: { enum: ['webmcp-tool', 'mcp-server', 'browser-attested', 'signed-manifest', 'none'] },
    sponsored: { type: 'boolean' },
    sponsorDisclosure: { type: ['string', 'null'] },
    containsUserIdentifier: { const: false },
  },
};
