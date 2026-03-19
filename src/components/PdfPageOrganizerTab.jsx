import { useState, useRef } from 'react';
import { theme } from '../lib/theme';
import { getPdfThumbnails, reorderPdfPages, deletePdfPages } from '../lib/pdfPageEngine';
import { saveFile, baseName } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfPageOrganizerTab({ onBeforeProcess, onOperationComplete }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);   // { pageNum, url, originalIndex }
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (f?.type !== 'application/pdf') return;
    setFile(f);
    setStatus('');
    setSelected(new Set());
    setLoading(true);
    try {
      const thumbs = await getPdfThumbnails(f, 0.3, setStatus);
      setPages(thumbs.map((t, i) => ({ ...t, originalIndex: i })));
      setStatus('');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };

  const handleDrop = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) return;

    const updated = [...pages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPages(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (selected.size >= pages.length) {
      setStatus('Error: Cannot delete all pages');
      return;
    }
    if (onBeforeProcess && !onBeforeProcess()) return;
    setStatus('Deleting pages…');
    try {
      const deleteIndices = new Set(
        [...selected].map(idx => pages[idx].originalIndex)
      );
      const result = await deletePdfPages(file, deleteIndices, setStatus);
      await saveFile(result.blob, baseName(file.name) + '_edited.pdf');
      // Remove from view
      setPages(prev => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
      setStatus(`Deleted ${deleteIndices.size} pages ✓`);
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const saveReordered = async () => {
    if (onBeforeProcess && !onBeforeProcess()) return;
    setStatus('Saving…');
    try {
      const newOrder = pages.map(p => p.originalIndex);
      const result = await reorderPdfPages(file, newOrder, setStatus);
      await saveFile(result.blob, baseName(file.name) + '_reordered.pdf');
      setStatus(`Saved ✓ (${result.pageCount} pages)`);
      if (onOperationComplete) onOperationComplete();
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    // Revoke thumbnail URLs
    pages.forEach(p => URL.revokeObjectURL(p.url));
    setFile(null);
    setPages([]);
    setSelected(new Set());
    setStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept=".pdf"
          onFiles={onFiles}
          label="Drop a PDF to organize pages"
          sublabel="Drag to reorder, click to select for deletion"
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
          </div>

          {loading ? (
            <StatusBadge status={status || 'Loading thumbnails…'} />
          ) : (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Btn onClick={saveReordered} disabled={pages.length === 0}>
                  Save Reordered PDF
                </Btn>
                {selected.size > 0 && (
                  <Btn secondary onClick={deleteSelected}>
                    Delete {selected.size} page{selected.size > 1 ? 's' : ''}
                  </Btn>
                )}
                <StatusBadge status={status} />
              </div>

              <div style={{
                fontSize: 11, color: theme.textDim,
              }}>
                Drag pages to reorder · Click to select for deletion
              </div>

              {/* Page grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12,
              }}>
                {pages.map((page, idx) => (
                  <div
                    key={`${page.originalIndex}-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    onClick={() => toggleSelect(idx)}
                    style={{
                      cursor: 'grab',
                      border: `2px solid ${selected.has(idx) ? theme.accent : theme.border}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: selected.has(idx) ? theme.accentGlow : theme.surface,
                      transition: theme.transitionFast,
                      position: 'relative',
                    }}
                  >
                    <img
                      src={page.url}
                      alt={`Page ${idx + 1}`}
                      draggable={false}
                      style={{
                        width: '100%',
                        display: 'block',
                      }}
                    />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.7)',
                      padding: '4px 0',
                      textAlign: 'center',
                      fontSize: 11,
                      fontFamily: theme.fontMono,
                      color: selected.has(idx) ? theme.accent : theme.textMuted,
                      fontWeight: 500,
                    }}>
                      {idx + 1}
                    </div>
                    {selected.has(idx) && (
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 18, height: 18, borderRadius: '50%',
                        background: theme.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: theme.bg, fontWeight: 700,
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
