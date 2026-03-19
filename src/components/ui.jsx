import { useState, useRef } from 'react';
import { theme } from '../lib/theme';
import { humanSize } from '../lib/fileUtils';
import { STRIPE_CHECKOUT_URL } from '../lib/usageGate';

// ══════════════════════════════════════════
// DropZone — Drag & drop file input
// ══════════════════════════════════════════
export function DropZone({ accept, multiple, onFiles, label, sublabel, compact }) {
  const [drag, setDrag] = useState(false);
  const [rejectMsg, setRejectMsg] = useState('');
  const inputRef = useRef();
  const rejectTimer = useRef(null);

  const matchesAccept = (file) => {
    if (!accept) return true;
    const parts = accept.split(',').map(s => s.trim().toLowerCase());
    const fType = file.type.toLowerCase();
    const fName = file.name.toLowerCase();
    return parts.some(p => {
      if (p.endsWith('/*')) return fType.startsWith(p.slice(0, -1));
      if (p.startsWith('.')) return fName.endsWith(p);
      return fType === p;
    });
  };

  const showReject = (msg) => {
    setRejectMsg(msg);
    if (rejectTimer.current) clearTimeout(rejectTimer.current);
    rejectTimer.current = setTimeout(() => setRejectMsg(''), 3000);
  };

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!files.length) return;

    const valid = files.filter(f => matchesAccept(f));
    if (valid.length === 0) {
      const expectsPdf = accept?.includes('.pdf') || accept?.includes('application/pdf');
      const expectsImage = accept?.includes('image/');
      if (expectsPdf && files[0]?.type.startsWith('image/')) {
        showReject('This tool requires a PDF file, not an image.');
      } else if (expectsImage && files[0]?.type === 'application/pdf') {
        showReject('This tool requires an image file, not a PDF.');
      } else {
        showReject('Unsupported file format.');
      }
      return;
    }
    setRejectMsg('');
    onFiles(valid);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handle}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${drag ? theme.accent : rejectMsg ? theme.error : theme.border}`,
        borderRadius: theme.radius,
        padding: compact ? '20px 16px' : '40px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: drag ? theme.accentGlow : 'transparent',
        transition: theme.transition,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handle}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>
        {drag ? '◈' : '◇'}
      </div>
      <p style={{
        color: theme.textMuted, fontSize: 13,
        fontWeight: 400, lineHeight: 1.5,
      }}>
        {label || 'Drop files here or tap to browse'}
      </p>
      <p style={{ color: theme.textDim, fontSize: 11, marginTop: 6 }}>
        {sublabel || 'Files never leave your device'}
      </p>
      {rejectMsg && (
        <p style={{
          color: theme.error, fontSize: 12, fontWeight: 500,
          marginTop: 10, animation: 'fadeUp .2s ease',
        }}>
          {rejectMsg}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// FileChip — File name + size badge
// ══════════════════════════════════════════
export function FileChip({ name, size, index, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 8, padding: '8px 12px',
      animation: 'fadeUp .3s ease forwards',
      animationDelay: `${(index || 0) * 50}ms`,
      opacity: 0,
      flex: 1, minWidth: 0,
    }}>
      {index !== undefined && (
        <span style={{
          color: theme.textDim, fontSize: 11,
          fontFamily: theme.fontMono, minWidth: 16,
          textAlign: 'right',
        }}>{index + 1}</span>
      )}
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 400,
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', color: theme.text,
      }}>{name}</span>
      <span style={{
        color: theme.textMuted, fontSize: 11,
        fontFamily: theme.fontMono, flexShrink: 0,
      }}>{humanSize(size)}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            border: 'none', background: 'none',
            color: theme.textDim, cursor: 'pointer',
            fontSize: 16, lineHeight: 1, padding: '0 2px',
            transition: theme.transitionFast, flexShrink: 0,
          }}
          onMouseEnter={(e) => e.target.style.color = theme.error}
          onMouseLeave={(e) => e.target.style.color = theme.textDim}
        >×</button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// Btn — Primary / Secondary button
// ══════════════════════════════════════════
export function Btn({ children, onClick, disabled, secondary, small, style: extraStyle }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        padding: small ? '7px 16px' : '11px 28px',
        borderRadius: 8,
        border: secondary ? `1px solid ${theme.border}` : 'none',
        background: disabled
          ? theme.border
          : secondary
            ? (hover ? theme.surfaceHover : 'transparent')
            : (hover ? theme.accentHover : theme.accent),
        color: disabled
          ? theme.textDim
          : secondary
            ? theme.text
            : theme.bg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: theme.transition,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════
// Toggle — Segmented control
// ══════════════════════════════════════════
export function Toggle({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2,
      background: theme.surface,
      borderRadius: 8, padding: 3,
      border: `1px solid ${theme.border}`,
    }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 500,
            padding: '6px 16px',
            borderRadius: 6, border: 'none',
            background: value === v ? theme.accentDim : 'transparent',
            color: value === v ? theme.accent : theme.textMuted,
            cursor: 'pointer',
            transition: theme.transitionFast,
            whiteSpace: 'nowrap',
          }}
        >{l}</button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// StatusBadge — Processing / Done / Error
// ══════════════════════════════════════════
export function StatusBadge({ status }) {
  if (!status) return null;

  const isOk = status.includes('✓');
  const isErr = status.toLowerCase().includes('error');
  const isProg = !isOk && !isErr;

  return (
    <span style={{
      fontSize: 12, fontWeight: 500,
      fontFamily: theme.fontMono,
      color: isOk ? theme.success : isErr ? theme.error : theme.accent,
      animation: isProg ? 'pulse 1.2s ease infinite' : 'none',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {isProg && (
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          borderRadius: '50%', background: theme.accent,
          animation: 'pulse 1.2s ease infinite',
        }} />
      )}
      {status}
    </span>
  );
}

// ══════════════════════════════════════════
// NumInput — Labeled number input
// ══════════════════════════════════════════
export function NumInput({ value, onChange, label, suffix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span style={{
          color: theme.textMuted, fontSize: 12,
          fontWeight: 500, minWidth: 20,
        }}>{label}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 88, padding: '7px 10px',
          borderRadius: 6,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          color: theme.text,
          fontSize: 13, fontFamily: theme.fontMono,
          outline: 'none',
          transition: theme.transitionFast,
        }}
        onFocus={(e) => e.target.style.borderColor = theme.accent}
        onBlur={(e) => e.target.style.borderColor = theme.border}
      />
      {suffix && (
        <span style={{ color: theme.textDim, fontSize: 11 }}>{suffix}</span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ArrowButton — Reorder arrows
// ══════════════════════════════════════════
export function ArrowBtn({ direction, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none', background: 'none',
        color: theme.textDim, cursor: 'pointer',
        fontSize: 10, padding: '2px 5px',
        lineHeight: 1, borderRadius: 4,
        transition: theme.transitionFast,
      }}
      onMouseEnter={(e) => {
        e.target.style.color = theme.accent;
        e.target.style.background = theme.accentGlow;
      }}
      onMouseLeave={(e) => {
        e.target.style.color = theme.textDim;
        e.target.style.background = 'none';
      }}
    >
      {direction === 'up' ? '▲' : '▼'}
    </button>
  );
}

// ══════════════════════════════════════════
// EngineIndicator — Shows active engine
// ══════════════════════════════════════════
export function EngineIndicator({ engineInfo }) {
  if (!engineInfo?.ready) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6,
      background: engineInfo.type === 'vips' ? theme.successDim : theme.accentDim,
      border: `1px solid ${engineInfo.type === 'vips' ? 'rgba(90,184,122,0.2)' : 'rgba(201,165,90,0.2)'}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: engineInfo.type === 'vips' ? theme.success : theme.accent,
      }} />
      <span style={{
        fontSize: 10, fontWeight: 500,
        fontFamily: theme.fontMono,
        color: engineInfo.type === 'vips' ? theme.success : theme.accent,
        letterSpacing: '0.04em',
      }}>
        {engineInfo.label} · {engineInfo.qualityLabel}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════
