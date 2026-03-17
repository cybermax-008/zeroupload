import { useState, useRef, useEffect, useCallback } from 'react';
import { theme } from '../lib/theme';
import { initPdfRenderer } from '../lib/pdfRenderEngine';
import { PDFDocument } from 'pdf-lib';
import { saveFile, baseName, readAsArrayBuffer } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfFillSignTab() {
  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageUrl, setPageUrl] = useState(null);
  const [pageDims, setPageDims] = useState({ w: 0, h: 0 });
  const [formFields, setFormFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('form'); // 'form' | 'sign'

  // Signature state
  const [sigData, setSigData] = useState(null);
  const [sigPosition, setSigPosition] = useState(null); // { x, y, pageNum }
  const [placing, setPlacing] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (f?.type !== 'application/pdf') return;
    setFile(f);
    setStatus('');
    setSigData(null);
    setSigPosition(null);

    const bytes = await readAsArrayBuffer(f);
    setPdfBytes(bytes);

    // Detect form fields
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      const fields = form.getFields();
      const detected = fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name,
      }));
      setFormFields(detected);
      setFieldValues({});
    } catch {
      setFormFields([]);
    }

    // Render first page
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

  // Signature drawing
  const initSignatureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (mode === 'sign') initSignatureCanvas();
  }, [mode, initSignatureCanvas]);

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getCanvasPoint(e);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const clearSignature = () => {
    setSigData(null);
    initSignatureCanvas();
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setSigData(dataUrl);
    setPlacing(true);
  };

  const handlePageClick = (e) => {
    if (!placing || !sigData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSigPosition({ x, y, pageNum: currentPage });
    setPlacing(false);
  };

  const savePdf = async () => {
    if (!pdfBytes) return;
    setStatus('Saving…');
    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const scale = 1.5;

      // Fill form fields
      if (formFields.length > 0) {
        const form = doc.getForm();
        for (const [name, value] of Object.entries(fieldValues)) {
          if (!value) continue;
          try {
            const field = form.getField(name);
            if (field.constructor.name === 'PDFTextField') {
              field.setText(value);
            } else if (field.constructor.name === 'PDFCheckBox') {
              if (value === 'true') field.check();
              else field.uncheck();
            }
          } catch { /* skip unrecognized fields */ }
        }
        try { form.flatten(); } catch { /* some forms can't be flattened */ }
      }

      // Embed signature
      if (sigData && sigPosition) {
        const sigResponse = await fetch(sigData);
        const sigArrayBuffer = await sigResponse.arrayBuffer();
        const sigImage = await doc.embedPng(new Uint8Array(sigArrayBuffer));

        const page = doc.getPage(sigPosition.pageNum - 1);
        const { height: pageHeight } = page.getSize();
        const sigWidth = 150;
        const sigHeight = 60;

        page.drawImage(sigImage, {
          x: sigPosition.x / scale,
          y: pageHeight - (sigPosition.y / scale) - sigHeight,
          width: sigWidth,
          height: sigHeight,
        });
      }

      const savedBytes = await doc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      await saveFile(blob, baseName(file.name) + '_signed.pdf');
      setStatus('Saved ✓');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    if (pageUrl) URL.revokeObjectURL(pageUrl);
    setFile(null);
    setPdfBytes(null);
    setFormFields([]);
    setFieldValues({});
    setSigData(null);
    setSigPosition(null);
    setPageUrl(null);
    setStatus('');
  };

  const inputStyle = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 13,
    fontFamily: theme.font,
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept=".pdf"
          onFiles={onFiles}
          label="Drop a PDF to fill & sign"
          sublabel="Fill forms and add your signature — all on your device"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: 2, background: theme.surface,
            borderRadius: 8, padding: 3, border: `1px solid ${theme.border}`,
            alignSelf: 'flex-start',
          }}>
            {[['form', 'Form Fields'], ['sign', 'Signature']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                style={{
                  fontFamily: theme.font, fontSize: 12, fontWeight: 500,
                  padding: '6px 16px', borderRadius: 6, border: 'none',
                  background: mode === v ? theme.accentDim : 'transparent',
                  color: mode === v ? theme.accent : theme.textMuted,
                  cursor: 'pointer', transition: theme.transitionFast,
                }}
              >{l}</button>
            ))}
          </div>

          {/* Form fields mode */}
          {mode === 'form' && (
            <>
              {formFields.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formFields.map((field) => (
                    <div key={field.name} style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <label style={{
                        fontSize: 12, color: theme.textMuted, fontWeight: 500,
                      }}>
                        {field.name}
                        <span style={{
                          fontSize: 10, color: theme.textDim, marginLeft: 8,
                        }}>
                          ({field.type.replace('PDF', '').replace('Field', '')})
                        </span>
                      </label>
                      {field.type === 'PDFCheckBox' ? (
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 12, color: theme.text, cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={fieldValues[field.name] === 'true'}
                            onChange={(e) => setFieldValues(prev => ({
                              ...prev,
                              [field.name]: e.target.checked ? 'true' : 'false',
                            }))}
                          />
                          Checked
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))}
                          placeholder={`Enter ${field.name}`}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = theme.accent}
                          onBlur={(e) => e.target.style.borderColor = theme.border}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: 16, background: theme.surfaceAlt,
                  borderRadius: theme.radius, border: `1px solid ${theme.border}`,
                  fontSize: 12, color: theme.textMuted,
                }}>
                  No fillable form fields detected. Switch to Signature mode to sign this PDF.
                </div>
              )}
            </>
          )}

          {/* Signature mode */}
          {mode === 'sign' && (
            <>
              {!sigData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
                    Draw your signature below
                  </span>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: theme.radius,
                      cursor: 'crosshair',
                      touchAction: 'none',
                      maxWidth: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn small onClick={captureSignature}>Use This Signature</Btn>
                    <Btn small secondary onClick={clearSignature}>Clear</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>
                    Signature captured
                  </span>
                  <img
                    src={sigData}
                    alt="Signature"
                    style={{
                      maxWidth: 200, border: `1px solid ${theme.border}`,
                      borderRadius: 6, background: '#fff',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    {!sigPosition ? (
                      <Btn small onClick={() => setPlacing(true)}>
                        Place on PDF
                      </Btn>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.success }}>
                        Placed on page {sigPosition.pageNum} ✓
                      </span>
                    )}
                    <Btn small secondary onClick={clearSignature}>Redo Signature</Btn>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Page navigation */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          {placing && (
            <div style={{
              fontSize: 12, color: theme.accent, fontWeight: 500,
            }}>
              Click on the PDF to place your signature
            </div>
          )}

          {/* PDF preview */}
          {pageUrl && (
            <div
              onClick={handlePageClick}
              style={{
                position: 'relative',
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                overflow: 'hidden',
                cursor: placing ? 'crosshair' : 'default',
                alignSelf: 'center',
                maxWidth: '100%',
              }}
            >
              <img
                src={pageUrl}
                alt={`Page ${currentPage}`}
                draggable={false}
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
              {/* Show placed signature */}
              {sigData && sigPosition && sigPosition.pageNum === currentPage && (
                <img
                  src={sigData}
                  alt="Signature"
                  style={{
                    position: 'absolute',
                    left: sigPosition.x,
                    top: sigPosition.y - 30,
                    width: 150,
                    height: 60,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    opacity: 0.9,
                  }}
                />
              )}
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={savePdf}>Save PDF</Btn>
            <StatusBadge status={status} />
          </div>
        </>
      )}
    </div>
  );
}
