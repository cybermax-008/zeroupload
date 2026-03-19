import { useState } from 'react';
import { theme } from '../lib/theme';
import {
  readImageMetadata,
  readPdfMetadata,
  stripImageMetadata,
  stripPdfMetadata,
} from '../lib/metadataEngine';
import { saveFile, baseName, humanSize, readAsArrayBuffer } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function MetadataStripTab({ onBeforeProcess, onOperationComplete }) {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState([]);
  const [status, setStatus] = useState('');
  const [isPdf, setIsPdf] = useState(false);

  const onFiles = async (files) => {
    const f = files[0];
    if (!f) return;
    setStatus('');

    const pdf = f.type === 'application/pdf';
    setIsPdf(pdf);
    setFile(f);

    // Read and display existing metadata
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

  const process = async () => {
    if (!file) return;
    if (onBeforeProcess && !onBeforeProcess()) return;
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
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    setFile(null);
    setMetadata([]);
    setStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*,.pdf"
          onFiles={onFiles}
          label="Drop an image or PDF to strip metadata"
          sublabel="Removes GPS, device info, author, timestamps"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

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
        </>
      )}
    </div>
  );
}
