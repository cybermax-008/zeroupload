/**
 * Acorn Tools Usage Gate
 *
 * Client-side usage tracking with localStorage.
 * Free: 5 operations/day. Pro: unlimited ($6.99 lifetime).
 */

import { isCapacitor } from './fileUtils';

const FREE_DAILY_LIMIT = 5;
const KEYS = {
  pro: 'acorn_pro',
  proSession: 'acorn_pro_session',
  proDate: 'acorn_pro_date',
  usageDate: 'acorn_usage_date',
  usageCount: 'acorn_usage_count',
};

// TODO: Replace with your actual Stripe Payment Link
export const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/YOUR_PAYMENT_LINK';

function today() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

export function isPro() {
  if (isCapacitor()) return true; // Native app purchase = always pro
  return localStorage.getItem(KEYS.pro) === '1';
}

export function activatePro(sessionId) {
  localStorage.setItem(KEYS.pro, '1');
  localStorage.setItem(KEYS.proDate, today());
  if (sessionId) localStorage.setItem(KEYS.proSession, sessionId);
}

/**
 * Check URL for Stripe redirect and activate pro if found.
 * Returns true if pro was just activated.
 */
export function checkStripeRedirect() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  if (sessionId) {
    activatePro(sessionId);
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  }
  return false;
}

function getUsageToday() {
  const storedDate = localStorage.getItem(KEYS.usageDate);
  if (storedDate !== today()) {
    // New day — reset
    localStorage.setItem(KEYS.usageDate, today());
    localStorage.setItem(KEYS.usageCount, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(KEYS.usageCount) || '0', 10);
}

export function getUsageInfo() {
  if (isPro()) {
    return { isPro: true, allowed: true, used: 0, remaining: Infinity, total: Infinity };
  }
  const used = getUsageToday();
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used);
  return {
    isPro: false,
    allowed: remaining > 0,
    used,
    remaining,
    total: FREE_DAILY_LIMIT,
  };
}

export function canUseOperation() {
  return getUsageInfo().allowed;
}

export function recordOperation() {
  if (isPro()) return;
  const used = getUsageToday();
  localStorage.setItem(KEYS.usageCount, String(used + 1));
}
