import { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { theme, globalStyles } from './lib/theme';
import { initEngine, getEngineInfo, destroyEngine } from './lib/imageEngine';
import { checkStripeRedirect, isPro, canUseOperation, recordOperation, getUsageInfo, getLicenseKey } from './lib/usageGate';
import { EngineIndicator, UsageCounter, ProBadge, PaywallModal, UpgradeButton, RestoreModal, LicenseKeyDisplay } from './components/ui';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [mounted, setMounted] = useState(false);
  const [engineInfo, setEngineInfo] = useState(null);
  const [proUser, setProUser] = useState(isPro);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallLimitReached, setPaywallLimitReached] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [usageInfo, setUsageInfo] = useState(getUsageInfo);

  useEffect(() => {
    setMounted(true);
    // Handle Stripe redirect
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (checkStripeRedirect()) {
      setProUser(true);
      setUsageInfo(getUsageInfo());
      if (sessionId) {
        setLicenseKey(sessionId);
        setShowLicenseKey(true);
      }
    }
    initEngine(true).then((info) => {
      setEngineInfo(info);
    }).catch((err) => {
      console.error('[AcornTools] Engine init failed:', err);
    });
    return () => { destroyEngine(); };
  }, []);

  const handleBeforeProcess = useCallback(() => {
    if (canUseOperation()) return true;
    setPaywallLimitReached(true);
    setShowPaywall(true);
    return false;
  }, []);

  const handleOperationComplete = useCallback(() => {
    recordOperation();
    setUsageInfo(getUsageInfo());
  }, []);

  const handleShowPaywall = useCallback(() => {
    setPaywallLimitReached(false);
    setShowPaywall(true);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: theme.bg,
      padding: '0 16px 40px',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)',
      fontFamily: theme.font,
      color: theme.text,
    }}>
      <style>{globalStyles}</style>

      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all .5s ease',
      }}>
        {/* ── Header ── */}
        <header style={{
          padding: '36px 0 28px',
          borderBottom: `1px solid ${theme.border}`,
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap',
            gap: 12,
          }}>
            <Link
              to="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: theme.accentDim,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18, color: theme.accent,
              }}>◈</div>
              <span style={{
                fontSize: 24, fontWeight: 700,
                letterSpacing: '-0.03em',
                background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Acorn Tools
              </span>
            </Link>

            {proUser ? <ProBadge /> : <UpgradeButton onClick={handleShowPaywall} />}
          </div>

          {isHome && (
            <p style={{
              fontSize: 14, color: theme.textMuted,
              fontWeight: 400, lineHeight: 1.5,
              marginTop: 10,
            }}>
              Private PDF & image tools — nothing leaves your device. Compress, convert, resize, crop, merge — all offline.
            </p>
          )}

          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 10, marginTop: 14, flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: theme.accentGlow,
              border: `1px solid ${theme.accentDim}`,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: theme.success,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: theme.accent, letterSpacing: '0.04em',
              }}>
                OFFLINE · ZERO UPLOAD · DEVICE-ONLY
              </span>
            </div>

            {engineInfo && (
              <EngineIndicator engineInfo={{
                ...engineInfo,
                type: engineInfo.engine,
                label: engineInfo.engine === 'vips' ? 'libvips (WASM)' : 'Pica (Lanczos3)',
                qualityLabel: engineInfo.quality === 'maximum' ? 'Maximum' : 'High',
                ready: true,
              }} />
            )}

            {!proUser && <UsageCounter usageInfo={usageInfo} />}
          </div>
        </header>

        {/* ── Route content ── */}
        <Outlet context={{
          onBeforeProcess: handleBeforeProcess,
          onOperationComplete: handleOperationComplete,
          proUser,
          onShowPaywall: handleShowPaywall,
        }} />

        {showPaywall && (
          <PaywallModal limitReached={paywallLimitReached} onRestore={() => {
            setShowPaywall(false);
            setShowRestore(true);
          }} onClose={() => {
            setShowPaywall(false);
            if (isPro()) {
              setProUser(true);
              setUsageInfo(getUsageInfo());
            }
          }} />
        )}

        {showRestore && (
          <RestoreModal
            onClose={() => setShowRestore(false)}
            onRestored={() => {
              setShowRestore(false);
              setProUser(true);
              setUsageInfo(getUsageInfo());
            }}
          />
        )}

        {showLicenseKey && licenseKey && (
          <LicenseKeyDisplay
            licenseKey={licenseKey}
            onClose={() => setShowLicenseKey(false)}
          />
        )}

        {/* ── Footer ── */}
        <footer style={{
          marginTop: 40,
          borderTop: `1px solid ${theme.border}`,
          padding: '32px 0 0',
        }}>
          {/* Self-host callout */}
          <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            padding: '24px 20px',
            marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: theme.accentDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill={theme.accent}>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: theme.text, marginBottom: 4,
              }}>
                100% open source — self-host or run locally
              </div>
              <div style={{
                fontSize: 12, color: theme.textMuted,
                lineHeight: 1.5,
              }}>
                Don't trust us? You don't have to. Clone the repo and run it yourself — <code style={{
                  fontFamily: theme.fontMono, fontSize: 11,
                  background: theme.accentDim, padding: '2px 6px',
                  borderRadius: 4, color: theme.accent,
                }}>npm install && npm run dev</code>
              </div>
            </div>
            <a
              href="https://github.com/cybermax-008/Acorn-tools"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: theme.font,
                fontSize: 12, fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                textDecoration: 'none',
                transition: theme.transition,
                whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.text; }}
            >
              View on GitHub
            </a>
          </div>

          {/* Bottom links */}
          <div style={{
            textAlign: 'center',
            display: 'flex', flexDirection: 'column',
            gap: 6, alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: theme.textMuted }}>
              Acorn Tools — No servers. No tracking. No cookies. Just your files.
            </span>
            <span style={{ fontSize: 11, color: theme.textDim }}>
              Powered by {engineInfo?.engine === 'vips' ? 'libvips' : 'Lanczos3'} resampling · pdf-lib · pdfjs · Web Workers
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              marginTop: 6, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <a
                href="https://github.com/cybermax-008/Acorn-tools/issues/new?labels=feedback&title=Feedback:+&body=Tell+us+what+you+think!"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme.textMuted,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  transition: theme.transition,
                  fontSize: 11,
                }}
                onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Send Feedback
              </a>
              {!proUser && (
                <>
                  <span style={{ color: theme.textDim }}>·</span>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setShowRestore(true); }}
                    style={{
                      color: theme.textMuted,
                      textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      transition: theme.transition,
                      fontSize: 11,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                    onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                  >
                    Restore Purchase
                  </a>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
