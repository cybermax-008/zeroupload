import { useState } from 'react';
import { theme } from '../lib/theme';
import { compressImage, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, baseName, humanSize, FORMAT_MAP } from '../lib/fileUtils';
import { isPro } from '../lib/usageGate';
import { useBatch } from '../lib/useBatch';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, NumInput, BatchFileList, BatchProgress, BatchDownloadAll } from './ui';

const LOSSY_FORMATS = [
  ['image/jpeg', 'JPEG'],
  ['image/webp', 'WebP'],
];

export default function CompressTab({ onBeforeProcess, onOperationComplete }) {
  // Single-file state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [inputSize, setInputSize] = useState(0);
  const [outputSize, setOutputSize] = useState(null);

  // Shared settings
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.7);
  const [maxDim, setMaxDim] = useState('');

  // Batch
  const batch = useBatch();
  const isBatch = batch.items.length > 1;

  const onFiles = async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;

    // Batch is Pro-only: free users who drop multiple files get first file + paywall
    if (!isPro() && (valid.length > 1 || batch.items.length >= 1)) {
      if (batch.items.length === 0) {
        // Keep first file as single-file mode, show paywall for the rest
        const f = valid[0];
        batch.addFiles([f]);
        setStatus('');
        setOutputSize(null);
        setInputSize(f.size);
        setFile(f);
        const url = await readAsDataURL(f);
        setPreview(url);
        setFormat(f.type === 'image/png' ? 'image/png' : 'image/jpeg');
      }
      if (onBeforeProcess) onBeforeProcess();
      return;
    }

    batch.addFiles(valid);

    // If this is the first single file, set up single-file preview
    if (batch.items.length === 0 && valid.length === 1) {
      const f = valid[0];
      setStatus('');
      setOutputSize(null);
      setInputSize(f.size);
      setFile(f);
      const url = await readAsDataURL(f);
      setPreview(url);
      setFormat(f.type === 'image/png' ? 'image/png' : 'image/jpeg');
    }
  };

  const process = async () => {
    if (!file) return;
    if (onBeforeProcess && !onBeforeProcess()) return;
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
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const processOne = async (f) => {
    const dim = parseInt(maxDim) || null;
    const blob = await compressImage(f, format, quality, dim);
    const ext = FORMAT_MAP[format]?.ext || '.jpg';
    return { blob, filename: baseName(f.name) + '_compressed' + ext };
  };

  const handleProcessAll = () => {
    batch.processBatch(processOne, { onOperationComplete });
  };

  const handleDownloadOne = (item) => {
    if (item.result) saveFile(item.result.blob, item.result.filename);
  };

  const handleDownloadAll = async () => {
    const done = batch.items.filter((it) => it.status === 'done' && it.result);
    for (const item of done) {
      saveFile(item.result.blob, item.result.filename);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('');
    setOutputSize(null);
    batch.reset();
  };

  const reduction = outputSize !== null
    ? Math.round((1 - outputSize / inputSize) * 100)
    : null;

  // ── No files ──
  if (batch.items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DropZone
          accept="image/*"
          multiple
          onFiles={onFiles}
          label="Drop images to compress"
          sublabel="JPEG, PNG, WebP, AVIF — drop multiple files for batch processing"
        />
      </div>
    );
  }

  // ── Single file (existing UX) ──
  if (!isBatch) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <FileChip name={file?.name} size={file?.size} onRemove={reset} />
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {preview && (
            <div style={{
              flex: '0 0 auto', width: 180, height: 140,
              borderRadius: theme.radius, overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: theme.surfaceAlt,
              alignSelf: 'flex-start',
            }}>
              <img src={preview} alt="" style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
              }} />
            </div>
          )}

          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
              <Toggle options={LOSSY_FORMATS} value={format} onChange={setFormat} />
            </div>

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

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 4,
            }}>
              <Btn onClick={process}>Compress</Btn>
              <StatusBadge status={status} />
            </div>

            {outputSize !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: reduction > 0 ? theme.successDim : theme.errorDim,
                border: `1px solid ${reduction > 0 ? theme.successDim : theme.errorDim}`,
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
      </div>
    );
  }

  // ── Batch view ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
          {batch.items.length} files
        </span>
        <Btn small secondary onClick={reset}>Clear All</Btn>
      </div>

      <BatchFileList
        items={batch.items}
        onRemove={batch.removeFile}
        onDownload={handleDownloadOne}
        disabled={batch.processing}
      />

      <DropZone
        accept="image/*"
        multiple
        onFiles={onFiles}
        label="Add more images"
        compact
      />

      {/* Settings */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        padding: '12px 14px', borderRadius: theme.radius,
        background: theme.surface, border: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
          <Toggle options={LOSSY_FORMATS} value={format} onChange={setFormat} />
        </div>
        {format !== 'image/png' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Quality</span>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: 120 }}
            />
            <span style={{ fontFamily: theme.fontMono, fontSize: 12, color: theme.accent }}>
              {Math.round(quality * 100)}%
            </span>
          </div>
        )}
        <NumInput label="Max" value={maxDim} onChange={setMaxDim} suffix="px" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {batch.pendingCount > 0 && !batch.processing && (
          <Btn onClick={handleProcessAll}>
            Compress All ({batch.pendingCount})
          </Btn>
        )}
        <BatchDownloadAll count={batch.doneCount} onClick={handleDownloadAll} />
      </div>

      <BatchProgress
        progress={batch.progress}
        processing={batch.processing}
        onCancel={batch.cancel}
      />

      {/* Summary */}
      {!batch.processing && batch.doneCount + batch.errorCount > 0 && (
        <div style={{
          fontSize: 12, color: theme.textMuted, fontFamily: theme.fontMono,
          display: 'flex', gap: 16,
        }}>
          {batch.doneCount > 0 && <span style={{ color: theme.success }}>{batch.doneCount} done</span>}
          {batch.errorCount > 0 && <span style={{ color: theme.error }}>{batch.errorCount} failed</span>}
        </div>
      )}
    </div>
  );
}
