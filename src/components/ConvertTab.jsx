import { useState } from 'react';
import { theme } from '../lib/theme';
import { convertFormat, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, baseName, humanSize, FORMAT_MAP } from '../lib/fileUtils';
import { useBatch } from '../lib/useBatch';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, BatchFileList, BatchProgress, BatchDownloadAll } from './ui';

const FORMATS = Object.entries(FORMAT_MAP).map(([value, { label }]) => [value, label]);

export default function ConvertTab() {
  // Single-file state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [inputFormat, setInputFormat] = useState('');
  const [status, setStatus] = useState('');
  const [outputSize, setOutputSize] = useState(null);

  // Shared settings
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(0.92);

  // Batch
  const batch = useBatch();
  const isBatch = batch.items.length > 1;

  const onFiles = async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;

    batch.addFiles(valid);

    // If first single file, set up preview
    if (batch.items.length === 0 && valid.length === 1) {
      const f = valid[0];
      setFile(f);
      setStatus('');
      setOutputSize(null);
      const url = await readAsDataURL(f);
      setPreview(url);
      const detected = FORMAT_MAP[f.type] ? f.type : null;
      setInputFormat(detected || f.type);
      if (f.type === 'image/jpeg') setFormat('image/png');
      else if (f.type === 'image/png') setFormat('image/jpeg');
      else setFormat('image/jpeg');
    }
  };

  const process = async () => {
    if (!file) return;
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
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const processOne = async (f) => {
    const blob = await convertFormat(f, format, quality);
    const ext = FORMAT_MAP[format]?.ext || '.png';
    return { blob, filename: baseName(f.name) + ext };
  };

  const handleProcessAll = () => {
    batch.processBatch(processOne);
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

  const inputLabel = FORMAT_MAP[inputFormat]?.label || inputFormat.replace('image/', '').toUpperCase();

  // ── No files ──
  if (batch.items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DropZone
          accept="image/*"
          multiple
          onFiles={onFiles}
          label="Drop images to convert"
          sublabel="HEIC to JPG · WebP to PNG · AVIF to JPEG — drop multiple for batch"
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
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                Convert to
              </span>
              <Toggle options={FORMATS} value={format} onChange={setFormat} />
            </div>

            {inputFormat === format && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: theme.accentDim,
                border: `1px solid ${theme.accentDim}`,
              }}>
                <span style={{ fontSize: 14 }}>!</span>
                <span style={{ fontSize: 12, color: theme.accent }}>
                  Source image is already {FORMAT_MAP[format]?.label || 'this format'}. Choose a different output format.
                </span>
              </div>
            )}

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
          <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Convert to</span>
          <Toggle options={FORMATS} value={format} onChange={setFormat} />
        </div>
        {format !== 'image/png' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Quality</span>
            <input
              type="range" min="0.1" max="1" step="0.01"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: 120 }}
            />
            <span style={{ fontFamily: theme.fontMono, fontSize: 12, color: theme.accent }}>
              {Math.round(quality * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {batch.pendingCount > 0 && !batch.processing && (
          <Btn onClick={handleProcessAll}>
            Convert All ({batch.pendingCount})
          </Btn>
        )}
        <BatchDownloadAll count={batch.doneCount} onClick={handleDownloadAll} />
      </div>

      <BatchProgress
        progress={batch.progress}
        processing={batch.processing}
        onCancel={batch.cancel}
      />

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
