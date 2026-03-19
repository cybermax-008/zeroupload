import { useState } from 'react';
import { theme } from '../lib/theme';
import { convertFormat, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, loadImage, baseName, humanSize, FORMAT_MAP } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge } from './ui';

const FORMATS = Object.entries(FORMAT_MAP).map(([value, { label }]) => [value, label]);

export default function ConvertTab({ onBeforeProcess, onOperationComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [inputFormat, setInputFormat] = useState('');
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [status, setStatus] = useState('');
  const [outputSize, setOutputSize] = useState(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (!f?.type.startsWith('image/')) return;
    setFile(f);
    setStatus('');
    setOutputSize(null);
    const url = await readAsDataURL(f);
    setPreview(url);

    // Detect input format
    const detected = FORMAT_MAP[f.type] ? f.type : null;
    setInputFormat(detected || f.type);

    // Pick a sensible default output format (different from input)
    if (f.type === 'image/jpeg') setFormat('image/png');
    else if (f.type === 'image/png') setFormat('image/jpeg');
    else setFormat('image/jpeg');
  };

  const process = async () => {
    if (!file) return;
    if (onBeforeProcess && !onBeforeProcess()) return;
    const engineInfo = getEngineInfo();
    const engineLabel = engineInfo.type === 'vips' ? 'libvips' : 'Canvas';
    setStatus(`Converting with ${engineLabel}…`);
    setOutputSize(null);

    try {
      const blob = await convertFormat(file, format, quality);
      setOutputSize(blob.size);
      const ext = FORMAT_MAP[format]?.ext || '.png';
      await saveFile(blob, baseName(file.name) + ext);
      setStatus('Converted ✓');
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('');
    setOutputSize(null);
  };

  const inputLabel = FORMAT_MAP[inputFormat]?.label || inputFormat.replace('image/', '').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to convert"
          sublabel="HEIC to JPG · WebP to PNG · AVIF to JPEG · and more"
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
              color: theme.accent,
              padding: '4px 10px', borderRadius: 6,
              background: theme.accentDim,
            }}>
              {inputLabel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Preview */}
            <div style={{
              flex: '0 0 auto', width: 180, height: 140,
              borderRadius: theme.radius, overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: theme.surfaceAlt,
            }}>
              <img src={preview} alt="" style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
              }} />
            </div>

            {/* Controls */}
            <div style={{
              flex: 1, minWidth: 280,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Output format */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                  Convert to
                </span>
                <Toggle options={FORMATS} value={format} onChange={setFormat} />
              </div>

              {/* Same format warning */}
              {inputFormat === format && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: theme.accentDim,
                  border: `1px solid rgba(201,165,90,0.2)`,
                }}>
                  <span style={{ fontSize: 14 }}>!</span>
                  <span style={{ fontSize: 12, color: theme.accent }}>
                    Source image is already {FORMAT_MAP[format]?.label || 'this format'}. Choose a different output format.
                  </span>
                </div>
              )}

              {/* Quality (lossy only) */}
              {format !== 'image/png' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    color: theme.textMuted, fontSize: 12, fontWeight: 500, minWidth: 48,
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
                display: 'flex', alignItems: 'center', gap: 16, marginTop: 4,
              }}>
                <Btn onClick={process}>Convert</Btn>
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
