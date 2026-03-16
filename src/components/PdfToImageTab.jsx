import { useState } from 'react';
import { theme } from '../lib/theme';
import { pdfToImages } from '../lib/pdfRenderEngine';
import { humanSize } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge } from './ui';

export default function PdfToImageTab() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [pageRange, setPageRange] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [previews, setPreviews] = useState([]);

  const onFiles = (newFiles) => {
    const pdf = newFiles.find(f =>
      f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    if (!pdf) return;
    setFile(pdf);
    setStatus('');
    setResults([]);
    setPreviews([]);
    setPageRange('');
  };

  const process = async () => {
    if (!file) return;
    setStatus('Initializing renderer…');
    setResults([]);
    setPreviews([]);

    try {
      const imgs = await pdfToImages(file, {
        format, quality, scale,
        pageRange: pageRange.trim() || null,
      }, setStatus);

      setResults(imgs);

      // Create preview URLs
      const urls = imgs.map(r => URL.createObjectURL(r.blob));
      setPreviews(urls);

      setStatus(`Rendered ${imgs.length} page${imgs.length !== 1 ? 's' : ''} ✓`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const downloadAll = () => {
    results.forEach(r => r.download());
  };

  const reset = () => {
    // Clean up preview URLs
    previews.forEach(u => URL.revokeObjectURL(u));
    setFile(null);
    setStatus('');
    setResults([]);
    setPreviews([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!file ? (
        <DropZone
          accept=".pdf,application/pdf"
          onFiles={onFiles}
          label="Drop a PDF to convert to images"
          sublabel="Each page becomes a JPEG or PNG"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {/* Settings */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
              <Toggle
                options={[['image/jpeg', 'JPEG'], ['image/png', 'PNG']]}
                value={format} onChange={setFormat}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Scale</span>
              <Toggle
                options={[
                  [1, '1×'],
                  [1.5, '1.5×'],
                  [2, '2×'],
                  [3, '3×'],
                ]}
                value={scale} onChange={setScale}
              />
            </div>
          </div>

          {/* Quality slider (JPEG only) */}
          {format === 'image/jpeg' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                color: theme.textMuted, fontSize: 12, fontWeight: 500, minWidth: 48,
              }}>Quality</span>
              <input
                type="range" min="0.3" max="1" step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                style={{ flex: 1, maxWidth: 200 }}
              />
              <span style={{
                fontFamily: theme.fontMono, fontSize: 12,
                color: theme.accent, minWidth: 36,
              }}>
                {Math.round(quality * 100)}%
              </span>
            </div>
          )}

          {/* Page range */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>Pages</span>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="All pages (or e.g. 1-3, 5)"
              style={{
                width: 200, padding: '7px 10px',
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
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={process}>Convert</Btn>
            {results.length > 1 && (
              <Btn onClick={downloadAll} secondary>Download All</Btn>
            )}
            <StatusBadge status={status} />
          </div>

          {/* Result thumbnails */}
          {results.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => r.download()}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: theme.transition,
                    background: theme.surfaceAlt,
                  }}
                >
                  <div style={{
                    height: 120, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {previews[i] && (
                      <img src={previews[i]} alt={`Page ${r.pageNum}`} style={{
                        maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                      }} />
                    )}
                  </div>
                  <div style={{
                    padding: '6px 8px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${theme.border}`,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, color: theme.textMuted,
                    }}>Page {r.pageNum}</span>
                    <span style={{
                      fontSize: 10, fontFamily: theme.fontMono, color: theme.textDim,
                    }}>{humanSize(r.blob.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
