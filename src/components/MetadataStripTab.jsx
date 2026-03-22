import { useState } from 'react';
import { theme } from '../lib/theme';
import {
  readImageMetadata,
  readPdfMetadata,
  stripImageMetadata,
  stripPdfMetadata,
} from '../lib/metadataEngine';
import { saveFile, baseName, humanSize, readAsArrayBuffer } from '../lib/fileUtils';
import { useBatch } from '../lib/useBatch';
import { DropZone, FileChip, Btn, StatusBadge, BatchFileList, BatchProgress, BatchDownloadAll } from './ui';

export default function MetadataStripTab() {
  // Single-file state
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState([]);
  const [status, setStatus] = useState('');
  const [isPdf, setIsPdf] = useState(false);

  // Batch
  const batch = useBatch();
  const isBatch = batch.items.length > 1;

  const setupSingleFile = async (f) => {
    setStatus('');
    const pdf = f.type === 'application/pdf';
    setIsPdf(pdf);
    setFile(f);
    try {
      if (pdf) {
        const entries = await readPdfMetadata(f);
        setMetadata(entries);
      } else if (f.type.startsWith('image/')) {
        const buffer = await readAsArrayBuffer(f);
        const entries = readImageMetadata(buffer);
        setMetadata(entries);
      } else {
        setMetadata([]);
      }
    } catch {
      setMetadata([]);
    }
  };

  const onFiles = async (files) => {
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (!valid.length) return;

    batch.addFiles(valid);

    // First single file — set up preview with metadata display
    if (batch.items.length === 0 && valid.length === 1) {
      await setupSingleFile(valid[0]);
    }
  };

  const process = async () => {
    if (!file) return;
    setStatus('Stripping metadata…');
    try {
      let result;
      if (isPdf) {
        result = await stripPdfMetadata(file, setStatus);
      } else {
        result = await stripImageMetadata(file, setStatus);
      }
      const ext = isPdf ? '.pdf' : file.name.match(/\.\w+$/)?.[0] || '.jpg';
      await saveFile(result.blob, baseName(file.name) + '_clean' + ext);
      setStatus('Metadata stripped ✓');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const processOne = async (f) => {
    const pdf = f.type === 'application/pdf';
    let result;
    if (pdf) {
      result = await stripPdfMetadata(f);
    } else {
      result = await stripImageMetadata(f);
    }
    const ext = pdf ? '.pdf' : f.name.match(/\.\w+$/)?.[0] || '.jpg';
    return { blob: result.blob, filename: baseName(f.name) + '_clean' + ext };
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
    setMetadata([]);
    setStatus('');
    batch.reset();
  };

  // ── No files ──
  if (batch.items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DropZone
          accept="image/*,.pdf"
          multiple
          onFiles={onFiles}
          label="Drop images or PDFs to strip metadata"
          sublabel="Removes GPS, device info, author, timestamps — drop multiple for batch"
        />
      </div>
    );
  }

  // ── Single file (existing UX) ──
  if (!isBatch) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FileChip name={file?.name} size={file?.size} onRemove={reset} />

        {metadata.length > 0 ? (
          <div style={{
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px',
              background: theme.surfaceAlt,
              borderBottom: `1px solid ${theme.border}`,
            }}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: theme.text,
              }}>
                Metadata Found ({metadata.length} fields)
              </span>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {metadata.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 12,
                    padding: '8px 14px',
                    borderBottom: i < metadata.length - 1 ? `1px solid ${theme.border}` : 'none',
                    fontSize: 12,
                  }}
                >
                  <span style={{
                    color: theme.accent, fontWeight: 500,
                    minWidth: 120, flexShrink: 0,
                  }}>
                    {entry.tag}
                  </span>
                  <span style={{
                    color: theme.textMuted, fontFamily: theme.fontMono,
                    wordBreak: 'break-all',
                  }}>
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            background: theme.surfaceAlt,
            borderRadius: theme.radius,
            border: `1px solid ${theme.border}`,
            fontSize: 12, color: theme.textMuted,
          }}>
            {isPdf
              ? 'No readable metadata found (will still clean internal fields)'
              : 'No EXIF metadata detected (will still re-encode to ensure clean output)'}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Btn onClick={process}>Strip Metadata</Btn>
          <StatusBadge status={status} />
        </div>

        <div style={{
          fontSize: 11, color: theme.textDim, lineHeight: 1.5,
        }}>
          {isPdf
            ? 'Removes: title, author, creator, producer, subject, keywords, dates'
            : 'Removes: GPS location, camera make/model, software, timestamps, all EXIF data'}
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
        accept="image/*,.pdf"
        multiple
        onFiles={onFiles}
        label="Add more files"
        compact
      />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {batch.pendingCount > 0 && !batch.processing && (
          <Btn onClick={handleProcessAll}>
            Strip All ({batch.pendingCount})
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
