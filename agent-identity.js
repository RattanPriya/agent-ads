// Agent identity: who is acting, for whom, and with what proof?
// Core problem this solves: today an OpenRTB bid request cannot tell
// (a) a human click, (b) a user-delegated agent purchase, and (c) a
// merchant / affiliate agent impersonating a user. That gap enables
// agent-driven ad fraud, undisclosed sponsored steering, and purchases
// no principal ever approved. ads.txt / sellers.json authenticate
// *sellers*. Nothing authenticates *agents*.
//
// Design rules:
//  - No cross-site user ID, no email, no device fingerprint in the object.
//  - Identity is a claim + attestation method, not a tracking ID.
//  - A publisher / exchange can verify the *type* and *delegation*,
//    without learning who the user is.

export const ACTOR_TYPES = ['user-agent', 'merchant-agent', 'publisher-agent', 'unknown-agent'];
export const ATTESTATION_METHODS = ['webmcp-tool', 'mcp-server', 'browser-attested', 'signed-manifest', 'none'];

/**
 * @param {object} manifest
 * @returns {{valid: boolean, errors: string[], normalized: object|null}}
 */
export function validateAgentIdentity(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, errors: ['manifest must be an object'], normalized: null };
  if (!ACTOR_TYPES.includes(manifest.actorType)) errors.push(`actorType must be one of ${ACTOR_TYPES.join(', ')}`);
  if (typeof manifest.principalType !== 'string' || !['user', 'merchant', 'publisher'].includes(manifest.principalType)) {
    errors.push('principalType must be user | merchant | publisher');
  }
  if (manifest.actorType === 'user-agent' && manifest.principalType !== 'user') {
    errors.push('user-agent must have principalType=user (prevents merchant agents posing as users)');
  }
  if (!ATTESTATION_METHODS.includes(manifest.attestationMethod)) errors.push(`attestationMethod must be one of ${ATTESTATION_METHODS.join(', ')}`);
  // Delegation chain: each hop must name a role, never a person / ID.
  if (manifest.delegationChain !== undefined) {
    if (!Array.isArray(manifest.delegationChain)) errors.push('delegationChain must be an array');
    else for (const [i, hop] of manifest.delegationChain.entries()) {
      if (!hop || typeof hop.role !== 'string') errors.push(`delegationChain[${i}].role is required`);
      if (hop.userId || hop.email || hop.deviceId) errors.push(`delegationChain[${i}] must not contain userId/email/deviceId`);
    }
  }
  if (manifest.userId || manifest.email || manifest.deviceId || manifest.cookieId) {
    errors.push('manifest must not contain userId/email/deviceId/cookieId');
  }
  if (typeof manifest.sponsored !== 'boolean') errors.push('sponsored must be boolean: true if any party paid to influence this agent action');
  // Sponsored steering must be disclosed, not hidden in a ranking score.
  if (manifest.sponsored === true && !manifest.sponsorDisclosure) {
    errors.push('sponsored=true requires sponsorDisclosure (who paid, in plain text)');
  }
  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? {
      version: 'aatap/0.1',
      actorType: manifest.actorType,
      principalType: manifest.principalType,
      attestationMethod: manifest.attestationMethod,
      delegationChain: manifest.delegationChain ?? [],
      sponsored: manifest.sponsored,
      sponsorDisclosure: manifest.sponsorDisclosure ?? null,
    } : null,
  };
}
