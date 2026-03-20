import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useOutletContext } from 'react-router-dom';
import { theme } from '../lib/theme';
import { BASE_URL } from '../lib/routes';
import { PricingSection } from './ui';

const TOOLS = [
  {
    section: 'Image Tools',
    items: [
      { path: '/resize-image',   icon: '⤡', label: 'Resize',          desc: 'Scale images to exact dimensions or presets' },
      { path: '/compress-image', icon: '▼', label: 'Compress',        desc: 'Reduce file size with quality control' },
      { path: '/convert-image',  icon: '⇄', label: 'Convert Format',  desc: 'PNG to JPG, WebP to PNG, and more' },
      { path: '/crop-image',     icon: '⬒', label: 'Crop',            desc: 'Select and export a region of an image' },
      { path: '/strip-metadata', icon: '⊘', label: 'Strip Metadata',  desc: 'Remove GPS, device info, timestamps from images' },
    ],
  },
  {
    section: 'PDF Tools',
    items: [
      { path: '/image-to-pdf',      icon: '▤', label: 'Image → PDF',       desc: 'Combine images into a single PDF document' },
      { path: '/pdf-to-image',      icon: '▥', label: 'PDF → Image',       desc: 'Convert PDF pages to JPEG or PNG' },
      { path: '/compress-pdf',      icon: '▼', label: 'Compress PDF',      desc: 'Reduce PDF file size' },
      { path: '/merge-pdf',         icon: '⊕', label: 'Merge PDFs',        desc: 'Combine multiple PDFs into one document' },
      { path: '/split-pdf',         icon: '⊖', label: 'Split PDF',         desc: 'Extract pages or split into separate files' },
      { path: '/rotate-pdf',        icon: '↻', label: 'Rotate PDF',        desc: 'Rotate pages 90°, 180°, or 270°' },
      { path: '/watermark-pdf',     icon: '◈', label: 'Watermark PDF',     desc: 'Add text watermarks to PDF documents' },
      { path: '/pdf-page-numbers',  icon: '#', label: 'Page Numbers',      desc: 'Add page numbers to PDF documents' },
      { path: '/redact-pdf',        icon: '█', label: 'Redact PDF',        desc: 'Permanently remove sensitive content' },
      { path: '/pdf-pages',         icon: '⊞', label: 'Organize Pages',    desc: 'Reorder, delete, and insert PDF pages' },
    ],
  },
];

export default function HomePage() {
  const { proUser, onShowPaywall } = useOutletContext();

  return (
    <>
      <Helmet>
        <title>Acorn Tools — Free Private PDF & Image Tools</title>
        <meta name="description" content="Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device. No sign-up required." />
        <link rel="canonical" href={BASE_URL + '/'} />
        <meta property="og:title" content="Acorn Tools — Private PDF & Image Tools" />
        <meta property="og:description" content="Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device." />
        <meta property="og:url" content={BASE_URL + '/'} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${BASE_URL}/social-preview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Acorn Tools — Free Private PDF & Image Tools" />
        <meta name="twitter:description" content="Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device." />
        <script type="application/ld+json">{JSON.stringify([
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Acorn Tools',
            url: BASE_URL,
            description: 'Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device.',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any (browser-based)',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            publisher: { '@type': 'Organization', name: 'Acorn Tools', url: BASE_URL },
            featureList: 'Resize images, Compress images, Convert image formats, Crop images, Strip metadata, Image to PDF, PDF to image, Compress PDF, Merge PDFs, Split PDF, Rotate PDF, Watermark PDF, Page numbers, Redact PDF, Organize PDF pages',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Acorn Tools',
            url: BASE_URL,
            logo: `${BASE_URL}/favicon.svg`,
            description: 'Privacy-first PDF and image tools that run entirely in your browser.',
          },
        ])}</script>
      </Helmet>

      {/* ── Tool grid ── */}
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
                <ToolCard key={t.path} tool={t} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Privacy comparison ── */}
      <PrivacyComparison />

      {/* ── Trust signals ── */}
      <TrustSignals />

      {/* ── Pricing ── */}
      {!proUser && (
        <PricingSection onUpgrade={onShowPaywall} />
      )}
    </>
  );
}

