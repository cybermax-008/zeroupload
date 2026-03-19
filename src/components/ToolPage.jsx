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
};

export default function ToolPage({ routeKey }) {
  const route = ROUTE_BY_PATH[routeKey];
  const { onBeforeProcess, onOperationComplete } = useOutletContext();
  const ToolComponent = TOOL_COMPONENTS[route.toolId];

  const toolProps = { onBeforeProcess, onOperationComplete };
  if (route.defaultMode) toolProps.defaultMode = route.defaultMode;

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
    </>
  );
}
