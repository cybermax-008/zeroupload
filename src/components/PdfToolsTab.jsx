import { useState } from 'react';
import { theme } from '../lib/theme';
import {
  mergePdfs, splitPdf, getPdfPageCount,
  rotatePdf, watermarkPdf, addPageNumbers, compressPdf,
} from '../lib/pdfEngine';
import { humanSize } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, ArrowBtn } from './ui';

const MODES = [
  { id: 'merge', label: 'Merge' },
  { id: 'split', label: 'Split' },
  { id: 'rotate', label: 'Rotate' },
  { id: 'compress', label: 'Compress' },
  { id: 'watermark', label: 'Watermark' },
  { id: 'pagenums', label: 'Page #s' },
];

const SINGLE_FILE_MODES = ['split', 'rotate', 'compress', 'watermark', 'pagenums'];

export default function PdfToolsTab({ defaultMode }) {
  const [mode, setMode] = useState(defaultMode || 'merge');
  const [files, setFiles] = useState([]);
  const [splitRange, setSplitRange] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState('');

  // Rotate state
  const [rotation, setRotation] = useState(90);
  const [rotateRange, setRotateRange] = useState('');

  // Compress state
  const [compressQuality, setCompressQuality] = useState(0.5);
  const [inputSize, setInputSize] = useState(0);
  const [outputSize, setOutputSize] = useState(null);

  // Watermark state
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(0.15);
  const [wmDiagonal, setWmDiagonal] = useState(true);

  // Page numbers state
  const [pnFormat, setPnFormat] = useState('Page {n} of {total}');
  const [pnPosition, setPnPosition] = useState('bottom-center');
  const [pnFontSize, setPnFontSize] = useState(11);

  const loadSinglePdf = async (pdf) => {
    setFiles([pdf]);
    setInputSize(pdf.size);
    try {
      const pc = await getPdfPageCount(pdf);
      setPageCount(pc);
      setSplitRange(`1-${pc}`);
    } catch (e) {
      setStatus('Error reading PDF: ' + e.message);
    }
  };

  const onFiles = async (newFiles) => {
    const pdfs = newFiles.filter(f =>
      f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    if (!pdfs.length) return;
    setStatus('');
    setOutputSize(null);

    if (SINGLE_FILE_MODES.includes(mode)) {
      await loadSinglePdf(pdfs[0]);
    } else {
      setFiles(prev => [...prev, ...pdfs]);
    }
  };

  const remove = (i) => setFiles(p => p.filter((_, j) => j !== i));

  const moveUp = (i) => {
    if (i === 0) return;
    setFiles(p => {
      const a = [...p];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  };

  const switchMode = (v) => {
    setMode(v);
    setFiles([]);
    setStatus('');
    setPageCount(0);
    setSplitRange('');
    setOutputSize(null);
    setInputSize(0);
  };

  const doMerge = async () => {
    if (files.length < 2) return;
    try {
      const result = await mergePdfs(files, setStatus);
      result.download();
      setStatus(`Merged ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const doSplit = async () => {
    if (!files.length) return;
    try {
      const result = await splitPdf(files[0], splitRange, setStatus);
      result.download();
      setStatus(`Extracted ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const doRotate = async () => {
    if (!files.length) return;
    try {
      const result = await rotatePdf(
        files[0], rotation,
        rotateRange.trim() || null,
        setStatus
      );
      result.download();
      setStatus(`Rotated ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const doCompress = async () => {
    if (!files.length) return;
    try {
      const result = await compressPdf(files[0], compressQuality, setStatus);
      setOutputSize(result.blob.size);
      result.download();
      setStatus(`Compressed ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const doWatermark = async () => {
    if (!files.length || !wmText.trim()) return;
    try {
      const result = await watermarkPdf(files[0], wmText.trim(), {
        fontSize: wmFontSize,
        opacity: wmOpacity,
        diagonal: wmDiagonal,
      }, setStatus);
      result.download();
      setStatus(`Watermarked ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const doPageNumbers = async () => {
    if (!files.length) return;
    try {
      const result = await addPageNumbers(files[0], {
        format: pnFormat,
        position: pnPosition,
        fontSize: pnFontSize,
      }, setStatus);
      result.download();
      setStatus(`Numbered ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const getAction = () => {
    switch (mode) {
      case 'merge': return { fn: doMerge, label: 'Merge', disabled: files.length < 2 };
      case 'split': return { fn: doSplit, label: 'Extract Pages', disabled: !files.length };
      case 'rotate': return { fn: doRotate, label: 'Rotate', disabled: !files.length };
      case 'compress': return { fn: doCompress, label: 'Compress', disabled: !files.length };
      case 'watermark': return { fn: doWatermark, label: 'Add Watermark', disabled: !files.length || !wmText.trim() };
      case 'pagenums': return { fn: doPageNumbers, label: 'Add Numbers', disabled: !files.length };
      default: return { fn: () => {}, label: 'Go', disabled: true };
    }
  };

  const getDropLabel = () => {
    switch (mode) {
      case 'merge': return 'Drop multiple PDFs to combine';
      case 'split': return 'Drop a single PDF to extract pages';
      case 'rotate': return 'Drop a PDF to rotate pages';
      case 'compress': return 'Drop a PDF to compress';
      case 'watermark': return 'Drop a PDF to add a watermark';
      case 'pagenums': return 'Drop a PDF to add page numbers';
      default: return 'Drop a PDF';
    }
  };

  const action = getAction();
  const compressReduction = outputSize !== null
    ? Math.round((1 - outputSize / inputSize) * 100)
    : null;

  const textInputStyle = {
    padding: '7px 10px',
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 13, fontFamily: theme.fontMono,
    outline: 'none',
    transition: theme.transitionFast,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode selector — wrapping flex layout */}
      <div style={{
        display: 'flex', gap: 4, flexWrap: 'wrap',
      }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            style={{
              fontFamily: theme.font,
              fontSize: 11, fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${mode === m.id ? 'rgba(201,165,90,0.2)' : theme.border}`,
              background: mode === m.id ? theme.accentDim : theme.surface,
              color: mode === m.id ? theme.accent : theme.textMuted,
              cursor: 'pointer',
              transition: theme.transitionFast,
              whiteSpace: 'nowrap',
            }}
          >{m.label}</button>
        ))}
      </div>

      <DropZone
        accept=".pdf,application/pdf"
        multiple={mode === 'merge'}
        onFiles={onFiles}
        label={getDropLabel()}
        compact={files.length > 0}
      />

      {files.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileChip
                  name={f.name} size={f.size}
                  index={mode === 'merge' ? i : undefined}
                  onRemove={() => remove(i)}
                />
                {mode === 'merge' && i > 0 && (
                  <ArrowBtn direction="up" onClick={() => moveUp(i)} />
                )}
              </div>
            ))}
          </div>

          {/* Split range input */}
          {mode === 'split' && pageCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 10, flexWrap: 'wrap',
            }}>
              <span style={{ color: theme.textMuted, fontSize: 12 }}>
                Pages{' '}
                <span style={{
                  fontFamily: theme.fontMono,
                  color: theme.accent,
                }}>{pageCount}</span>{' '}
                total
              </span>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                style={{ ...textInputStyle, width: 180 }}
                onFocus={(e) => e.target.style.borderColor = theme.accent}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
              <span style={{ color: theme.textDim, fontSize: 11 }}>
                Comma-separated ranges
              </span>
            </div>
          )}

          {/* Rotate controls */}
          {mode === 'rotate' && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                  Rotation
                </span>
                <Toggle
                  options={[[90, '90° CW'], [180, '180°'], [-90, '90° CCW']]}
                  value={rotation} onChange={setRotation}
                />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                <span style={{ color: theme.textMuted, fontSize: 12 }}>
                  Pages
                  {pageCount > 0 && (
                    <span style={{
                      fontFamily: theme.fontMono, color: theme.accent, marginLeft: 4,
                    }}>{pageCount} total</span>
                  )}
                </span>
                <input
                  type="text"
                  value={rotateRange}
                  onChange={(e) => setRotateRange(e.target.value)}
                  placeholder="All pages (or e.g. 1-3, 5)"
                  style={{ ...textInputStyle, width: 200 }}
                  onFocus={(e) => e.target.style.borderColor = theme.accent}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
            </div>
          )}

          {/* Compress controls */}
          {mode === 'compress' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  color: theme.textMuted, fontSize: 12, fontWeight: 500, minWidth: 48,
                }}>Quality</span>
                <input
                  type="range" min="0.1" max="1" step="0.05"
                  value={compressQuality}
                  onChange={(e) => setCompressQuality(parseFloat(e.target.value))}
                  style={{ flex: 1, maxWidth: 200 }}
                />
                <span style={{
                  fontFamily: theme.fontMono, fontSize: 12,
                  color: theme.accent, minWidth: 36,
                }}>
                  {Math.round(compressQuality * 100)}%
                </span>
              </div>
              <p style={{ fontSize: 11, color: theme.textDim, lineHeight: 1.5 }}>
                Optimizes PDF structure. Results vary by content.
              </p>
              {compressReduction !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: compressReduction > 0 ? theme.successDim : theme.errorDim,
                  border: `1px solid ${compressReduction > 0 ? 'rgba(90,184,122,0.2)' : 'rgba(201,90,90,0.2)'}`,
                }}>
                  <span style={{ fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted }}>
                    {humanSize(inputSize)}
                  </span>
                  <span style={{ color: theme.textDim }}>→</span>
                  <span style={{
                    fontSize: 12, fontFamily: theme.fontMono, fontWeight: 600,
                    color: compressReduction > 0 ? theme.success : theme.error,
                  }}>
                    {humanSize(outputSize)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: compressReduction > 0 ? theme.success : theme.error,
                  }}>
                    {compressReduction > 0 ? `−${compressReduction}%` : `+${Math.abs(compressReduction)}%`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Watermark controls */}
          {mode === 'watermark' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Text</span>
                <input
                  type="text"
                  value={wmText}
                  onChange={(e) => setWmText(e.target.value)}
                  placeholder="Watermark text"
                  style={{ ...textInputStyle, width: 220, fontFamily: theme.font }}
                  onFocus={(e) => e.target.style.borderColor = theme.accent}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: theme.textMuted, fontSize: 12 }}>Size</span>
                  <input
                    type="range" min="16" max="120" step="2"
                    value={wmFontSize}
                    onChange={(e) => setWmFontSize(parseInt(e.target.value))}
                    style={{ width: 80 }}
                  />
                  <span style={{
                    fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted,
                  }}>{wmFontSize}pt</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: theme.textMuted, fontSize: 12 }}>Opacity</span>
                  <input
                    type="range" min="0.02" max="0.5" step="0.01"
                    value={wmOpacity}
                    onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                    style={{ width: 80 }}
                  />
                  <span style={{
                    fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted,
                  }}>{Math.round(wmOpacity * 100)}%</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Style</span>
                <Toggle
                  options={[[true, 'Diagonal'], [false, 'Center']]}
                  value={wmDiagonal} onChange={setWmDiagonal}
                />
              </div>
            </div>
          )}

          {/* Page numbers controls */}
          {mode === 'pagenums' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
                <input
                  type="text"
                  value={pnFormat}
                  onChange={(e) => setPnFormat(e.target.value)}
                  placeholder="Page {n} of {total}"
                  style={{ ...textInputStyle, width: 220, fontFamily: theme.font }}
                  onFocus={(e) => e.target.style.borderColor = theme.accent}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
                <span style={{ color: theme.textDim, fontSize: 10 }}>
                  {'{n}'} = page, {'{total}'} = total
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Position</span>
                  <Toggle
                    options={[
                      ['bottom-center', 'Bottom'],
                      ['top-center', 'Top'],
                      ['bottom-right', 'Right'],
                      ['bottom-left', 'Left'],
                    ]}
                    value={pnPosition} onChange={setPnPosition}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: theme.textMuted, fontSize: 12 }}>Size</span>
                  <input
                    type="range" min="8" max="24" step="1"
                    value={pnFontSize}
                    onChange={(e) => setPnFontSize(parseInt(e.target.value))}
                    style={{ width: 60 }}
                  />
                  <span style={{
                    fontFamily: theme.fontMono, fontSize: 11, color: theme.textMuted,
                  }}>{pnFontSize}pt</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={action.fn} disabled={action.disabled}>
              {action.label}
            </Btn>
            <StatusBadge status={status} />
          </div>
        </>
      )}
    </div>
  );
}