// ══════════════════════════════════════════
// PrivacyComparison — The core differentiator
// ══════════════════════════════════════════
function PrivacyComparison() {
  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700,
        color: theme.text,
        textAlign: 'center',
        marginBottom: 6,
      }}>
        Why does it matter where your files go?
      </h2>
      <p style={{
        fontSize: 13, color: theme.textMuted,
        textAlign: 'center',
        lineHeight: 1.5,
        marginBottom: 24,
        maxWidth: 520,
        margin: '0 auto 24px',
      }}>
        Most online tools upload your documents to their servers. Acorn Tools processes everything right in your browser.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
      }}>
        {/* Other tools */}
        <div style={{
          padding: '24px 20px',
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: theme.error,
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: theme.errorDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>!</span>
            Typical online tools
          </div>

          <FlowDiagram steps={[
            { label: 'You select a file', icon: '1' },
            { label: 'Uploaded to their server', icon: '2', highlight: 'error' },
            { label: 'Processed on their machine', icon: '3', highlight: 'error' },
            { label: 'You download the result', icon: '4' },
          ]} />

          <div style={{
            marginTop: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              'Your files sit on someone else\'s server',
              'No control over who can access them',
              'Often requires sign-up or email',
              'May violate HIPAA, GDPR, or NDA terms',
            ].map((text) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12, color: theme.textMuted, lineHeight: 1.4,
              }}>
                <span style={{ color: theme.error, fontSize: 11, marginTop: 1, flexShrink: 0 }}>✕</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Acorn Tools */}
        <div style={{
          padding: '24px 20px',
          borderRadius: theme.radius,
          border: `1px solid ${theme.successDim}`,
          background: theme.successDim,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: theme.success,
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: theme.successDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>◈</span>
            Acorn Tools
          </div>

          <FlowDiagram steps={[
            { label: 'You select a file', icon: '1' },
            { label: 'Processed in your browser', icon: '2', highlight: 'success' },
            { label: 'Result saved to your device', icon: '3', highlight: 'success' },
          ]} success />

          <div style={{
            marginTop: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {[
              'Files never leave your device',
              'Works offline — no internet needed',
              'No sign-up, no email, no tracking',
              'HIPAA & GDPR friendly by design',
            ].map((text) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12, color: theme.textMuted, lineHeight: 1.4,
              }}>
                <span style={{ color: theme.success, fontSize: 12, marginTop: 0, flexShrink: 0 }}>✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FlowDiagram — Visual step flow
// ══════════════════════════════════════════
function FlowDiagram({ steps, success }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {steps.map((step, i) => (
        <div key={i}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              fontFamily: theme.fontMono,
              background: step.highlight === 'error'
                ? theme.errorDim
                : step.highlight === 'success'
                  ? theme.successDim
                  : theme.accentDim,
              color: step.highlight === 'error'
                ? theme.error
                : step.highlight === 'success'
                  ? theme.success
                  : theme.textMuted,
              flexShrink: 0,
            }}>
              {step.icon}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: step.highlight === 'error'
                ? theme.error
                : step.highlight === 'success'
                  ? theme.success
                  : theme.text,
            }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 1, height: 12,
              marginLeft: 12,
              background: step.highlight === 'error'
                ? theme.errorDim
                : success
                  ? theme.successDim
                  : theme.border,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// TrustSignals — Audience-specific callouts
// ══════════════════════════════════════════
function TrustSignals() {
  const signals = [
    {
      icon: '⚖',
      title: 'Legal & Law Firms',
      text: 'Client contracts and court filings stay on your machine. No third-party data processing agreements needed.',
    },
    {
      icon: '🏥',
      title: 'Healthcare',
      text: 'Process documents with PHI without uploading to external servers. Supports HIPAA compliance requirements.',
    },
    {
      icon: '🏦',
      title: 'Finance & Banking',
      text: 'Handle sensitive financial documents locally. No risk of data exposure through third-party services.',
    },
  ];

  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600,
        color: theme.textMuted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 12,
        textAlign: 'center',
      }}>
        Trusted by privacy-conscious professionals
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {signals.map((s) => (
          <div key={s.title} style={{
            padding: '20px 16px',
            borderRadius: theme.radius,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
          }}>
            <div style={{
              fontSize: 20, marginBottom: 8,
            }}>{s.icon}</div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: theme.text,
              marginBottom: 6,
            }}>{s.title}</div>
            <div style={{
              fontSize: 12, color: theme.textMuted,
              lineHeight: 1.5,
            }}>{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ToolCard
// ══════════════════════════════════════════
function ToolCard({ tool }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={tool.path}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: theme.font,
        textAlign: 'left',
        textDecoration: 'none',
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
    </Link>
  );
}
