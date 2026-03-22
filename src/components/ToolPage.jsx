import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useOutletContext } from 'react-router-dom';
import { theme } from '../lib/theme';
import { ROUTE_BY_PATH, BASE_URL } from '../lib/routes';
import ResizeTab from './ResizeTab';
import CompressTab from './CompressTab';
import ConvertTab from './ConvertTab';
import CropTab from './CropTab';
import ImgToPdfTab from './ImgToPdfTab';
import PdfToImageTab from './PdfToImageTab';
import PdfToolsTab from './PdfToolsTab';
import MetadataStripTab from './MetadataStripTab';
import PdfPageOrganizerTab from './PdfPageOrganizerTab';
import PdfRedactTab from './PdfRedactTab';

const TOOL_COMPONENTS = {
  resize: ResizeTab,
  compress: CompressTab,
  convert: ConvertTab,
  crop: CropTab,
  img2pdf: ImgToPdfTab,
  pdf2img: PdfToImageTab,
  pdfcompress: PdfToolsTab,
  pdftools: PdfToolsTab,
  metadata: MetadataStripTab,
  pdforganize: PdfPageOrganizerTab,
  pdfredact: PdfRedactTab,
};

export default function ToolPage({ routeKey }) {
  const route = ROUTE_BY_PATH[routeKey];
  useOutletContext();
  const ToolComponent = TOOL_COMPONENTS[route.toolId];

  const toolProps = {};
  if (route.defaultMode) toolProps.defaultMode = route.defaultMode;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: route.label + ' — Acorn Tools',
      description: route.description,
      url: `${BASE_URL}${route.path}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (browser-based)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'Acorn Tools', url: BASE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Acorn Tools', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: route.label, item: `${BASE_URL}${route.path}` },
      ],
    },
  ];

  if (route.faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: route.faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <>
      <Helmet>
        <title>{route.title}</title>
        <meta name="description" content={route.description} />
        <link rel="canonical" href={`${BASE_URL}${route.path}`} />
        <meta property="og:title" content={route.title} />
        <meta property="og:description" content={route.description} />
        <meta property="og:url" content={`${BASE_URL}${route.path}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${BASE_URL}/social-preview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={route.title} />
        <meta name="twitter:description" content={route.description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16,
      }}>
        <Link
          to="/"
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
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>←</span> All Tools
        </Link>
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: theme.text,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: theme.accent }}>{route.icon}</span>
          {route.label}
        </span>
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 700,
        color: theme.text,
        marginBottom: 6,
      }}>
        {route.h1}
      </h1>
      <p style={{
        fontSize: 13, color: theme.textMuted,
        lineHeight: 1.5, marginBottom: 20,
        maxWidth: 600,
      }}>
        {route.seoContent}
      </p>

      <main style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        padding: '28px 24px',
      }}>
        <ToolComponent {...toolProps} />
      </main>

      {route.faqs?.length > 0 && (
        <FaqSection faqs={route.faqs} />
      )}
    </>
  );
}

// ══════════════════════════════════════════
// FaqSection — Collapsible FAQ accordion
// ══════════════════════════════════════════
function FaqSection({ faqs }) {
  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 700,
        color: theme.text,
        marginBottom: 14,
      }}>
        Frequently Asked Questions
      </h2>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {faqs.map((faq, i) => (
          <FaqItem key={i} faq={faq} />
        ))}
      </div>
    </section>
  );
}

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius,
      background: theme.surface,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          fontFamily: theme.font,
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: theme.text,
          lineHeight: 1.4,
        }}>
          {faq.q}
        </span>
        <span style={{
          fontSize: 14, color: theme.textMuted,
          flexShrink: 0,
          transition: theme.transition,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 14px',
          fontSize: 13, color: theme.textMuted,
          lineHeight: 1.6,
        }}>
          {faq.a}
        </div>
      )}
    </div>
  );
}
