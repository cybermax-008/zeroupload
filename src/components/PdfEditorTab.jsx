import { useState, useRef, useEffect, useCallback } from 'react';
import Moveable from 'react-moveable';
import { theme } from '../lib/theme';
import { DropZone, Btn } from './ui';
import { loadPdf, renderPageToCanvas, exportEditedPdf } from '../lib/pdfEditEngine';

const TOOLS = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'highlight', label: 'Highlight', icon: '■' },
  { id: 'whiteout', label: 'White-out', icon: '□' },
  { id: 'image', label: 'Image', icon: '⊞' },
];

const FONTS = ['Helvetica', 'Courier', 'TimesRoman'];

let nextId = 1;
function genId() { return `el_${nextId++}`; }

// Pick a render scale that won't blow up mobile memory
function getRenderScale() {
  const w = window.innerWidth || 800;
  if (w < 600) return 1;
  if (w < 1024) return 1.25;
  return 1.5;
}

export default function PdfEditorTab() {
  const [pdfState, setPdfState] = useState(null);  // { doc, bytes, totalPages }
  const [activeTool, setActiveTool] = useState('select');
  const [elements, setElements] = useState({});     // { [pageNum]: [...] }
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState('');
  const [viewports, setViewports] = useState({});
  const [fileName, setFileName] = useState('');
  const [rendering, setRendering] = useState(false);

  const pagesContainerRef = useRef(null);
  const canvasRefs = useRef({});
  const targetRef = useRef(null);
  const imageInputRef = useRef(null);
  const pendingImagePage = useRef(null);
  const renderScaleRef = useRef(getRenderScale());

  // ── Load PDF ──
  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') return;
    setStatus('Loading PDF…');
    setFileName(file.name);
    try {
      const result = await loadPdf(file);
      setPdfState(result);
      setElements({});
      setSelectedId(null);
      setViewports({});
      setRendering(true);
      setStatus('');
    } catch (e) {
      setStatus('Failed to load PDF: ' + e.message);
    }
  }, []);

  // ── Render pages — waits for canvases to mount ──
  useEffect(() => {
    if (!pdfState || !rendering) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // 20 x 100ms = 2s max wait

    const tryRender = async () => {
      // Wait for at least the first canvas to mount
      const firstCanvas = canvasRefs.current[1];
      if (!firstCanvas && attempts < maxAttempts) {
        attempts++;
        setTimeout(tryRender, 100);
        return;
      }

      if (cancelled) return;

      const newViewports = {};
      const scale = renderScaleRef.current;

      for (let p = 1; p <= pdfState.totalPages; p++) {
        const canvas = canvasRefs.current[p];
        if (!canvas) continue;
        try {
          const vp = await renderPageToCanvas(pdfState.doc, p, scale, canvas);
          newViewports[p] = { width: vp.width, height: vp.height, scale };
        } catch (err) {
          console.error(`[PdfEditor] Failed to render page ${p}:`, err);
          setStatus(`Failed to render page ${p}`);
        }
      }

      if (!cancelled) {
        setViewports(newViewports);
        setRendering(false);
        if (Object.keys(newViewports).length === 0) {
          setStatus('Failed to render PDF pages. Try a different file.');
        }
      }
    };

    tryRender();
    return () => { cancelled = true; };
  }, [pdfState, rendering]);

  // ── Auto-fit zoom for mobile ──
  useEffect(() => {
    if (!pdfState) return;
    const containerWidth = pagesContainerRef.current?.clientWidth;
    const vp1 = viewports[1];
    if (containerWidth && vp1 && vp1.width > containerWidth - 40) {
      setZoom(Math.max(0.3, (containerWidth - 40) / vp1.width));
    }
  }, [viewports, pdfState]);

  // ── Keyboard: Delete selected element ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const active = document.activeElement;
        if (active?.contentEditable === 'true' || active?.tagName === 'INPUT') return;
        e.preventDefault();
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId]);

  // ── Element CRUD ──
  const addElement = useCallback((type, pageNum, x, y, extra = {}) => {
    const z = zoom || 1;
    const defaults = {
      text: { width: 160 / z, height: 28 / z, text: 'Text', fontSize: 14, fontFamily: 'Helvetica', color: '#000000', opacity: 1 },
      rectangle: { width: 120 / z, height: 80 / z, fill: 'transparent', borderColor: '#ff0000', borderWidth: 2, opacity: 1 },
      highlight: { width: 120 / z, height: 24 / z, opacity: 0.35 },
      whiteout: { width: 120 / z, height: 24 / z, opacity: 1 },
      image: { width: 150 / z, height: 150 / z, imageData: null, opacity: 1 },
    };
    const id = genId();
    const el = { id, type, pageNum, x: x / z, y: y / z, ...defaults[type], ...extra };
    setElements(prev => ({
      ...prev,
      [pageNum]: [...(prev[pageNum] || []), el],
    }));
    setSelectedId(id);
    setActiveTool('select');
    return id;
  }, [zoom]);

  const updateElement = useCallback((id, updates) => {
    setElements(prev => {
      const next = { ...prev };
      for (const pn of Object.keys(next)) {
        const idx = next[pn].findIndex(e => e.id === id);
        if (idx >= 0) {
          next[pn] = [...next[pn]];
          next[pn][idx] = { ...next[pn][idx], ...updates };
          break;
        }
      }
      return next;
    });
  }, []);

  const deleteElement = useCallback((id) => {
    setSelectedId(null);
    setElements(prev => {
      const next = { ...prev };
      for (const pn of Object.keys(next)) {
        next[pn] = next[pn].filter(e => e.id !== id);
      }
      return next;
    });
  }, []);

  const getSelectedElement = () => {
    for (const pn of Object.keys(elements)) {
      const el = elements[pn]?.find(e => e.id === selectedId);
      if (el) return el;
    }
    return null;
  };

  // ── Page click handler — add elements ──
  const handlePageClick = useCallback((e, pageNum) => {
    if (activeTool === 'select') {
      if (e.target.tagName === 'CANVAS' || e.target.dataset.overlay) {
        setSelectedId(null);
      }
      return;
    }
    if (activeTool === 'image') {
      const rect = e.currentTarget.getBoundingClientRect();
      pendingImagePage.current = { pageNum, x: e.clientX - rect.left, y: e.clientY - rect.top };
      imageInputRef.current?.click();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addElement(activeTool, pageNum, x, y);
  }, [activeTool, addElement]);

  // ── Image upload handler ──
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingImagePage.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { pageNum, x, y } = pendingImagePage.current;
      addElement('image', pageNum, x, y, { imageData: reader.result });
      pendingImagePage.current = null;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [addElement]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!pdfState) return;
    setStatus('Exporting…');
    try {
      const result = await exportEditedPdf(pdfState.bytes, elements, viewports);
      const outName = fileName.replace(/\.pdf$/i, '') + '_edited.pdf';
      result.download(outName);
      setStatus('Exported successfully');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      setStatus('Export failed: ' + e.message);
    }
  }, [pdfState, elements, viewports, fileName]);

  const selectedEl = getSelectedElement();

  // ── No PDF loaded ──
  if (!pdfState) {
    return (
      <DropZone
        accept=".pdf"
        label="Drop a PDF file here to start editing"
        onFiles={(files) => handleFile(files[0])}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        flexWrap: 'wrap',
      }}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
            style={{
              fontFamily: theme.font,
              fontSize: 12, fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${activeTool === t.id ? theme.accent : theme.border}`,
              background: activeTool === t.id ? theme.accentDim : 'transparent',
              color: activeTool === t.id ? theme.accent : theme.textMuted,
              cursor: 'pointer',
              transition: theme.transition,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            <span className="tool-label" style={{ fontSize: 11 }}>{t.label}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} style={zoomBtnStyle}>-</button>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: theme.fontMono, width: 40, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} style={zoomBtnStyle}>+</button>
        </div>

        <Btn onClick={handleExport} accent style={{ marginLeft: 4 }}>
          Export
        </Btn>
      </div>

      {/* ── Properties panel ── */}
      {selectedEl && (
        <PropertiesPanel element={selectedEl} onChange={updateElement} onDelete={() => deleteElement(selectedEl.id)} />
      )}

      {/* ── Status ── */}
      {(status || rendering) && (
        <div style={{ fontSize: 12, color: theme.accent, padding: '4px 0' }}>
          {rendering ? 'Rendering pages…' : status}
        </div>
      )}

      {/* ── Pages ── */}
      <div
        ref={pagesContainerRef}
        style={{
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxHeight: '70vh',
          background: theme.bg,
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          padding: 16,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}
      >
        {Array.from({ length: pdfState.totalPages }, (_, i) => i + 1).map(pageNum => {
          const vp = viewports[pageNum];
          const pageW = vp ? vp.width * zoom : 300;
          const pageH = vp ? vp.height * zoom : 400;
          return (
            <div key={pageNum} style={{ position: 'relative', maxWidth: '100%' }}>
              <div style={{
                fontSize: 10, color: theme.textDim, marginBottom: 4,
                textAlign: 'center', fontFamily: theme.fontMono,
              }}>
                Page {pageNum} of {pdfState.totalPages}
              </div>

              <div
                style={{
                  position: 'relative',
                  width: pageW,
                  height: pageH,
                  maxWidth: '100%',
                  cursor: activeTool !== 'select' ? 'crosshair' : 'default',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: '#fff',
                }}
                onClick={(e) => handlePageClick(e, pageNum)}
              >
                <canvas
                  ref={el => { canvasRefs.current[pageNum] = el; }}
                  style={{
                    display: 'block',
                    width: pageW,
                    height: pageH,
                    maxWidth: '100%',
                  }}
                />

                {/* Overlay container */}
                <div
                  data-overlay="true"
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  {(elements[pageNum] || []).map(el => (
                    <ElementOverlay
                      key={el.id}
                      element={el}
                      zoom={zoom}
                      isSelected={el.id === selectedId}
                      onSelect={() => { setSelectedId(el.id); setActiveTool('select'); }}
                      onChange={(updates) => updateElement(el.id, updates)}
                    />
                  ))}
                </div>

                {/* Moveable for selected element */}
                {selectedId && selectedEl?.pageNum === pageNum && (
                  <MoveableWrapper
                    element={selectedEl}
                    zoom={zoom}
                    onChange={(updates) => updateElement(selectedId, updates)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}

// ══════════════════════════════════════════
// ElementOverlay
// ══════════════════════════════════════════
function ElementOverlay({ element: el, zoom, isSelected, onSelect, onChange }) {
  const ref = useRef(null);

  const baseStyle = {
    position: 'absolute',
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.width * zoom,
    height: el.height * zoom,
    pointerEvents: 'auto',
    cursor: 'pointer',
    outline: isSelected ? `2px solid ${theme.accent}` : 'none',
    boxSizing: 'border-box',
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect();
  };

  if (el.type === 'text') {
    return (
      <div
        ref={ref}
        data-element-id={el.id}
        className="editor-element"
        style={{
          ...baseStyle,
          fontSize: el.fontSize * zoom,
          fontFamily: el.fontFamily || 'Helvetica, sans-serif',
          color: el.color || '#000',
          opacity: el.opacity ?? 1,
          lineHeight: 1.3,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
        }}
        onClick={handleClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.currentTarget.contentEditable = 'true';
          e.currentTarget.focus();
        }}
        onBlur={(e) => {
          e.currentTarget.contentEditable = 'false';
          onChange({ text: e.currentTarget.textContent });
        }}
        suppressContentEditableWarning
      >
        {el.text}
      </div>
    );
  }

  if (el.type === 'rectangle') {
    return (
      <div
        ref={ref}
        data-element-id={el.id}
        className="editor-element"
        style={{
          ...baseStyle,
          backgroundColor: el.fill === 'transparent' ? 'transparent' : el.fill,
          border: `${(el.borderWidth || 2) * zoom}px solid ${el.borderColor || '#ff0000'}`,
          opacity: el.opacity ?? 1,
        }}
        onClick={handleClick}
      />
    );
  }

  if (el.type === 'highlight') {
    return (
      <div
        ref={ref}
        data-element-id={el.id}
        className="editor-element"
        style={{
          ...baseStyle,
          backgroundColor: 'rgba(255, 235, 0, 0.35)',
          borderRadius: 2,
        }}
        onClick={handleClick}
      />
    );
  }

  if (el.type === 'whiteout') {
    return (
      <div
        ref={ref}
        data-element-id={el.id}
        className="editor-element"
        style={{
          ...baseStyle,
          backgroundColor: '#ffffff',
        }}
        onClick={handleClick}
      />
    );
  }

  if (el.type === 'image') {
    return (
      <div
        ref={ref}
        data-element-id={el.id}
        className="editor-element"
        style={{
          ...baseStyle,
          opacity: el.opacity ?? 1,
        }}
        onClick={handleClick}
      >
        {el.imageData && (
          <img
            src={el.imageData}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          />
        )}
      </div>
    );
  }

  return null;
}

// ══════════════════════════════════════════
// MoveableWrapper
// ══════════════════════════════════════════
function MoveableWrapper({ element, zoom, onChange }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    // Small delay to ensure DOM is ready after React render
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-element-id="${element.id}"]`);
      if (el) setTarget(el);
    }, 0);
    return () => clearTimeout(t);
  }, [element.id]);

  if (!target) return null;

  return (
    <Moveable
      target={target}
      draggable={true}
      resizable={true}
      origin={false}
      throttleDrag={0}
      throttleResize={0}
      renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
      onDrag={({ left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      }}
      onDragEnd={({ lastEvent }) => {
        if (lastEvent) {
          onChange({
            x: lastEvent.left / zoom,
            y: lastEvent.top / zoom,
          });
        }
      }}
      onResize={({ width, height, drag: { left, top } }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      }}
      onResizeEnd={({ lastEvent }) => {
        if (lastEvent) {
          onChange({
            width: lastEvent.width / zoom,
            height: lastEvent.height / zoom,
            x: lastEvent.drag.left / zoom,
            y: lastEvent.drag.top / zoom,
          });
        }
      }}
    />
  );
}

