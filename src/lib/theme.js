/**
 * Acorn Tools Design System
 */

export const theme = {
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

  radius:       10,
  radiusLg:     14,

  font:         "'Outfit', sans-serif",
  fontMono:     "'JetBrains Mono', monospace",

  // Shadows
  shadowSm:     '0 1px 2px rgba(0,0,0,0.3)',
  shadowMd:     '0 4px 12px rgba(0,0,0,0.4)',
  shadowLg:     '0 8px 32px rgba(0,0,0,0.5)',

  // Transitions
  transition:   'all 0.2s ease',
  transitionFast: 'all 0.15s ease',
};

export const fonts = {
  url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
};

export const globalStyles = `
  @import url('${fonts.url}');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  html {
    /* Smooth scrolling */
    scroll-behavior: smooth;
    /* Safe area insets for notched devices */
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
  }

  body { 
    background: ${theme.bg}; 
    color: ${theme.text}; 
    font-family: ${theme.font};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior: none;
    /* Prevent pull-to-refresh on mobile */
    overflow-y: auto;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { 
    background: ${theme.border}; 
    border-radius: 3px; 
  }
  ::-webkit-scrollbar-thumb:hover { background: ${theme.borderActive}; }

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
    background: ${theme.border};
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${theme.accent};
    cursor: pointer;
    border: 2px solid ${theme.bg};
    box-shadow: 0 0 8px rgba(201,165,90,0.3);
    transition: transform 0.15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${theme.accent};
    cursor: pointer;
    border: 2px solid ${theme.bg};
  }

  ::selection { 
    background: ${theme.accentDim}; 
    color: ${theme.accent}; 
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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

  /* Capacitor safe areas */
  .safe-area-top { padding-top: var(--sat, 0px); }
  .safe-area-bottom { padding-bottom: var(--sab, 0px); }
`;
