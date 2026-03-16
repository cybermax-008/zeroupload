import { useState } from 'react';
import { theme } from '../lib/theme';
import { compressImage, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, loadImage, baseName, humanSize, FORMAT_MAP } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, NumInput } from './ui';

const LOSSY_FORMATS = [
  ['image/jpeg', 'JPEG'],
  ['image/webp', 'WebP'],
  ['image/png', 'PNG'],
];

export default function CompressTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.7);
  const [maxDim, setMaxDim] = useState('');
  const [status, setStatus] = useState('');
  const [inputSize, setInputSize] = useState(0);
  const [outputSize, setOutputSize] = useState(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (!f?.type.startsWith('image/')) return;
    setStatus('');
    setOutputSize(null);
    setInputSize(f.size);
    setFile(f);
    const url = await readAsDataURL(f);
    setPreview(url);
    // Default to JPEG for best compression
    setFormat(f.type === 'image/png' ? 'image/png' : 'image/jpeg');
  };

  const process = async () => {
    if (!file) return;
    const engineInfo = getEngineInfo();
    const engineLabel = engineInfo.type === 'vips' ? 'libvips' : 'Lanczos3';
    setStatus(`Compressing with ${engineLabel}…`);
    setOutputSize(null);

    try {
      const dim = parseInt(maxDim) || null;
      const blob = await compressImage(file, format, quality, dim);
      setOutputSize(blob.size);
      const ext = FORMAT_MAP[format]?.ext || '.jpg';
      await saveFile(blob, baseName(file.name) + '_compressed' + ext);
      setStatus('Compressed ✓');
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

  const reduction = outputSize !== null
    ? Math.round((1 - outputSize / inputSize) * 100)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to compress"
          sublabel="JPEG, PNG, WebP, AVIF — reduce file size"
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
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
              {/* Format */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
                <Toggle options={LOSSY_FORMATS} value={format} onChange={setFormat} />
              </div>

              {/* Quality slider */}
              {format !== 'image/png' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    color: theme.textMuted, fontSize: 12, fontWeight: 500, minWidth: 48,
                  }}>Quality</span>
                  <input
                    type="range" min="0.1" max="1" step="0.05"
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

              {/* Max dimension */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NumInput
                  label="Max side"
                  value={maxDim}
                  onChange={setMaxDim}
                  suffix="px"
                />
                <span style={{ color: theme.textDim, fontSize: 11 }}>
                  Optional — shrinks if larger
                </span>
              </div>

              {/* Action row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginTop: 4,
              }}>
                <Btn onClick={process}>Compress</Btn>
                <StatusBadge status={status} />
              </div>

              {/* Size comparison */}
              {outputSize !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: reduction > 0 ? theme.successDim : theme.errorDim,
                  border: `1px solid ${reduction > 0 ? 'rgba(90,184,122,0.2)' : 'rgba(201,90,90,0.2)'}`,
                }}>
                  <span style={{ fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted }}>
                    {humanSize(inputSize)}
                  </span>
                  <span style={{ color: theme.textDim }}>→</span>
                  <span style={{
                    fontSize: 12, fontFamily: theme.fontMono, fontWeight: 600,
                    color: reduction > 0 ? theme.success : theme.error,
                  }}>
                    {humanSize(outputSize)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: reduction > 0 ? theme.success : theme.error,
                  }}>
                    {reduction > 0 ? `−${reduction}%` : `+${Math.abs(reduction)}%`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
