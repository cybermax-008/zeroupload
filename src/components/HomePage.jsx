import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useOutletContext } from 'react-router-dom';
import { theme } from '../lib/theme';
import { ROUTE_BY_TOOL_ID, BASE_URL } from '../lib/routes';
import { PricingSection } from './ui';

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

export default function HomePage() {
  const { proUser, onShowPaywall } = useOutletContext();

  return (
    <>
      <Helmet>
        <title>Acorn Tools — Free Private PDF & Image Tools</title>
        <meta name="description" content="Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device." />
        <link rel="canonical" href={BASE_URL + '/'} />
        <meta property="og:title" content="Acorn Tools — Private PDF & Image Tools" />
        <meta property="og:description" content="Free private PDF & image tools. Compress, convert, resize, crop, merge — 100% offline, nothing leaves your device." />
        <meta property="og:url" content={BASE_URL + '/'} />
      </Helmet>

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
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {!proUser && (
        <PricingSection onUpgrade={onShowPaywall} />
      )}
    </>
  );
}

function ToolCard({ tool }) {
  const [hover, setHover] = useState(false);
  const route = ROUTE_BY_TOOL_ID[tool.id];

  return (
    <Link
      to={route?.path || '/'}
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
