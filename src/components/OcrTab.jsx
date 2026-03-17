import { useState, useEffect } from 'react';
import { theme } from '../lib/theme';
import { ocrImage, ocrPdf, LANGUAGES, destroyOcrEngine } from '../lib/ocrEngine';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function OcrTab() {
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState('eng');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { text, confidence } or { fullText, pages }
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => { destroyOcrEngine(); };
  }, []);

  const onFiles = (files) => {
    const f = files[0];
    if (!f) return;
    const isImage = f.type.startsWith('image/');
    const isPdf = f.type === 'application/pdf';
    if (!isImage && !isPdf) return;
    setFile(f);
    setResult(null);
    setStatus('');
    setCopied(false);
  };

  const process = async () => {
    if (!file) return;
    setResult(null);
    setCopied(false);

    try {
      if (file.type === 'application/pdf') {
        const res = await ocrPdf(file, lang, setStatus);
        setResult(res);
        setStatus(`OCR complete ✓ (${res.pages.length} pages, avg confidence: ${Math.round(res.pages.reduce((s, p) => s + p.confidence, 0) / res.pages.length)}%)`);
      } else {
        const res = await ocrImage(file, lang, setStatus);
        setResult(res);
        setStatus(`OCR complete ✓ (confidence: ${Math.round(res.confidence)}%)`);
      }
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const copyText = async () => {
    const text = result?.fullText || result?.text || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadText = () => {
    const text = result?.fullText || result?.text || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name?.replace(/\.[^.]+$/, '') || 'ocr') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('');
  };

  const fullText = result?.fullText || result?.text || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*,.pdf"
          onFiles={onFiles}
          label="Drop an image or PDF to extract text"
          sublabel="OCR runs locally using Tesseract — your files never leave your device"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {/* Language selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
              Language
            </span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                color: theme.text,
                fontSize: 13,
                fontFamily: theme.font,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={process} disabled={status.includes('…') && !status.includes('✓')}>
              Extract Text
            </Btn>
            <StatusBadge status={status} />
          </div>

          {/* Results */}
          {fullText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: theme.text,
                }}>
                  Extracted Text
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn small secondary onClick={copyText}>
                    {copied ? 'Copied ✓' : 'Copy'}
                  </Btn>
                  <Btn small secondary onClick={downloadText}>
                    Download .txt
                  </Btn>
                </div>
              </div>

              <textarea
                readOnly
                value={fullText}
                style={{
                  width: '100%',
                  minHeight: 240,
                  padding: 14,
                  borderRadius: theme.radius,
                  border: `1px solid ${theme.border}`,
                  background: theme.surfaceAlt,
                  color: theme.text,
                  fontSize: 13,
                  fontFamily: theme.fontMono,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />

              {/* Per-page confidence (for PDFs) */}
              {result?.pages && result.pages.length > 1 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                }}>
                  {result.pages.map(p => (
                    <div
                      key={p.pageNum}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: p.confidence > 70 ? theme.successDim : theme.errorDim,
                        border: `1px solid ${p.confidence > 70 ? 'rgba(90,184,122,0.2)' : 'rgba(201,90,90,0.2)'}`,
                        fontSize: 11,
                        fontFamily: theme.fontMono,
                        color: p.confidence > 70 ? theme.success : theme.error,
                      }}
                    >
                      Page {p.pageNum}: {Math.round(p.confidence)}%
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
