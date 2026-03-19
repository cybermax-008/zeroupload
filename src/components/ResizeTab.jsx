import { useState } from 'react';
import { theme } from '../lib/theme';
import { resizeImage, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, loadImage, baseName, humanSize, FORMAT_MAP, SIZE_PRESETS } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, NumInput, EngineIndicator } from './ui';

const FORMATS = Object.entries(FORMAT_MAP).map(([value, { label }]) => [value, label]);

export default function ResizeTab({ onBeforeProcess, onOperationComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [preset, setPreset] = useState('Custom');
  const [status, setStatus] = useState('');
  const [outputSize, setOutputSize] = useState(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (!f?.type.startsWith('image/')) return;
    setFile(f); setStatus(''); setOutputSize(null);
    const url = await readAsDataURL(f);
    setPreview(url);
    const img = await loadImage(url);
    setOrigW(img.naturalWidth); setOrigH(img.naturalHeight);
    setWidth(img.naturalWidth); setHeight(img.naturalHeight);
    const matchedFormat = Object.keys(FORMAT_MAP).find(k => k === f.type);
    setFormat(matchedFormat || 'image/png');
    setPreset('Custom');
  };

  const onW = (v) => {
    const w = parseInt(v) || '';
    setWidth(w); setPreset('Custom');
    if (lock && w && origW) setHeight(Math.round((w / origW) * origH));
  };

  const onH = (v) => {
    const h = parseInt(v) || '';
    setHeight(h); setPreset('Custom');
    if (lock && h && origH) setWidth(Math.round((h / origH) * origW));
  };

  const applyPreset = (p) => {
    setPreset(p.label);
    if (p.w && p.h) {
      setWidth(p.w); setHeight(p.h); setLock(false);
    }
  };

  const process = async () => {
    if (!file) return;
    if (onBeforeProcess && !onBeforeProcess()) return;
    const engineInfo = getEngineInfo();
    const engineLabel = engineInfo.type === 'vips' ? 'libvips' : 'Lanczos3';
    setStatus(`Processing with ${engineLabel}…`);
    setOutputSize(null);

    try {
      const w = parseInt(width) || origW;
      const h = parseInt(height) || origH;

      // Use the unified engine API
      const blob = await resizeImage(file, w, h, format, quality);

      setOutputSize(blob.size);
      const ext = FORMAT_MAP[format]?.ext || '.png';
      await saveFile(blob, baseName(file.name) + `_${w}x${h}` + ext);
      setStatus('Exported ✓');
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setStatus(''); setOutputSize(null);
  };

  const engineInfo = getEngineInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image — PNG, JPEG, WebP, AVIF"
        />
      ) : (
        <>
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12,
            flexWrap: 'wrap',
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 12, fontFamily: theme.fontMono,
                color: theme.textMuted,
              }}>
                {origW} × {origH}
              </span>
              <EngineIndicator engineInfo={engineInfo} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Preview */}
            <div style={{
              flex: '0 0 auto', width: 180, height: 140,
              borderRadius: theme.radius, overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: theme.surfaceAlt,
              alignSelf: 'flex-start',
            }}>
              <img
                src={preview} alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Controls */}
            <div style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Presets */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SIZE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    style={{
                      fontFamily: theme.font,
                      fontSize: 11, fontWeight: 500,
                      padding: '4px 10px',
                      borderRadius: 6, border: 'none',
                      background: preset === p.label ? theme.accentDim : theme.surface,
                      color: preset === p.label ? theme.accent : theme.textMuted,
                      cursor: 'pointer',
                      transition: theme.transitionFast,
                    }}
                  >{p.label}</button>
                ))}
              </div>

              {/* Dimensions */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 8, flexWrap: 'wrap',
              }}>
                <NumInput label="W" value={width} onChange={onW} suffix="px" />
                <button
                  onClick={() => setLock(!lock)}
                  aria-label={lock ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  title={lock ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  style={{
                    border: 'none', borderRadius: 6,
                    padding: '6px 10px', cursor: 'pointer',
                    background: lock ? theme.accentDim : theme.surface,
                    color: lock ? theme.accent : theme.textDim,
                    fontSize: 13,
                    transition: theme.transition,
                  }}
                >
                  {lock ? '🔗' : '🔓'}
                </button>
                <NumInput label="H" value={height} onChange={onH} suffix="px" />
              </div>

              {/* Format */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{
                  color: theme.textMuted, fontSize: 12, fontWeight: 500,
                }}>Format</span>
                <Toggle options={FORMATS} value={format} onChange={setFormat} />
              </div>

              {/* Quality (JPEG/WebP only) */}
              {format !== 'image/png' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{
                    color: theme.textMuted, fontSize: 12,
                    fontWeight: 500, minWidth: 48,
                  }}>Quality</span>
                  <input
                    type="range" min="0.1" max="1" step="0.01"
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

              {/* Action row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 16, marginTop: 4,
              }}>
                <Btn onClick={process}>Export</Btn>
                <StatusBadge status={status} />
                {outputSize !== null && (
                  <span style={{
                    fontSize: 11, fontFamily: theme.fontMono,
                    color: theme.textMuted,
                  }}>
                    → {humanSize(outputSize)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
