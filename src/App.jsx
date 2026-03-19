import { useState, useEffect, useCallback } from 'react';
import { theme, globalStyles } from './lib/theme';
import { initEngine, getEngineInfo, destroyEngine } from './lib/imageEngine';
import { checkStripeRedirect, isPro, canUseOperation, recordOperation, getUsageInfo, getLicenseKey } from './lib/usageGate';
import ResizeTab from './components/ResizeTab';
import CompressTab from './components/CompressTab';
import ConvertTab from './components/ConvertTab';
import CropTab from './components/CropTab';
import ImgToPdfTab from './components/ImgToPdfTab';
import PdfToImageTab from './components/PdfToImageTab';
import PdfToolsTab from './components/PdfToolsTab';
import MetadataStripTab from './components/MetadataStripTab';
import PdfPageOrganizerTab from './components/PdfPageOrganizerTab';
import { EngineIndicator, UsageCounter, ProBadge, PaywallModal, UpgradeButton, PricingSection, RestoreModal, LicenseKeyDisplay } from './components/ui';

const TOOLS = [
  {
    section: 'Image Tools',
    items: [
      { id: 'resize',   icon: '⤡', label: 'Resize',          desc: 'Scale images to exact dimensions or presets' },
      { id: 'compress', icon: '▼', label: 'Compress',        desc: 'Reduce file size with quality control' },
      { id: 'convert',  icon: '⇄', label: 'Convert Format',  desc: 'PNG to JPG, WebP to PNG, and more' },
      { id: 'crop',     icon: '⬒', label: 'Crop',            desc: 'Select and export a region of an image' },
      { id: 'metadata', icon: '⊘', label: 'Strip Metadata',  desc: 'Remove GPS, device info, timestamps from images' },
    ],
  },
  {
    section: 'PDF Tools',
    items: [
      { id: 'img2pdf',  icon: '▤', label: 'Image → PDF',     desc: 'Combine images into a single PDF document' },
      { id: 'pdf2img',  icon: '▥', label: 'PDF → Image',     desc: 'Convert PDF pages to JPEG or PNG' },
      { id: 'pdfcompress', icon: '▼', label: 'Compress PDF', desc: 'Reduce PDF file size' },
      { id: 'pdftools', icon: '⊞', label: 'PDF Toolkit',     desc: 'Merge, split, rotate, watermark, page numbers' },
      { id: 'pdforganize', icon: '⊞', label: 'Organize Pages', desc: 'Reorder, delete, and insert PDF pages' },
    ],
  },
];

const TOOL_MAP = Object.fromEntries(
  TOOLS.flatMap(s => s.items.map(t => [t.id, t]))
);

export default function App() {
  const [activeTool, setActiveTool] = useState(null);
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

  const tool = TOOL_MAP[activeTool];

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
            <div
              onClick={() => setActiveTool(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: theme.accentDim,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18, color: theme.accent,
              }}>◈</div>
              <h1 style={{
                fontSize: 24, fontWeight: 700,
                letterSpacing: '-0.03em',
                background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Acorn Tools
              </h1>
            </div>

            {proUser ? <ProBadge /> : <UpgradeButton onClick={() => { setPaywallLimitReached(false); setShowPaywall(true); }} />}
          </div>

          {!activeTool && (
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

        {/* ── Tool picker (home) ── */}
        {!activeTool && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {TOOLS.map((section) => (
              <div key={section.section}>
                <h2 style={{
                  fontSize: 12, fontWeight: 600,
                  color: theme.textMuted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  {section.section}
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: 10,
                }}>
                  {section.items.map((t) => (
                    <ToolCard key={t.id} tool={t} onClick={() => setActiveTool(t.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pricing section (home only, free users only) ── */}
        {!activeTool && !proUser && (
          <PricingSection onUpgrade={() => { setPaywallLimitReached(false); setShowPaywall(true); }} />
        )}

        {/* ── Active tool ── */}
        {activeTool && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16,
            }}>
              <button
                onClick={() => setActiveTool(null)}
                style={{
                  fontFamily: theme.font,
                  fontSize: 12, fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  transition: theme.transition,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>←</span> All Tools
              </button>
              {tool && (
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: theme.text,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: theme.accent }}>{tool.icon}</span>
                  {tool.label}
                </span>
              )}
            </div>

            <main style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusLg,
              padding: '28px 24px',
            }}>
              {activeTool === 'resize' && <ResizeTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'compress' && <CompressTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'convert' && <ConvertTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'crop' && <CropTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'img2pdf' && <ImgToPdfTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'pdf2img' && <PdfToImageTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'pdfcompress' && <PdfToolsTab defaultMode="compress" onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'pdftools' && <PdfToolsTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'metadata' && <MetadataStripTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
              {activeTool === 'pdforganize' && <PdfPageOrganizerTab onBeforeProcess={handleBeforeProcess} onOperationComplete={handleOperationComplete} />}
            </main>
          </>
        )}

        {showPaywall && (
          <PaywallModal limitReached={paywallLimitReached} onRestore={() => {
            setShowPaywall(false);
            setShowRestore(true);
          }} onClose={() => {
            setShowPaywall(false);
            // Re-check in case user completed payment in another tab
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
          textAlign: 'center', padding: '24px 0 0',
          fontSize: 11, color: theme.textDim,
          display: 'flex', flexDirection: 'column',
          gap: 4, alignItems: 'center',
        }}>
          <span>
            Powered by {engineInfo?.engine === 'vips' ? 'libvips' : 'Lanczos3'} resampling · pdf-lib · pdfjs · Web Workers
          </span>
          <span>Acorn Tools — No servers. No tracking. No cookies. Just your files.</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginTop: 4,
          }}>
            <a
              href="https://github.com/cybermax-008/Acorn-tools"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.textMuted,
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: theme.transition,
              }}
              onMouseEnter={e => e.currentTarget.style.color = theme.accent}
              onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Open Source on GitHub
            </a>
            <span style={{ color: theme.textDim }}>·</span>
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
        </footer>
      </div>
    </div>
  );
}

function ToolCard({ tool, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        textAlign: 'left',
        padding: '18px 16px',
        borderRadius: theme.radius,
        border: `1px solid ${hover ? theme.borderActive : theme.border}`,
        background: hover ? theme.surfaceHover : theme.surface,
        cursor: 'pointer',
        transition: theme.transition,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontSize: 18,
          color: theme.accent,
          lineHeight: 1,
          width: 24, textAlign: 'center',
        }}>{tool.icon}</span>
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: theme.text,
        }}>{tool.label}</span>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 400,
        color: theme.textMuted,
        lineHeight: 1.4,
        paddingLeft: 34,
      }}>{tool.desc}</span>
    </button>
  );
}