// ══════════════════════════════════════════
// PropertiesPanel
// ══════════════════════════════════════════
function PropertiesPanel({ element: el, onChange, onDelete }) {
  const update = (key, value) => onChange(el.id, { [key]: value });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flexWrap: 'wrap',
      padding: '8px 12px',
      borderRadius: 6,
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      fontSize: 12,
    }}>
      <span style={{ fontWeight: 600, color: theme.text, textTransform: 'capitalize' }}>
        {el.type}
      </span>

      {el.type === 'text' && (
        <>
          <label style={propLabelStyle}>
            Font
            <select
              value={el.fontFamily || 'Helvetica'}
              onChange={(e) => update('fontFamily', e.target.value)}
              style={propInputStyle}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label style={propLabelStyle}>
            Size
            <input
              type="number"
              value={el.fontSize || 14}
              onChange={(e) => update('fontSize', Number(e.target.value))}
              min={6} max={120} step={1}
              style={{ ...propInputStyle, width: 50 }}
            />
          </label>
          <label style={propLabelStyle}>
            Color
            <input
              type="color"
              value={el.color || '#000000'}
              onChange={(e) => update('color', e.target.value)}
              style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
            />
          </label>
        </>
      )}

      {el.type === 'rectangle' && (
        <>
          <label style={propLabelStyle}>
            Border
            <input
              type="color"
              value={el.borderColor || '#ff0000'}
              onChange={(e) => update('borderColor', e.target.value)}
              style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
            />
          </label>
          <label style={propLabelStyle}>
            Fill
            <input
              type="color"
              value={el.fill === 'transparent' ? '#ffffff' : (el.fill || '#ffffff')}
              onChange={(e) => update('fill', e.target.value)}
              style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
            />
          </label>
          <label style={propLabelStyle}>
            Width
            <input
              type="number"
              value={el.borderWidth || 2}
              onChange={(e) => update('borderWidth', Number(e.target.value))}
              min={0} max={20} step={1}
              style={{ ...propInputStyle, width: 45 }}
            />
          </label>
        </>
      )}

      {(el.type === 'text' || el.type === 'rectangle' || el.type === 'image') && (
        <label style={propLabelStyle}>
          Opacity
          <input
            type="range"
            value={el.opacity ?? 1}
            onChange={(e) => update('opacity', Number(e.target.value))}
            min={0} max={1} step={0.05}
            style={{ width: 60 }}
          />
        </label>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={onDelete}
        style={{
          fontFamily: theme.font,
          fontSize: 11, fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 4,
          border: `1px solid ${theme.error}`,
          background: 'transparent',
          color: theme.error,
          cursor: 'pointer',
        }}
      >
        Delete
      </button>
    </div>
  );
}

// ── Shared styles ──
const zoomBtnStyle = {
  fontFamily: 'inherit',
  fontSize: 14, fontWeight: 600,
  width: 26, height: 26,
  borderRadius: 4,
  border: `1px solid ${theme.border}`,
  background: 'transparent',
  color: theme.textMuted,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const propLabelStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  color: theme.textMuted, fontSize: 11, fontWeight: 500,
};

const propInputStyle = {
  fontFamily: 'inherit',
  fontSize: 11,
  padding: '2px 6px',
  borderRadius: 4,
  border: `1px solid ${theme.border}`,
  background: theme.bg,
  color: theme.text,
};
