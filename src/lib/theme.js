/**
 * Acorn Tools Design System — Dark + Light mode via CSS custom properties
 */

const darkColors = {
  bg:           '#0a0a0b',
  surface:      '#131316',
  surfaceHover: '#1a1a1f',
  surfaceAlt:   '#0f0f12',
  border:       '#1f1f26',
  borderActive: '#3d3d4a',
  text:         '#e8e6e3',
  textMuted:    '#6b6976',
  textDim:      '#3e3c47',
  accent:       '#c9a55a',
  accentDim:    'rgba(201,165,90,0.12)',
  accentGlow:   'rgba(201,165,90,0.06)',
  accentHover:  '#d4b366',
  success:      '#5ab87a',
  successDim:   'rgba(90,184,122,0.12)',
  error:        '#c95a5a',
  errorDim:     'rgba(201,90,90,0.12)',
  overlay:      'rgba(0,0,0,0.75)',
  shadowSm:     '0 1px 2px rgba(0,0,0,0.3)',
  shadowMd:     '0 4px 12px rgba(0,0,0,0.4)',
  shadowLg:     '0 8px 32px rgba(0,0,0,0.5)',
};

const lightColors = {
  bg:           '#f5f5f6',
  surface:      '#ffffff',
  surfaceHover: '#eeedf1',
  surfaceAlt:   '#fafafa',
  border:       '#d4d3d9',
  borderActive: '#b0aeb8',
  text:         '#1a1a1d',
  textMuted:    '#5c5966',
  textDim:      '#908d9a',
  accent:       '#8f7420',
  accentDim:    'rgba(143,116,32,0.14)',
  accentGlow:   'rgba(143,116,32,0.07)',
  accentHover:  '#a6882e',
  success:      '#1b7a3d',
  successDim:   'rgba(27,122,61,0.12)',
  error:        '#c43c3c',
  errorDim:     'rgba(196,60,60,0.10)',
  overlay:      'rgba(0,0,0,0.45)',
  shadowSm:     '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd:     '0 4px 12px rgba(0,0,0,0.10)',
  shadowLg:     '0 8px 32px rgba(0,0,0,0.12)',
};

// Build CSS variable declarations from a color map
function toVars(colors) {
  return Object.entries(colors)
    .map(([k, v]) => `--at-${k}: ${v};`)
    .join('\n  ');
}

// Theme object references CSS variables — works in inline styles
const colorKeys = Object.keys(darkColors);
const themeColors = {};
for (const k of colorKeys) {
  themeColors[k] = `var(--at-${k})`;
}

export const theme = {
  ...themeColors,

  // Static tokens (same in both themes)
  radius:       10,
  radiusLg:     14,
  font:         "'Outfit', sans-serif",
  fontMono:     "'JetBrains Mono', monospace",
  transition:   'all 0.2s ease',
  transitionFast: 'all 0.15s ease',
};

// ── Theme switching ──

const STORAGE_KEY = 'acorntools-theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch { return null; }
}

export function applyTheme(mode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = mode === 'light' ? lightColors.bg : darkColors.bg;
}

export function getInitialTheme() {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  // Respect OS preference
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

// ── Global styles ──

export const fonts = {
  url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
};

export const globalStyles = `
  @import url('${fonts.url}');

  :root {
    ${toVars(darkColors)}
  }

  [data-theme="light"] {
    ${toVars(lightColors)}
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    scroll-behavior: smooth;
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
  }

  body {
    background: var(--at-bg);
    color: var(--at-text);
    font-family: ${theme.font};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior: none;
    overflow-y: auto;
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--at-border);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--at-borderActive); }

  /* Number input spinners */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] { -moz-appearance: textfield; }

  /* Range slider */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--at-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--at-accent);
    cursor: pointer;
    border: 2px solid var(--at-bg);
    box-shadow: 0 0 8px var(--at-accentDim);
    transition: transform 0.15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--at-accent);
    cursor: pointer;
    border: 2px solid var(--at-bg);
  }

  ::selection {
    background: var(--at-accentDim);
    color: var(--at-accent);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Mobile-friendly touch targets */
  @media (max-width: 640px) {
    button { min-height: 44px; }
  }

  /* Respect reduced-motion preference */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Capacitor safe areas */
  .safe-area-top { padding-top: var(--sat, 0px); }
  .safe-area-bottom { padding-bottom: var(--sab, 0px); }
`;
