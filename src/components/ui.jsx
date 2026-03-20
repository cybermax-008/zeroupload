import { useState, useRef } from 'react';
import { theme } from '../lib/theme';
import { humanSize } from '../lib/fileUtils';
import { STRIPE_CHECKOUT_URL, verifyLicenseKey } from '../lib/usageGate';

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
    <div role="radiogroup" style={{
      display: 'flex', gap: 2,
      background: theme.surface,
      borderRadius: 8, padding: 3,
      border: `1px solid ${theme.border}`,
    }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 500,
            padding: '8px 16px',
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
export function NumInput({ value, onChange, label, suffix, min }) {
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
        min={min ?? 0}
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
      border: `1px solid ${engineInfo.type === 'vips' ? theme.successDim : theme.accentDim}`,
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
    <div
      title={`${usageInfo.remaining} of ${usageInfo.total} free operations remaining today. Resets at midnight. Go Pro for unlimited.`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 6,
        background: usageInfo.remaining <= 1 ? theme.errorDim : theme.accentDim,
        border: `1px solid ${usageInfo.remaining <= 1 ? theme.errorDim : theme.accentDim}`,
        cursor: 'help',
      }}
    >
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
      background: theme.accentDim,
      border: `1px solid ${theme.accentDim}`,
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
          border: `1px solid ${theme.accentDim}`,
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
export function PaywallModal({ onClose, limitReached, onRestore }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: theme.overlay,
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

        <button
          onClick={onRestore}
          style={{
            fontFamily: theme.font,
            fontSize: 12, fontWeight: 500,
            color: theme.accent,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
            padding: '4px 8px',
            transition: theme.transitionFast,
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Already purchased? Restore license
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// RestoreModal — Enter license key
// ══════════════════════════════════════════
export function RestoreModal({ onClose, onRestored }) {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(''); // '' | 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    if (!key.trim()) return;
    setStatus('verifying');
    setErrorMsg('');

    const result = await verifyLicenseKey(key);
    if (result.valid) {
      setStatus('success');
      setTimeout(() => onRestored(), 1200);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Invalid license key');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: theme.overlay,
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
          padding: '32px 28px',
          maxWidth: 400,
          width: '100%',
          animation: 'slideUp .3s ease',
        }}
      >
        <h2 style={{
          fontSize: 18, fontWeight: 700,
          color: theme.text,
          marginBottom: 6,
        }}>
          Restore Purchase
        </h2>

        <p style={{
          fontSize: 13, color: theme.textMuted,
          lineHeight: 1.5, marginBottom: 20,
        }}>
          Enter the license key from your purchase confirmation email.
        </p>

        <input
          type="text"
          value={key}
          onChange={(e) => { setKey(e.target.value); setStatus(''); setErrorMsg(''); }}
          placeholder="Paste your license key"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${status === 'error' ? theme.error : theme.border}`,
            background: theme.bg,
            color: theme.text,
            fontSize: 13,
            fontFamily: theme.fontMono,
            outline: 'none',
            transition: theme.transitionFast,
            marginBottom: 8,
          }}
          onFocus={(e) => { if (status !== 'error') e.target.style.borderColor = theme.accent; }}
          onBlur={(e) => { if (status !== 'error') e.target.style.borderColor = theme.border; }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
        />

        {errorMsg && (
          <p style={{
            fontSize: 12, color: theme.error,
            marginBottom: 8,
          }}>
            {errorMsg}
          </p>
        )}

        {status === 'success' && (
          <p style={{
            fontSize: 12, color: theme.success,
            fontWeight: 500, marginBottom: 8,
          }}>
            License verified! Pro unlocked.
          </p>
        )}

        <div style={{
          display: 'flex', gap: 8, marginTop: 12,
        }}>
          <button
            onClick={handleVerify}
            disabled={!key.trim() || status === 'verifying' || status === 'success'}
            style={{
              fontFamily: theme.font,
              fontSize: 13, fontWeight: 600,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: (!key.trim() || status === 'verifying' || status === 'success')
                ? theme.border : theme.accent,
              color: (!key.trim() || status === 'verifying' || status === 'success')
                ? theme.textDim : theme.bg,
              cursor: (!key.trim() || status === 'verifying' || status === 'success')
                ? 'not-allowed' : 'pointer',
              transition: theme.transition,
              flex: 1,
            }}
          >
            {status === 'verifying' ? 'Verifying…' : status === 'success' ? 'Verified ✓' : 'Verify'}
          </button>

          <button
            onClick={onClose}
            style={{
              fontFamily: theme.font,
              fontSize: 13, fontWeight: 500,
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.textMuted,
              cursor: 'pointer',
              transition: theme.transition,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// LicenseKeyDisplay — Shown after payment
// ══════════════════════════════════════════
export function LicenseKeyDisplay({ licenseKey, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = licenseKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: theme.overlay,
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
          padding: '32px 28px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          animation: 'slideUp .3s ease',
        }}
      >
        <div style={{
          fontSize: 36, marginBottom: 12,
          color: theme.success,
        }}>
          ✓
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 700,
          color: theme.text,
          marginBottom: 6,
        }}>
          Welcome to Pro!
        </h2>

        <p style={{
          fontSize: 13, color: theme.textMuted,
          lineHeight: 1.5, marginBottom: 20,
        }}>
          Save your license key — use it to restore Pro on any device or browser.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 16,
        }}>
          <code style={{
            flex: 1,
            fontSize: 11,
            fontFamily: theme.fontMono,
            color: theme.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}>
            {licenseKey}
          </code>

          <button
            onClick={handleCopy}
            style={{
              fontFamily: theme.font,
              fontSize: 11, fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 5,
              border: `1px solid ${theme.border}`,
              background: copied ? theme.successDim : 'transparent',
              color: copied ? theme.success : theme.textMuted,
              cursor: 'pointer',
              transition: theme.transitionFast,
              flexShrink: 0,
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p style={{
          fontSize: 11, color: theme.textDim,
          lineHeight: 1.5, marginBottom: 20,
        }}>
          This key is also in your Stripe receipt email.
        </p>

        <button
          onClick={onClose}
          style={{
            fontFamily: theme.font,
            fontSize: 14, fontWeight: 600,
            padding: '11px 28px',
            borderRadius: 8,
            border: 'none',
            background: theme.accent,
            color: theme.bg,
            cursor: 'pointer',
            width: '100%',
            transition: theme.transition,
          }}
          onMouseEnter={(e) => e.target.style.background = theme.accentHover}
          onMouseLeave={(e) => e.target.style.background = theme.accent}
        >
          Start using Pro
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// BatchFileList — List of files in a batch
// ══════════════════════════════════════════
export function BatchFileList({ items, onRemove, onDownload, disabled }) {
  const statusColor = (s) =>
    s === 'done' ? theme.success :
    s === 'error' ? theme.error :
    s === 'processing' ? theme.accent :
    theme.textDim;

  const statusLabel = (item) => {
    if (item.status === 'pending') return 'Pending';
    if (item.status === 'processing') return 'Processing…';
    if (item.status === 'done') {
      const reduction = item.result?.blob
        ? Math.round((1 - item.result.blob.size / item.file.size) * 100)
        : null;
      const sizeStr = item.result?.blob ? humanSize(item.result.blob.size) : '';
      return reduction !== null && reduction > 0
        ? `Done · ${sizeStr} (−${reduction}%)`
        : `Done${sizeStr ? ` · ${sizeStr}` : ''}`;
    }
    if (item.status === 'error') return item.error || 'Failed';
    return '';
  };

  return (
    <div style={{
      maxHeight: 400, overflowY: 'auto',
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius,
    }}>
      {items.map((item, i) => (
        <div
          key={item.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px',
            borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : 'none',
            background: item.status === 'processing' ? theme.accentGlow : 'transparent',
          }}
        >
          <span style={{
            flex: 1, fontSize: 12, fontWeight: 400,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', color: theme.text,
            opacity: item.status === 'pending' ? 0.5 : 1,
          }}>
            {item.file.name}
          </span>

          <span style={{
            fontSize: 11, fontFamily: theme.fontMono,
            color: theme.textDim, flexShrink: 0,
          }}>
            {humanSize(item.file.size)}
          </span>

          <span style={{
            fontSize: 11, fontWeight: 500,
            color: statusColor(item.status),
            flexShrink: 0, minWidth: 80, textAlign: 'right',
            animation: item.status === 'processing' ? 'pulse 1.2s ease infinite' : 'none',
          }}>
            {statusLabel(item)}
          </span>

          {item.status === 'done' && item.result && (
            <button
              onClick={() => onDownload(item)}
              style={{
                border: 'none', background: 'none',
                color: theme.accent, cursor: 'pointer',
                fontSize: 11, fontWeight: 600, padding: '2px 6px',
                flexShrink: 0,
              }}
            >
              Save
            </button>
          )}

          {!disabled && (
            <button
              onClick={() => onRemove(item.id)}
              style={{
                border: 'none', background: 'none',
                color: theme.textDim, cursor: 'pointer',
                fontSize: 14, lineHeight: 1, padding: '0 2px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.target.style.color = theme.error}
              onMouseLeave={(e) => e.target.style.color = theme.textDim}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// BatchProgress — Progress bar + cancel
// ══════════════════════════════════════════
export function BatchProgress({ progress, processing, onCancel }) {
  if (!processing && progress.done === 0) return null;
  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        height: 6, borderRadius: 3,
        background: theme.border, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: theme.accent,
          width: `${pct}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted,
        }}>
          {processing
            ? `Processing ${progress.done + 1} of ${progress.total}…`
            : `${progress.done} of ${progress.total} complete`}
        </span>
        {processing && (
          <button
            onClick={onCancel}
            style={{
              fontFamily: theme.font,
              fontSize: 11, fontWeight: 500,
              padding: '4px 12px', borderRadius: 6,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.textMuted,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// BatchDownloadAll — Download all results
// ══════════════════════════════════════════
export function BatchDownloadAll({ count, onClick }) {
  if (count === 0) return null;

  return (
    <Btn onClick={onClick}>
      Download All ({count} files)
    </Btn>
  );
}
