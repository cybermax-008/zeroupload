/**
 * Acorn Tools — fully free, no usage limits.
 * This module is kept as a stub so any stale imports don't break.
 */

export function isPro() { return true; }
export function canUseOperation() { return true; }
export function recordOperation() {}
export function getUsageInfo() {
  return { isPro: true, allowed: true, used: 0, remaining: Infinity, total: Infinity };
}
export function checkStripeRedirect() { return false; }
export function activatePro() {}
export function getLicenseKey() { return ''; }
export async function verifyLicenseKey() { return { valid: false }; }
export const STRIPE_CHECKOUT_URL = '';
