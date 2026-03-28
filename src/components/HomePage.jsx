import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { theme } from '../lib/theme';
import { BASE_URL } from '../lib/routes';

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
      { path: '/edit-pdf',          icon: '✎', label: 'Edit PDF',          desc: 'Add text, images, shapes, and highlights' },
    ],
  },
];

export default function HomePage() {

  return (
    <>
      <Helmet>
        <title>Acorn Tools — Free Private PDF & Image Tools</title>
        <meta name="description" content="Free private PDF & image tools that run in your browser. Compress, convert, resize, crop, merge — nothing leaves your device. No sign-up, no upload, works offline." />
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
            featureList: 'Resize images, Compress images, Convert image formats, Crop images, Strip metadata, Image to PDF, PDF to image, Compress PDF, Merge PDFs, Split PDF, Rotate PDF, Watermark PDF, Page numbers, Redact PDF, Organize PDF pages, Edit PDF',
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

      {/* ── Hero section ── */}
      <HeroSection />

      {/* ── Tool grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 40 }}>
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

      {/* ── Why choose ── */}
      <WhyChoose />

      {/* ── Privacy comparison ── */}
      <PrivacyComparison />

      {/* ── Trust signals ── */}
      <TrustSignals />

      {/* ── Under the hood ── */}
      <TechStack />

    </>
  );
}

// ══════════════════════════════════════════
// HeroSection — Headline + benefit pills
// ══════════════════════════════════════════
function HeroSection() {
  const pills = [
    '100% Free',
    'No Upload Required',
    'Open Source',
    'Works Offline',
  ];

  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <h1 style={{
        fontSize: 28, fontWeight: 800,
        color: theme.text,
        lineHeight: 1.25,
        marginBottom: 12,
        letterSpacing: '-0.01em',
      }}>
        Process PDFs & Images Securely in Your Browser
      </h1>
      <p style={{
        fontSize: 15, color: theme.textMuted,
        lineHeight: 1.6,
        maxWidth: 540,
        margin: '0 auto 20px',
      }}>
        Acorn Tools runs entirely in your browser using WebAssembly. Your files never leave your device — no uploads, no servers, no sign-ups.
      </p>

      <div style={{
        display: 'flex', gap: 8,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {pills.map((pill) => (
          <span key={pill} style={{
            fontSize: 11, fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 20,
            background: theme.accentDim,
            color: theme.accent,
            letterSpacing: '0.01em',
          }}>
            {pill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// WhyChoose — 6-card benefit grid
// ══════════════════════════════════════════
function WhyChoose() {
  const benefits = [
    {
      title: '100% Private',
      text: 'Your files never leave your device. All processing happens locally in your browser, ensuring complete privacy and security.',
    },
    {
      title: 'No Upload Required',
      text: 'Everything runs locally with zero network requests during processing. Verify it yourself — open the Network tab in DevTools.',
    },
    {
      title: '16 Professional Tools',
      text: 'Resize, compress, convert, crop, merge, split, redact, edit, watermark, and more. A complete toolkit for images and PDFs.',
    },
    {
      title: 'Lightning Fast',
      text: 'WebAssembly-powered processing at near-native speed. No waiting for server roundtrips — results are instant.',
    },
    {
      title: 'Works on Any Device',
      text: 'Browser-based means it works on Windows, Mac, Linux, and Chromebook. No software to install, no IT approval needed.',
    },
    {
      title: 'Open Source',
      text: 'MIT-licensed and fully transparent. Inspect the code, verify privacy claims, self-host on your own infrastructure, or contribute.',
    },
  ];

  return (
    <div style={{ marginTop: 44 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700,
        color: theme.text,
        textAlign: 'center',
        marginBottom: 6,
      }}>
        Why choose Acorn Tools?
      </h2>
      <p style={{
        fontSize: 13, color: theme.textMuted,
        textAlign: 'center',
        lineHeight: 1.5,
        marginBottom: 24,
        maxWidth: 480,
        margin: '0 auto 24px',
      }}>
        Built for people who care about where their files go.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10,
      }}>
        {benefits.map((b) => (
          <div key={b.title} style={{
            padding: '20px 16px',
            borderRadius: theme.radius,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: theme.text,
              marginBottom: 6,
            }}>
              {b.title}
            </div>
            <div style={{
              fontSize: 12, color: theme.textMuted,
              lineHeight: 1.55,
            }}>
              {b.text}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      link: '/blog/confidential-legal-documents-without-breaking-ndas',
      linkText: 'Read: NDA compliance guide',
    },
    {
      icon: '🏥',
      title: 'Healthcare',
      text: 'Process documents with PHI without uploading to external servers. Supports HIPAA compliance requirements.',
      link: '/blog/hipaa-compliant-pdf-tools-browser-based',
      linkText: 'Read: HIPAA compliance guide',
    },
    {
      icon: '🏦',
      title: 'Finance & Banking',
      text: 'Handle sensitive financial documents locally. No risk of data exposure through third-party services.',
      link: '/blog/sox-compliance-document-processing-local',
      linkText: 'Read: SOX compliance guide',
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
              marginBottom: 8,
            }}>{s.text}</div>
            <Link
              to={s.link}
              style={{
                fontSize: 11, fontWeight: 500,
                color: theme.accent,
                textDecoration: 'none',
                transition: theme.transition,
              }}
            >
              {s.linkText} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// TechStack — Under the hood (for HN crowd)
// ══════════════════════════════════════════
function TechStack() {
  const techs = [
    {
      name: 'libvips (WASM)',
      desc: 'The same image processing library used by Sharp and Cloudinary, compiled to WebAssembly. Runs natively in the browser at near-native speed.',
    },
    {
      name: 'pdf-lib',
      desc: 'Pure JavaScript PDF manipulation. Merge, split, rotate, watermark, and add page numbers without any server dependency.',
    },
    {
      name: 'pdfjs-dist',
      desc: 'Mozilla\'s PDF renderer for accurate page rendering, thumbnail generation, and PDF-to-image conversion.',
    },
    {
      name: 'MozJPEG + SSIM',
      desc: 'Smart PDF compression uses perceptual quality measurement (SSIM) to find the optimal compression level for each embedded image.',
    },
  ];

  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600,
        color: theme.textMuted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 6,
        textAlign: 'center',
      }}>
        Under the hood
      </h2>
      <p style={{
        fontSize: 13, color: theme.textMuted,
        textAlign: 'center',
        lineHeight: 1.5,
        marginBottom: 16,
        maxWidth: 480,
        margin: '0 auto 16px',
      }}>
        Production-grade libraries compiled to WebAssembly, running entirely in your browser tab.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 10,
      }}>
        {techs.map((t) => (
          <div key={t.name} style={{
            padding: '16px',
            borderRadius: theme.radius,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: theme.text,
              marginBottom: 4,
              fontFamily: theme.fontMono,
            }}>
              {t.name}
            </div>
            <div style={{
              fontSize: 12, color: theme.textMuted,
              lineHeight: 1.5,
            }}>
              {t.desc}
            </div>
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