// UsageCounter — Shows remaining free ops
// ══════════════════════════════════════════
export function UsageCounter({ usageInfo }) {
  if (!usageInfo || usageInfo.isPro) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 6,
      background: usageInfo.remaining <= 1 ? theme.errorDim : theme.accentDim,
      border: `1px solid ${usageInfo.remaining <= 1 ? 'rgba(201,90,90,0.2)' : 'rgba(201,165,90,0.2)'}`,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 500,
        fontFamily: theme.fontMono,
        color: usageInfo.remaining <= 1 ? theme.error : theme.accent,
        letterSpacing: '0.04em',
      }}>
        {usageInfo.remaining}/{usageInfo.total} free today
      </span>
    </div>
  );
}

// ══════════════════════════════════════════
// ProBadge — Shows pro status in header
// ══════════════════════════════════════════
export function ProBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 20,
      background: 'rgba(201,165,90,0.15)',
      border: '1px solid rgba(201,165,90,0.25)',
    }}>
      <span style={{
        color: theme.success, fontSize: 12, lineHeight: 1,
      }}>✓</span>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: theme.accent,
        letterSpacing: '0.04em',
      }}>
        PRO
      </span>
    </div>
  );
}

// ══════════════════════════════════════════
// UpgradeButton — Persistent header CTA
// ══════════════════════════════════════════
export function UpgradeButton({ onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        fontSize: 12, fontWeight: 600,
        padding: '7px 16px',
        borderRadius: 20,
        border: 'none',
        background: hover ? theme.accentHover : theme.accent,
        color: theme.bg,
        cursor: 'pointer',
        transition: theme.transition,
        letterSpacing: '0.02em',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      Go Pro — $6.99
    </button>
  );
}

