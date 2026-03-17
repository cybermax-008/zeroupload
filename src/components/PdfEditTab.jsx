import { useState, useRef, useEffect } from 'react';
import { theme } from '../lib/theme';
import { initPdfRenderer } from '../lib/pdfRenderEngine';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveFile, baseName, readAsArrayBuffer } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfEditTab() {
  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState([]); // { type, x, y, text, fontSize, color, pageNum }
  const [status, setStatus] = useState('');
  const [tool, setTool] = useState('text'); // 'text' | 'rect'
  const [pageUrl, setPageUrl] = useState(null);
  const [pageDims, setPageDims] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (f?.type !== 'application/pdf') return;
    setFile(f);
    setStatus('');
    setAnnotations([]);

    const bytes = await readAsArrayBuffer(f);
    setPdfBytes(bytes);

    const pdfjs = await initPdfRenderer();
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    setPageCount(pdf.numPages);
    setCurrentPage(1);
    await renderPage(pdf, 1);
  };

  const renderPage = async (pdf, pageNum) => {
    if (pageUrl) URL.revokeObjectURL(pageUrl);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const url = URL.createObjectURL(blob);
    setPageUrl(url);
    setPageDims({ w: viewport.width, h: viewport.height });
  };

  const changePage = async (num) => {
    if (num < 1 || num > pageCount || !pdfBytes) return;
    setCurrentPage(num);
    const pdfjs = await initPdfRenderer();
    const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
    await renderPage(pdf, num);
  };

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (!text) return;
      setAnnotations(prev => [...prev, {
        type: 'text', x, y, text,
        fontSize: 14, color: '#000000',
        pageNum: currentPage,
      }]);
    } else if (tool === 'rect') {
      setAnnotations(prev => [...prev, {
        type: 'rect', x: x - 40, y: y - 20,
        width: 80, height: 40,
        color: '#c9a55a', pageNum: currentPage,
      }]);
    }
  };

  const removeAnnotation = (idx) => {
    setAnnotations(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAnnotated = async () => {
    if (!pdfBytes) return;
    setStatus('Saving annotations…');
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const scale = 1.5; // Must match render scale

      for (const ann of annotations) {
        const page = doc.getPage(ann.pageNum - 1);
        const { height } = page.getSize();

        if (ann.type === 'text') {
          const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };

          // Convert display coords to PDF coords (Y-axis inversion)
          const pdfX = ann.x / scale;
          const pdfY = height - (ann.y / scale);

          page.drawText(ann.text, {
            x: pdfX,
            y: pdfY,
            size: ann.fontSize / scale * 1.2,
            font,
            color: hexToRgb(ann.color),
          });
        } else if (ann.type === 'rect') {
          const pdfX = ann.x / scale;
          const pdfY = height - (ann.y / scale) - (ann.height / scale);

          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: ann.width / scale,
            height: ann.height / scale,
            borderColor: rgb(0.79, 0.65, 0.35),
            borderWidth: 1.5,
            opacity: 0.8,
          });
        }
      }

      const savedBytes = await doc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      await saveFile(blob, baseName(file.name) + '_edited.pdf');
      setStatus(`Saved ✓ (${annotations.length} annotations)`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    if (pageUrl) URL.revokeObjectURL(pageUrl);
    setFile(null);
    setPdfBytes(null);
    setPageCount(0);
    setAnnotations([]);
    setPageUrl(null);
    setStatus('');
  };

  const pageAnnotations = annotations.filter(a => a.pageNum === currentPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept=".pdf"
          onFiles={onFiles}
          label="Drop a PDF to edit"
          sublabel="Add text and shapes — all done locally"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {/* Toolbar */}
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <div style={{
              display: 'flex', gap: 2, background: theme.surface,
              borderRadius: 8, padding: 3, border: `1px solid ${theme.border}`,
            }}>
              {[['text', 'Text'], ['rect', 'Rectangle']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTool(v)}
                  style={{
                    fontFamily: theme.font, fontSize: 12, fontWeight: 500,
                    padding: '6px 16px', borderRadius: 6, border: 'none',
                    background: tool === v ? theme.accentDim : 'transparent',
                    color: tool === v ? theme.accent : theme.textMuted,
                    cursor: 'pointer', transition: theme.transitionFast,
                  }}
                >{l}</button>
              ))}
            </div>

            <Btn onClick={saveAnnotated} disabled={annotations.length === 0}>
              Save PDF
            </Btn>
            <StatusBadge status={status} />
          </div>

          {/* Page navigation */}
          {pageCount > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Btn small secondary onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}>
                ←
              </Btn>
              <span style={{
                fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted,
              }}>
                Page {currentPage} of {pageCount}
              </span>
              <Btn small secondary onClick={() => changePage(currentPage + 1)} disabled={currentPage >= pageCount}>
                →
              </Btn>
            </div>
          )}

          <div style={{ fontSize: 11, color: theme.textDim }}>
            Click on the page to add {tool === 'text' ? 'text' : 'a rectangle'}
          </div>

          {/* PDF page preview with annotations */}
          {pageUrl && (
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              style={{
                position: 'relative',
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                overflow: 'hidden',
                cursor: 'crosshair',
                alignSelf: 'center',
                maxWidth: '100%',
              }}
            >
              <img
                src={pageUrl}
                alt={`Page ${currentPage}`}
                draggable={false}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              {/* Annotation overlays */}
              {pageAnnotations.map((ann, i) => {
                const realIdx = annotations.indexOf(ann);
                if (ann.type === 'text') {
                  return (
                    <div
                      key={realIdx}
                      style={{
                        position: 'absolute',
                        left: ann.x, top: ann.y - ann.fontSize,
                        fontSize: ann.fontSize,
                        color: ann.color,
                        fontFamily: theme.font,
                        fontWeight: 500,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        userSelect: 'none',
                        textShadow: '0 0 2px rgba(255,255,255,0.8)',
                      }}
                      onClick={(e) => { e.stopPropagation(); removeAnnotation(realIdx); }}
                      title="Click to remove"
                    >
                      {ann.text}
                    </div>
                  );
                }
                if (ann.type === 'rect') {
                  return (
                    <div
                      key={realIdx}
                      style={{
                        position: 'absolute',
                        left: ann.x, top: ann.y,
                        width: ann.width, height: ann.height,
                        border: `2px solid ${ann.color}`,
                        borderRadius: 3,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => { e.stopPropagation(); removeAnnotation(realIdx); }}
                      title="Click to remove"
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
