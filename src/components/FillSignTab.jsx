import { useState, useRef, useCallback, useEffect } from 'react';
import { theme } from '../lib/theme';
import {
  loadPdfBytes,
  renderPagePreview,
  getPageDimensions,
  detectFormFields,
  fillFormFields,
  embedAnnotations,
  processSignatureImage,
  pdfToDisplay,
  displayToPdf,
} from '../lib/fillSignEngine';
import { saveFile, baseName } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

const TOOLS = [
  { id: 'signature', icon: '✎', label: 'Signature' },
  { id: 'text', icon: 'T', label: 'Text' },
  { id: 'date', icon: '⊙', label: 'Date' },
  { id: 'initials', icon: 'I', label: 'Initials' },
  { id: 'checkmark', icon: '✓', label: 'Check' },
  { id: 'xmark', icon: '✗', label: 'X Mark' },
];

const DEFAULT_COLORS = ['#1a1a2e', '#0d47a1', '#b71c1c', '#1b5e20', '#4a148c'];

export default function FillSignTab() {
  // File state
  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [pageDims, setPageDims] = useState(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // Form fields
  const [formFields, setFormFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [showFields, setShowFields] = useState(true);

  // Annotations
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [toolColor, setToolColor] = useState('#1a1a2e');
  const [toolFontSize, setToolFontSize] = useState(14);

  // Signature pad
  const [showSigPad, setShowSigPad] = useState(false);
  const [sigPadMode, setSigPadMode] = useState('signature'); // 'signature' | 'initials'
  const [savedSignature, setSavedSignature] = useState(null);
  const [savedInitials, setSavedInitials] = useState(null);

  // Drag state
  const [dragging, setDragging] = useState(null);
  const dragStart = useRef(null);

  // Editing state
  const [editingId, setEditingId] = useState(null);

  const [status, setStatus] = useState('');
  const containerRef = useRef(null);
  const prevPageImageRef = useRef(null);

  // ── File loading ──

  const onFiles = async (files) => {
    const f = files[0];
    if (f?.type !== 'application/pdf') return;
    setFile(f);
    setStatus('Loading PDF…');
    setAnnotations([]);
    setSelectedId(null);
    setFieldValues({});
    setFormFields([]);
    try {
      const bytes = await loadPdfBytes(f);
      setPdfBytes(bytes);
      const dims = await getPageDimensions(bytes);
      setPageDims(dims);
      setPageCount(dims.length);
      setCurrentPage(1);

      // Detect form fields
      const fields = await detectFormFields(bytes);
      setFormFields(fields);
      const initialValues = {};
      for (const field of fields) {
        initialValues[field.name] = field.currentValue || '';
      }
      setFieldValues(initialValues);

      // Render first page
      await renderPage(bytes, 1);
      setStatus('');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const renderPage = async (bytes, pageNum) => {
    setStatus('Rendering page…');
    try {
      const maxWidth = 600;
      const dims = await getPageDimensions(bytes);
      const pgDim = dims[pageNum - 1];
      const scale = Math.min(maxWidth / pgDim.width, 2);

      const result = await renderPagePreview(bytes, pageNum, scale);

      // Revoke previous image
      if (prevPageImageRef.current) {
        URL.revokeObjectURL(prevPageImageRef.current);
      }
      prevPageImageRef.current = result.url;

      setPageImage(result.url);
      setDisplaySize({ width: result.displayWidth, height: result.displayHeight });
      setStatus('');
    } catch (e) {
      setStatus('Error rendering page: ' + e.message);
    }
  };

  const goToPage = async (num) => {
    if (num < 1 || num > pageCount || !pdfBytes) return;
    setCurrentPage(num);
    setSelectedId(null);
    setEditingId(null);
    await renderPage(pdfBytes, num);
  };

  // ── Annotation placement ──

  const handlePreviewClick = (e) => {
    if (!activeTool || dragging) return;
    if (editingId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pgDim = pageDims[currentPage - 1];

    if (activeTool === 'signature') {
      if (savedSignature) {
        placeImageAnnotation('signature', savedSignature, clickX, clickY, pgDim);
      } else {
        setSigPadMode('signature');
        setShowSigPad(true);
      }
      return;
    }

    if (activeTool === 'initials') {
      if (savedInitials) {
        placeImageAnnotation('initials', savedInitials, clickX, clickY, pgDim);
      } else {
        setSigPadMode('initials');
        setShowSigPad(true);
      }
      return;
    }

    if (activeTool === 'text') {
      placeTextAnnotation('text', clickX, clickY, pgDim);
      return;
    }

    if (activeTool === 'date') {
      const today = new Date().toLocaleDateString();
      placeTextAnnotation('date', clickX, clickY, pgDim, today);
      return;
    }

    if (activeTool === 'checkmark' || activeTool === 'xmark') {
      placeMarkAnnotation(activeTool, clickX, clickY, pgDim);
      return;
    }
  };

  const placeImageAnnotation = (type, dataUrl, clickX, clickY, pgDim) => {
    // Default size: 150x50 display pixels
    const defW = 150;
    const defH = 50;
    const dispX = clickX - defW / 2;
    const dispY = clickY - defH / 2;

    const pdf = displayToPdf(dispX, dispY, defW, defH, pgDim, displaySize);
    const ann = {
      id: crypto.randomUUID(),
      type,
      pageIndex: currentPage - 1,
      pdfX: pdf.x, pdfY: pdf.y,
      pdfWidth: pdf.width, pdfHeight: pdf.height,
      text: null,
      fontSize: null,
      imageDataUrl: dataUrl,
      color: toolColor,
    };
    setAnnotations(prev => [...prev, ann]);
    setSelectedId(ann.id);
  };

  const placeTextAnnotation = (type, clickX, clickY, pgDim, defaultText = '') => {
    const defW = 200;
    const defH = 30;
    const dispX = clickX - defW / 2;
    const dispY = clickY - defH / 2;

    const pdf = displayToPdf(dispX, dispY, defW, defH, pgDim, displaySize);
    const ann = {
      id: crypto.randomUUID(),
      type,
      pageIndex: currentPage - 1,
      pdfX: pdf.x, pdfY: pdf.y,
      pdfWidth: pdf.width, pdfHeight: pdf.height,
      text: defaultText,
      fontSize: toolFontSize,
      imageDataUrl: null,
      color: toolColor,
    };
    setAnnotations(prev => [...prev, ann]);
    setSelectedId(ann.id);
    if (!defaultText) setEditingId(ann.id);
  };

  const placeMarkAnnotation = (type, clickX, clickY, pgDim) => {
    const defSize = 24;
    const dispX = clickX - defSize / 2;
    const dispY = clickY - defSize / 2;

    const pdf = displayToPdf(dispX, dispY, defSize, defSize, pgDim, displaySize);
    const ann = {
      id: crypto.randomUUID(),
      type,
      pageIndex: currentPage - 1,
      pdfX: pdf.x, pdfY: pdf.y,
      pdfWidth: pdf.width, pdfHeight: pdf.height,
      text: null,
      fontSize: null,
      imageDataUrl: null,
      color: toolColor,
    };
    setAnnotations(prev => [...prev, ann]);
    setSelectedId(ann.id);
  };

  // ── Drag / Resize ──

  const onAnnotationPointerDown = (e, annId, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(annId);
    setDragging({ id: annId, mode });

    const rect = containerRef.current.getBoundingClientRect();
    const ann = annotations.find(a => a.id === annId);
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ann: { ...ann },
      rect,
    };
  };

  useEffect(() => {
    if (!dragging || !pageDims) return;

    const pgDim = pageDims[currentPage - 1];

    const onMove = (e) => {
      const { mx, my, ann: startAnn } = dragStart.current;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;

      // Convert start annotation to display coords
      const startDisp = pdfToDisplay(
        startAnn.pdfX, startAnn.pdfY, startAnn.pdfWidth, startAnn.pdfHeight,
        pgDim, displaySize
      );

      if (dragging.mode === 'move') {
        const newDispX = startDisp.x + dx;
        const newDispY = startDisp.y + dy;
        const newPdf = displayToPdf(
          newDispX, newDispY, startDisp.width, startDisp.height,
          pgDim, displaySize
        );
        setAnnotations(prev => prev.map(a =>
          a.id === dragging.id
            ? { ...a, pdfX: newPdf.x, pdfY: newPdf.y, pdfWidth: newPdf.width, pdfHeight: newPdf.height }
            : a
        ));
      } else {
        // Corner resize
        let newX = startDisp.x;
        let newY = startDisp.y;
        let newW = startDisp.width;
        let newH = startDisp.height;
        const isImage = startAnn.type === 'signature' || startAnn.type === 'initials';
        const aspectRatio = startDisp.width / startDisp.height;

        if (dragging.mode === 'se') {
          newW = Math.max(20, startDisp.width + dx);
          newH = isImage ? newW / aspectRatio : Math.max(20, startDisp.height + dy);
        } else if (dragging.mode === 'sw') {
          newW = Math.max(20, startDisp.width - dx);
          newH = isImage ? newW / aspectRatio : Math.max(20, startDisp.height + dy);
          newX = startDisp.x + startDisp.width - newW;
        } else if (dragging.mode === 'ne') {
          newW = Math.max(20, startDisp.width + dx);
          newH = isImage ? newW / aspectRatio : Math.max(20, startDisp.height - dy);
          newY = startDisp.y + startDisp.height - newH;
        } else if (dragging.mode === 'nw') {
          newW = Math.max(20, startDisp.width - dx);
          newH = isImage ? newW / aspectRatio : Math.max(20, startDisp.height - dy);
          newX = startDisp.x + startDisp.width - newW;
          newY = startDisp.y + startDisp.height - newH;
        }

        const newPdf = displayToPdf(newX, newY, newW, newH, pgDim, displaySize);
        setAnnotations(prev => prev.map(a =>
          a.id === dragging.id
            ? { ...a, pdfX: newPdf.x, pdfY: newPdf.y, pdfWidth: newPdf.width, pdfHeight: newPdf.height }
            : a
        ));
      }
    };

    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, pageDims, currentPage, displaySize]);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editingId) return; // Don't delete while editing text
        if (selectedId) {
          setAnnotations(prev => prev.filter(a => a.id !== selectedId));
          setSelectedId(null);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setActiveTool(null);
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, editingId]);

  // ── Text editing ──

  const handleTextBlur = (annId, text) => {
    setEditingId(null);
    if (!text.trim()) {
      setAnnotations(prev => prev.filter(a => a.id !== annId));
      if (selectedId === annId) setSelectedId(null);
    } else {
      setAnnotations(prev => prev.map(a =>
        a.id === annId ? { ...a, text } : a
      ));
    }
  };

  // ── Save PDF ──

  const savePdf = async () => {
    if (!pdfBytes) return;
    setStatus('Processing…');
    try {
      let bytes = pdfBytes;

      // Fill form fields first if any
      const hasFieldValues = Object.values(fieldValues).some(v => v !== '');
      if (formFields.length > 0 && hasFieldValues) {
        const fillResult = await fillFormFields(bytes, fieldValues);
        if (fillResult.errors.length > 0) {
          const fieldErrors = fillResult.errors.filter(e => e.field !== '__flatten__');
          if (fieldErrors.length > 0) {
            setStatus(`Warning: ${fieldErrors.length} field(s) had errors. Saving anyway…`);
          }
        }
        bytes = new Uint8Array(await fillResult.blob.arrayBuffer());
      }

      // Embed annotations
      if (annotations.length > 0) {
        const result = await embedAnnotations(bytes, annotations, setStatus);
        await saveFile(result.blob, baseName(file.name) + '_signed.pdf');
      } else if (hasFieldValues) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        await saveFile(blob, baseName(file.name) + '_filled.pdf');
      } else {
        setStatus('Nothing to save — add annotations or fill fields first');
        return;
      }

      setStatus('Saved ✓');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  // ── Reset ──

  const reset = () => {
    if (prevPageImageRef.current) {
      URL.revokeObjectURL(prevPageImageRef.current);
      prevPageImageRef.current = null;
    }
    setFile(null);
    setPdfBytes(null);
    setPageCount(0);
    setCurrentPage(1);
    setPageImage(null);
    setPageDims(null);
    setFormFields([]);
    setFieldValues({});
    setAnnotations([]);
    setSelectedId(null);
    setActiveTool(null);
    setEditingId(null);
    setStatus('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevPageImageRef.current) {
        URL.revokeObjectURL(prevPageImageRef.current);
      }
    };
  }, []);

  // ── Annotations for current page ──

  const pageAnnotations = annotations.filter(a => a.pageIndex === currentPage - 1);

  // ── Render ──

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept=".pdf"
          onFiles={onFiles}
          label="Drop a PDF to fill & sign"
          sublabel="Fill form fields, add signatures, text, dates, and marks"
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
            <span style={{
              fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted,
            }}>
              {pageCount} page{pageCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tool selector */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(activeTool === t.id ? null : t.id);
                    setSelectedId(null);
                  }}
                  style={{
                    fontFamily: theme.font,
                    fontSize: 12, fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${activeTool === t.id ? theme.accent : theme.border}`,
                    background: activeTool === t.id ? theme.accentDim : 'transparent',
                    color: activeTool === t.id ? theme.accent : theme.textMuted,
                    cursor: 'pointer',
                    transition: theme.transitionFast,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tool options */}
            {activeTool && (activeTool === 'text' || activeTool === 'date') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: theme.textMuted }}>Size</span>
                  <input
                    type="range" min="8" max="36" step="1"
                    value={toolFontSize}
                    onChange={(e) => setToolFontSize(parseInt(e.target.value))}
                    style={{ width: 80 }}
                  />
                  <span style={{
                    fontSize: 11, fontFamily: theme.fontMono, color: theme.accent, minWidth: 24,
                  }}>
                    {toolFontSize}pt
                  </span>
                </div>
                <ColorPicker value={toolColor} onChange={setToolColor} />
              </div>
            )}

            {activeTool && (activeTool !== 'text' && activeTool !== 'date') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ColorPicker value={toolColor} onChange={setToolColor} />
                {(activeTool === 'signature' && savedSignature) && (
                  <button
                    onClick={() => { setSavedSignature(null); }}
                    style={{
                      fontFamily: theme.font, fontSize: 11, color: theme.textMuted,
                      background: 'none', border: 'none', cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear saved signature
                  </button>
                )}
                {(activeTool === 'initials' && savedInitials) && (
                  <button
                    onClick={() => { setSavedInitials(null); }}
                    style={{
                      fontFamily: theme.font, fontSize: 11, color: theme.textMuted,
                      background: 'none', border: 'none', cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear saved initials
                  </button>
                )}
              </div>
            )}

            {activeTool && (
              <div style={{ fontSize: 11, color: theme.textDim }}>
                Click on the PDF to place{' '}
                {activeTool === 'signature' ? 'your signature'
                  : activeTool === 'initials' ? 'your initials'
                  : activeTool === 'text' ? 'a text field'
                  : activeTool === 'date' ? "today's date"
                  : activeTool === 'checkmark' ? 'a checkmark'
                  : 'an X mark'}
              </div>
            )}
          </div>

          {/* PDF Preview */}
          {pageImage && (
            <div
              ref={containerRef}
              onClick={handlePreviewClick}
              style={{
                position: 'relative',
                width: displaySize.width,
                height: displaySize.height,
                margin: '0 auto',
                borderRadius: theme.radius,
                border: `1px solid ${theme.border}`,
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'none',
                cursor: activeTool ? 'crosshair' : 'default',
              }}
            >
              <img
                src={pageImage}
                alt={`Page ${currentPage}`}
                style={{ width: displaySize.width, height: displaySize.height, display: 'block' }}
                draggable={false}
              />

              {/* Annotation overlays */}
              {pageAnnotations.map((ann) => {
                const pgDim = pageDims[currentPage - 1];
                const disp = pdfToDisplay(
                  ann.pdfX, ann.pdfY, ann.pdfWidth, ann.pdfHeight,
                  pgDim, displaySize
                );
                const isSelected = selectedId === ann.id;
                const isEditing = editingId === ann.id;

                return (
                  <div
                    key={ann.id}
                    style={{
                      position: 'absolute',
                      left: disp.x,
                      top: disp.y,
                      width: disp.width,
                      height: disp.height,
                      border: isSelected ? `2px solid ${theme.accent}` : '1px dashed rgba(201,165,90,0.4)',
                      borderRadius: 2,
                      cursor: 'move',
                      touchAction: 'none',
                      zIndex: isSelected ? 10 : 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'rgba(201,165,90,0.05)' : 'transparent',
                    }}
                    onPointerDown={(e) => onAnnotationPointerDown(e, ann.id, 'move')}
                    onDoubleClick={() => {
                      if (ann.type === 'text' || ann.type === 'date') {
                        setEditingId(ann.id);
                      }
                    }}
                  >
                    {/* Content */}
                    {(ann.type === 'signature' || ann.type === 'initials') && ann.imageDataUrl && (
                      <img
                        src={ann.imageDataUrl}
                        alt={ann.type}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                        }}
                        draggable={false}
                      />
                    )}

                    {(ann.type === 'text' || ann.type === 'date') && (
                      isEditing ? (
                        <input
                          autoFocus
                          defaultValue={ann.text || ''}
                          onBlur={(e) => handleTextBlur(ann.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            width: '100%', height: '100%',
                            background: 'rgba(255,255,255,0.95)',
                            border: 'none', outline: 'none',
                            fontFamily: theme.font,
                            fontSize: Math.max(10, disp.height * 0.6),
                            color: ann.color,
                            padding: '0 4px',
                          }}
                        />
                      ) : (
                        <span style={{
                          fontSize: Math.max(10, disp.height * 0.6),
                          color: ann.color,
                          fontFamily: theme.font,
                          pointerEvents: 'none',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          padding: '0 4px',
                          fontWeight: 500,
                        }}>
                          {ann.text || '(click to type)'}
                        </span>
                      )
                    )}

                    {ann.type === 'checkmark' && (
                      <span style={{
                        fontSize: Math.min(disp.width, disp.height) * 0.8,
                        color: ann.color,
                        pointerEvents: 'none',
                        lineHeight: 1,
                        fontWeight: 700,
                      }}>✓</span>
                    )}

                    {ann.type === 'xmark' && (
                      <span style={{
                        fontSize: Math.min(disp.width, disp.height) * 0.8,
                        color: ann.color,
                        pointerEvents: 'none',
                        lineHeight: 1,
                        fontWeight: 700,
                      }}>✗</span>
                    )}

                    {/* Resize handles */}
                    {isSelected && !isEditing && (
                      <>
                        <Handle pos="nw" onPointerDown={(e) => onAnnotationPointerDown(e, ann.id, 'nw')} />
                        <Handle pos="ne" onPointerDown={(e) => onAnnotationPointerDown(e, ann.id, 'ne')} />
                        <Handle pos="sw" onPointerDown={(e) => onAnnotationPointerDown(e, ann.id, 'sw')} />
                        <Handle pos="se" onPointerDown={(e) => onAnnotationPointerDown(e, ann.id, 'se')} />
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnnotations(prev => prev.filter(a => a.id !== ann.id));
                            setSelectedId(null);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: -10, right: -10,
                            width: 20, height: 20,
                            borderRadius: '50%',
                            background: theme.error,
                            color: '#fff',
                            border: 'none',
                            fontSize: 12, lineHeight: 1,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 15,
                          }}
                        >×</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Page navigation */}
          {pageCount > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={navBtnStyle(currentPage <= 1)}
              >◄</button>
              <span style={{
                fontSize: 13, fontFamily: theme.fontMono, color: theme.textMuted,
              }}>
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                style={navBtnStyle(currentPage >= pageCount)}
              >►</button>
            </div>
          )}

          {/* Form fields section */}
          {formFields.length > 0 && (
            <div style={{
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowFields(!showFields)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: theme.surfaceHover,
                  border: 'none', cursor: 'pointer',
                  fontFamily: theme.font,
                  fontSize: 13, fontWeight: 600,
                  color: theme.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>Form Fields ({formFields.length})</span>
                <span style={{ fontSize: 10, color: theme.textMuted }}>
                  {showFields ? '▲' : '▼'}
                </span>
              </button>
              {showFields && (
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formFields.map((field) => (
                    <FormFieldInput
                      key={field.name}
                      field={field}
                      value={fieldValues[field.name] || ''}
                      onChange={(v) => setFieldValues(prev => ({ ...prev, [field.name]: v }))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Annotations list */}
          {annotations.length > 0 && (
            <div style={{
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              padding: 14,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: theme.text,
                marginBottom: 10,
              }}>
                Annotations ({annotations.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedId(ann.id);
                      if (ann.pageIndex !== currentPage - 1) {
                        goToPage(ann.pageIndex + 1);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: selectedId === ann.id ? theme.accentGlow : 'transparent',
                      border: `1px solid ${selectedId === ann.id ? theme.accent : theme.border}`,
                      cursor: 'pointer',
                      transition: theme.transitionFast,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>
                        {ann.type === 'signature' ? '✎' : ann.type === 'text' ? 'T'
                          : ann.type === 'date' ? '⊙' : ann.type === 'initials' ? 'I'
                          : ann.type === 'checkmark' ? '✓' : '✗'}
                      </span>
                      <span style={{ fontSize: 12, color: theme.textMuted }}>
                        {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                        {ann.text ? `: ${ann.text}` : ''}
                        <span style={{ color: theme.textDim, marginLeft: 6 }}>
                          p.{ann.pageIndex + 1}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnnotations(prev => prev.filter(a => a.id !== ann.id));
                        if (selectedId === ann.id) setSelectedId(null);
                      }}
                      style={{
                        border: 'none', background: 'none',
                        color: theme.textDim, cursor: 'pointer',
                        fontSize: 14, padding: '0 2px',
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Btn onClick={savePdf} disabled={annotations.length === 0 && !Object.values(fieldValues).some(v => v !== '')}>
              Save PDF
            </Btn>
            <StatusBadge status={status} />
          </div>
        </>
      )}

      {/* Signature Pad Modal */}
      {showSigPad && (
        <SignaturePadModal
          mode={sigPadMode}
          onDone={(dataUrl) => {
            if (sigPadMode === 'signature') {
              setSavedSignature(dataUrl);
            } else {
              setSavedInitials(dataUrl);
            }
            setShowSigPad(false);
            // Place immediately if we have a click target
          }}
          onCancel={() => setShowSigPad(false)}
        />
      )}
    </div>
  );
}

// ── Signature Pad Modal ──

function SignaturePadModal({ mode, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const undoStack = useRef([]);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a2e';
  }, []);

  const saveUndoState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(data);
    if (undoStack.current.length > 20) undoStack.current.shift();
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);
    saveUndoState();
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastPoint.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pressure = e.pressure || 0.5;
    ctx.lineWidth = 1 + pressure * 3;
    ctx.strokeStyle = '#1a1a2e';

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPoint.current = { x, y };
    setHasContent(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const undo = () => {
    if (undoStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = undoStack.current.pop();
    ctx.putImageData(data, 0, 0);
    // Check if canvas is now empty
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = !imgData.data.some((v, i) => i % 4 !== 3 && v < 240);
    setHasContent(!isEmpty);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    saveUndoState();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const done = () => {
    const canvas = canvasRef.current;
    const dataUrl = processSignatureImage(canvas);
    if (dataUrl) onDone(dataUrl);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        padding: 24,
        width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
          Draw your {mode === 'initials' ? 'initials' : 'signature'}
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          style={{
            width: '100%',
            height: 150,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            cursor: 'crosshair',
            touchAction: 'none',
            background: '#ffffff',
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small secondary onClick={clear}>Clear</Btn>
          <Btn small secondary onClick={undo} disabled={undoStack.current.length === 0}>Undo</Btn>
          <div style={{ flex: 1 }} />
          <Btn small secondary onClick={onCancel}>Cancel</Btn>
          <Btn small onClick={done} disabled={!hasContent}>Done</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Resize Handle ──

function Handle({ pos, onPointerDown }) {
  const cursors = { nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize' };
  const positions = {
    nw: { top: -6, left: -6 },
    ne: { top: -6, right: -6 },
    sw: { bottom: -6, left: -6 },
    se: { bottom: -6, right: -6 },
  };

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        ...positions[pos],
        width: 12, height: 12,
        background: theme.accent,
        borderRadius: 2,
        cursor: cursors[pos],
        zIndex: 15,
        border: `1.5px solid ${theme.bg}`,
        touchAction: 'none',
      }}
    />
  );
}

// ── Color Picker ──

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: theme.textMuted, marginRight: 4 }}>Color</span>
      {DEFAULT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 20, height: 20,
            borderRadius: '50%',
            background: c,
            border: value === c ? `2px solid ${theme.accent}` : `2px solid ${theme.border}`,
            cursor: 'pointer',
            transition: theme.transitionFast,
          }}
        />
      ))}
    </div>
  );
}

// ── Form Field Input ──

function FormFieldInput({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: theme.text, cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          style={{ accentColor: theme.accent }}
        />
        {field.name}
      </label>
    );
  }

  if (field.type === 'dropdown' || field.type === 'optionlist') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>
          {field.name}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          multiple={field.type === 'optionlist'}
          style={{
            padding: '7px 10px',
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
            color: theme.text,
            fontFamily: theme.font,
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="">— Select —</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>
          {field.name}
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(field.options || []).map((opt) => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, color: theme.text, cursor: 'pointer',
            }}>
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                style={{ accentColor: theme.accent }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Default: text input
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>
        {field.name}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.name}
        style={{
          padding: '7px 10px',
          borderRadius: 6,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          color: theme.text,
          fontFamily: theme.font,
          fontSize: 13,
          outline: 'none',
          transition: theme.transitionFast,
        }}
        onFocus={(e) => e.target.style.borderColor = theme.accent}
        onBlur={(e) => e.target.style.borderColor = theme.border}
      />
    </div>
  );
}

// ── Helpers ──

function navBtnStyle(disabled) {
  return {
    fontFamily: theme.font,
    fontSize: 14,
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    background: 'transparent',
    color: disabled ? theme.textDim : theme.textMuted,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: theme.transitionFast,
  };
}
