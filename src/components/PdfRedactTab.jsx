import { useState, useRef, useEffect, useCallback } from 'react';
import { theme } from '../lib/theme';
import { renderPagePreview, getRedactPageCount, redactPdf } from '../lib/pdfRedactEngine';
import { saveFile, baseName } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfRedactTab({ onBeforeProcess, onOperationComplete }) {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [pageDims, setPageDims] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redactions, setRedactions] = useState(new Map()); // pageNum -> [{x,y,w,h}]
  const [status, setStatus] = useState('');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const containerRef = useRef(null);
  const pageCache = useRef(new Map()); // pageNum -> { blobUrl, displayWidth, displayHeight }

  const onFiles = async (files) => {
    const pdf = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdf) return;
    setFile(pdf);
    setStatus('');
    setRedactions(new Map());
    setCurrentPage(1);
    pageCache.current = new Map();
    setLoading(true);
    try {
      const count = await getRedactPageCount(pdf);
      setPageCount(count);
      await loadPage(pdf, 1);
    } catch (e) {
      setStatus('Error loading PDF: ' + e.message);
    }
    setLoading(false);
  };

  const loadPage = async (f, pageNum) => {
    // Check cache
    const cached = pageCache.current.get(pageNum);
    if (cached) {
      setPageImage(cached.blobUrl);
      setPageDims(cached);
      return;
    }
    setLoading(true);
    try {
      const result = await renderPagePreview(f, pageNum);
      pageCache.current.set(pageNum, result);
      setPageImage(result.blobUrl);
      setPageDims(result);
    } catch (e) {
      setStatus('Error rendering page: ' + e.message);
    }
    setLoading(false);
  };

  const goToPage = (num) => {
    if (num < 1 || num > pageCount || num === currentPage) return;
    setCurrentPage(num);
    loadPage(file, num);
  };

  // ── Drawing handlers ──

  const getRelativePos = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e) => {
    if (loading || !pageDims) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    if (!pos) return;
    setIsDrawing(true);
    setDrawStart(pos);
    setCurrentRect(null);
  };

  useEffect(() => {
    if (!isDrawing) return;

    const onMove = (e) => {
      e.preventDefault();
      const pos = getRelativePos(e);
      if (!pos || !drawStart) return;
      setCurrentRect({
        x: Math.min(drawStart.x, pos.x),
        y: Math.min(drawStart.y, pos.y),
        w: Math.abs(pos.x - drawStart.x),
        h: Math.abs(pos.y - drawStart.y),
      });
    };

    const onUp = (e) => {
      const pos = getRelativePos(e.changedTouches ? e.changedTouches[0] : e);
      if (pos && drawStart) {
        const rect = {
          x: Math.min(drawStart.x, pos.x),
          y: Math.min(drawStart.y, pos.y),
          w: Math.abs(pos.x - drawStart.x),
          h: Math.abs(pos.y - drawStart.y),
        };
        // Minimum size threshold (2% of page)
        if (rect.w > 0.02 && rect.h > 0.02) {
          setRedactions(prev => {
            const next = new Map(prev);
            const existing = next.get(currentPage) || [];
            next.set(currentPage, [...existing, rect]);
            return next;
          });
        }
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentRect(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDrawing, drawStart, currentPage]);

  const removeRect = (pageNum, idx) => {
    setRedactions(prev => {
      const next = new Map(prev);
      const rects = [...(next.get(pageNum) || [])];
      rects.splice(idx, 1);
      if (rects.length === 0) next.delete(pageNum);
      else next.set(pageNum, rects);
      return next;
    });
  };

  const clearPageRedactions = () => {
    setRedactions(prev => {
      const next = new Map(prev);
      next.delete(currentPage);
      return next;
    });
  };

  const totalRedactions = Array.from(redactions.values()).reduce((sum, r) => sum + r.length, 0);
  const pageRedactions = redactions.get(currentPage) || [];

  // ── Export ──

  const process = async () => {
    if (!file || totalRedactions === 0) return;
    if (onBeforeProcess && !onBeforeProcess()) return;
    try {
      const result = await redactPdf(file, redactions, setStatus);
      await saveFile(result.blob, baseName(file.name) + '_redacted.pdf');
      setStatus(`Redacted ✓ · ${result.redactedPages} page${result.redactedPages !== 1 ? 's' : ''} modified`);
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    // Revoke cached blob URLs
    for (const cached of pageCache.current.values()) {
      URL.revokeObjectURL(cached.blobUrl);
    }
    pageCache.current = new Map();
    setFile(null);
    setPageCount(0);
    setCurrentPage(1);
    setPageImage(null);
    setPageDims(null);
    setRedactions(new Map());
    setStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!file ? (
        <DropZone
          accept=".pdf,application/pdf"
          onFiles={onFiles}
          label="Drop a PDF to redact"
          sublabel="Draw over sensitive content to permanently remove it"
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
            <span style={{
              fontSize: 12, fontFamily: theme.fontMono,
              color: theme.textMuted,
            }}>
              {pageCount} page{pageCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Instructions */}
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: theme.accentGlow,
            border: `1px solid ${theme.accentDim}`,
            fontSize: 12, color: theme.accent,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>█</span>
            Click and drag to draw redaction rectangles. Redacted areas are permanently destroyed in the output.
          </div>

          {/* Page viewer with drawing overlay */}
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: pageDims ? Math.min(pageDims.displayWidth, 600) : 600,
              aspectRatio: pageDims ? `${pageDims.displayWidth} / ${pageDims.displayHeight}` : 'auto',
              margin: '0 auto',
              borderRadius: theme.radius,
              overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              background: theme.surfaceAlt,
              cursor: loading ? 'wait' : 'crosshair',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {/* Page image */}
            {pageImage && (
              <img
                src={pageImage}
                alt={`Page ${currentPage}`}
                draggable={false}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}

            {/* Loading overlay */}
            {loading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: theme.overlay,
              }}>
                <StatusBadge status="Loading page…" />
              </div>
            )}

            {/* Existing redaction rectangles */}
            {pageRedactions.map((rect, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                  background: 'rgba(0,0,0,0.85)',
                  borderRadius: 2,
                  pointerEvents: 'auto',
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeRect(currentPage, idx); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 18, height: 18,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.8)',
                    color: '#000',
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1,
                  }}
                  aria-label="Remove redaction"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Currently drawing rectangle */}
            {currentRect && (
              <div style={{
                position: 'absolute',
                left: `${currentRect.x * 100}%`,
                top: `${currentRect.y * 100}%`,
                width: `${currentRect.w * 100}%`,
                height: `${currentRect.h * 100}%`,
                background: 'rgba(0,0,0,0.5)',
                border: '2px dashed rgba(255,255,255,0.6)',
                borderRadius: 2,
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Page navigation */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12,
          }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                fontFamily: theme.font,
                fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: currentPage <= 1 ? theme.textDim : theme.textMuted,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                transition: theme.transitionFast,
              }}
            >
              ← Prev
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {/* Page dots / indicators */}
              {pageCount <= 20 ? (
                Array.from({ length: pageCount }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => goToPage(num)}
                    style={{
                      width: num === currentPage ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: 'none',
                      background: num === currentPage
                        ? theme.accent
                        : redactions.has(num)
                          ? theme.error
                          : theme.border,
                      cursor: 'pointer',
                      padding: 0,
                      transition: theme.transitionFast,
                    }}
                    aria-label={`Page ${num}${redactions.has(num) ? ' (has redactions)' : ''}`}
                    title={`Page ${num}${redactions.has(num) ? ` · ${redactions.get(num).length} redaction(s)` : ''}`}
                  />
                ))
              ) : (
                <span style={{
                  fontSize: 13, fontFamily: theme.fontMono,
                  color: theme.textMuted,
                }}>
                  {currentPage} / {pageCount}
                </span>
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= pageCount}
              style={{
                fontFamily: theme.font,
                fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: currentPage >= pageCount ? theme.textDim : theme.textMuted,
                cursor: currentPage >= pageCount ? 'not-allowed' : 'pointer',
                transition: theme.transitionFast,
              }}
            >
              Next →
            </button>
          </div>

          {/* Redaction info bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, color: theme.textMuted }}>
              {pageRedactions.length > 0 ? (
                <>
                  <span style={{ fontWeight: 600, color: theme.error }}>
                    {pageRedactions.length}
                  </span>
                  {' '}redaction{pageRedactions.length !== 1 ? 's' : ''} on this page
                </>
              ) : (
                'No redactions on this page'
              )}
              {totalRedactions > 0 && pageRedactions.length !== totalRedactions && (
                <span style={{ color: theme.textDim }}>
                  {' '}· {totalRedactions} total across all pages
                </span>
              )}
            </span>

            {pageRedactions.length > 0 && (
              <button
                onClick={clearPageRedactions}
                style={{
                  fontFamily: theme.font,
                  fontSize: 11, fontWeight: 500,
                  padding: '4px 10px', borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  transition: theme.transitionFast,
                }}
              >
                Clear this page
              </button>
            )}
          </div>

          {/* Action row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <Btn onClick={process} disabled={totalRedactions === 0}>
              Export Redacted PDF
            </Btn>
            <StatusBadge status={status} />
          </div>
        </>
      )}
    </div>
  );
}
