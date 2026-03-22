import { useState } from 'react';
import { theme } from '../lib/theme';
import { imagesToPdf } from '../lib/pdfEngine';
import { DropZone, FileChip, Btn, Toggle, StatusBadge, ArrowBtn } from './ui';

export default function ImgToPdfTab() {
  const [files, setFiles] = useState([]);
  const [pageSize, setPageSize] = useState('fit');
  const [margin, setMargin] = useState(0);
  const [status, setStatus] = useState('');

  const onFiles = (newFiles) => {
    const imgs = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imgs]);
    setStatus('');
  };

  const remove = (i) => setFiles(p => p.filter((_, j) => j !== i));

  const move = (i, dir) => {
    const target = i + dir;
    if (target < 0 || target >= files.length) return;
    setFiles(p => {
      const a = [...p];
      [a[i], a[target]] = [a[target], a[i]];
      return a;
    });
  };

  const generate = async () => {
    if (!files.length) return;
    try {
      const result = await imagesToPdf(files, { pageSize, margin }, setStatus);
      result.download();
      setStatus(`Exported ✓ · ${result.pageCount} pages`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DropZone
        accept="image/*" multiple
        onFiles={onFiles}
        label="Drop images — they'll become pages in order"
        sublabel="PNG, JPEG, WebP · reorder after adding"
        compact={files.length > 0}
      />

      {files.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileChip name={f.name} size={f.size} index={i} onRemove={() => remove(i)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {i > 0 && <ArrowBtn direction="up" onClick={() => move(i, -1)} />}
                  {i < files.length - 1 && <ArrowBtn direction="down" onClick={() => move(i, 1)} />}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Page</span>
              <Toggle
                options={[['fit', 'Fit'], ['a4', 'A4'], ['letter', 'Letter']]}
                value={pageSize} onChange={setPageSize}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Margin</span>
              <input
                type="range" min="0" max="72" step="4"
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value))}
                style={{ width: 80 }}
              />
              <span style={{
                fontFamily: theme.fontMono, fontSize: 11,
                color: theme.textMuted,
              }}>{margin}pt</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={generate}>Create PDF</Btn>
            <StatusBadge status={status} />
          </div>
        </>
      )}
    </div>
  );
}