// ══════════════════════════════════════════
// PricingSection — Free vs Pro comparison
// ══════════════════════════════════════════
export function PricingSection({ onUpgrade }) {
  const [hoverPro, setHoverPro] = useState(false);

  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600,
        color: theme.textMuted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Pricing
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
      }}>
        {/* Free tier */}
        <div style={{
          padding: '24px 20px',
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: theme.text,
              marginBottom: 4,
            }}>Free</div>
            <div style={{
              fontSize: 28, fontWeight: 700, color: theme.text,
            }}>
              $0
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              '5 operations per day',
              'All tools included',
              '100% private processing',
            ].map((text) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: theme.textMuted,
              }}>
                <span style={{ color: theme.success, fontSize: 13 }}>✓</span>
                {text}
              </div>
            ))}
          </div>

          <div style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            textAlign: 'center',
            fontSize: 13, fontWeight: 500,
            color: theme.textMuted,
          }}>
            Current plan
          </div>
        </div>

        {/* Pro tier */}
        <div style={{
          padding: '24px 20px',
          borderRadius: theme.radius,
          border: `1px solid rgba(201,165,90,0.3)`,
          background: theme.accentGlow,
          display: 'flex', flexDirection: 'column', gap: 16,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -1, right: 16,
            background: theme.accent,
            color: theme.bg,
            fontSize: 10, fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '0 0 6px 6px',
            letterSpacing: '0.04em',
          }}>
            BEST VALUE
          </div>

          <div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: theme.accent,
              marginBottom: 4,
            }}>Pro</div>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6,
            }}>
              <span style={{
                fontSize: 28, fontWeight: 700, color: theme.text,
              }}>$6.99</span>
              <span style={{
                fontSize: 12, color: theme.textMuted,
              }}>one-time</span>
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              'Unlimited operations, forever',
              'All current & future tools',
              '100% private processing',
              'Support independent development',
            ].map((text) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: theme.textMuted,
              }}>
                <span style={{ color: theme.success, fontSize: 13 }}>✓</span>
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={onUpgrade}
            onMouseEnter={() => setHoverPro(true)}
            onMouseLeave={() => setHoverPro(false)}
            style={{
              fontFamily: theme.font,
              fontSize: 14, fontWeight: 700,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: hoverPro ? theme.accentHover : theme.accent,
              color: theme.bg,
              cursor: 'pointer',
              transition: theme.transition,
              letterSpacing: '0.02em',
            }}
          >
            Unlock Pro
          </button>

          <div style={{
            fontSize: 11, color: theme.textDim,
            textAlign: 'center',
          }}>
            One-time payment. No subscriptions. No recurring fees.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PaywallModal — Shown when free limit hit
// ══════════════════════════════════════════
export function PaywallModal({ onClose, limitReached }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusLg,
          padding: '36px 32px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          animation: 'slideUp .3s ease',
        }}
      >
        <div style={{
          fontSize: 36, marginBottom: 16, opacity: 0.8,
        }}>
          ◈
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 700,
          color: theme.text,
          marginBottom: 8,
        }}>
          {limitReached ? 'Daily limit reached' : 'Go Pro'}
        </h2>

        <p style={{
          fontSize: 13, color: theme.textMuted,
          lineHeight: 1.6, marginBottom: 24,
        }}>
          {limitReached
            ? "You've used all 5 free operations for today. Unlock unlimited access — forever."
            : 'Get unlimited access to all tools — one payment, yours forever.'}
        </p>

        <div style={{
          background: theme.accentGlow,
          border: `1px solid ${theme.accentDim}`,
          borderRadius: theme.radius,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 32, fontWeight: 700,
            color: theme.accent,
            marginBottom: 4,
          }}>
            $6.99
          </div>
          <div style={{
            fontSize: 12, color: theme.textMuted,
            fontWeight: 500,
          }}>
            One-time payment · Lifetime access
          </div>
        </div>

        <div style={{
          textAlign: 'left', marginBottom: 24,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {['Unlimited operations, forever', 'All current & future tools', 'Support independent development'].map((text) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: theme.textMuted,
            }}>
              <span style={{ color: theme.success, fontSize: 14 }}>✓</span>
              {text}
            </div>
          ))}
        </div>

        <button
          onClick={() => window.open(STRIPE_CHECKOUT_URL, '_blank')}
          style={{
            fontFamily: theme.font,
            fontSize: 15, fontWeight: 700,
            padding: '14px 32px',
            borderRadius: 10,
            border: 'none',
            background: theme.accent,
            color: theme.bg,
            cursor: 'pointer',
            width: '100%',
            letterSpacing: '0.02em',
            transition: theme.transition,
          }}
          onMouseEnter={(e) => e.target.style.background = theme.accentHover}
          onMouseLeave={(e) => e.target.style.background = theme.accent}
        >
          Unlock Unlimited
        </button>

        <button
          onClick={onClose}
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 400,
            color: theme.textDim,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginTop: 16,
            padding: '4px 8px',
            transition: theme.transitionFast,
          }}
          onMouseEnter={(e) => e.target.style.color = theme.textMuted}
          onMouseLeave={(e) => e.target.style.color = theme.textDim}
        >
          {limitReached ? 'Continue tomorrow for free' : 'Maybe later'}
        </button>
      </div>
    </div>
  );
}
