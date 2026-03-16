import { useState, useRef, useCallback, useEffect } from 'react';
import { theme } from '../lib/theme';
import { cropImage, getImageDimensions, getEngineInfo } from '../lib/imageEngine';
import { saveFile, readAsDataURL, baseName, humanSize, FORMAT_MAP } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, Toggle, StatusBadge } from './ui';

const FORMATS = Object.entries(FORMAT_MAP).map(([value, { label }]) => [value, label]);

const ASPECT_PRESETS = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:2', ratio: 3 / 2 },
];

export default function CropTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [aspect, setAspect] = useState(null);
  const [format, setFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92);
  const [status, setStatus] = useState('');
  const [outputSize, setOutputSize] = useState(null);
  const [dragging, setDragging] = useState(null); // null | 'move' | corner name
  const dragStart = useRef(null);
  const containerRef = useRef(null);

  const onFiles = async (files) => {
    const f = files[0];
    if (!f?.type.startsWith('image/')) return;
    setFile(f);
    setStatus('');
    setOutputSize(null);
    const url = await readAsDataURL(f);
    setPreview(url);
    const dims = await getImageDimensions(f);
    setImgW(dims.width);
    setImgH(dims.height);
    // Default crop: center 80%
    const cw = Math.round(dims.width * 0.8);
    const ch = Math.round(dims.height * 0.8);
    setCrop({
      x: Math.round((dims.width - cw) / 2),
      y: Math.round((dims.height - ch) / 2),
      w: cw, h: ch,
    });
    const matchedFormat = Object.keys(FORMAT_MAP).find(k => k === f.type);
    setFormat(matchedFormat || 'image/png');
  };

  // Display scale factor
  const containerW = 500;
  const scale = imgW > 0 ? Math.min(containerW / imgW, 400 / imgH, 1) : 1;
  const displayW = Math.round(imgW * scale);
  const displayH = Math.round(imgH * scale);

  // Convert image coords to display coords
  const toDisplay = (v) => Math.round(v * scale);
  const toImage = (v) => Math.round(v / scale);

  const clampCrop = useCallback((c) => {
    const x = Math.max(0, Math.min(c.x, imgW - c.w));
    const y = Math.max(0, Math.min(c.y, imgH - c.h));
    const w = Math.min(c.w, imgW - x);
    const h = Math.min(c.h, imgH - y);
    return { x, y, w: Math.max(10, w), h: Math.max(10, h) };
  }, [imgW, imgH]);

  const onPointerDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    const rect = containerRef.current.getBoundingClientRect();
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      crop: { ...crop },
      rect,
    };
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const { mx, my, crop: startCrop } = dragStart.current;
      const dx = toImage(e.clientX - mx);
      const dy = toImage(e.clientY - my);

      if (dragging === 'move') {
        setCrop(clampCrop({ ...startCrop, x: startCrop.x + dx, y: startCrop.y + dy }));
      } else if (dragging === 'se') {
        let newW = Math.max(20, startCrop.w + dx);
        let newH = aspect ? Math.round(newW / aspect) : Math.max(20, startCrop.h + dy);
        if (aspect) newW = Math.round(newH * aspect);
        setCrop(clampCrop({ ...startCrop, w: newW, h: newH }));
      } else if (dragging === 'nw') {
        let newW = Math.max(20, startCrop.w - dx);
        let newH = aspect ? Math.round(newW / aspect) : Math.max(20, startCrop.h - dy);
        if (aspect) newW = Math.round(newH * aspect);
        setCrop(clampCrop({
          x: startCrop.x + startCrop.w - newW,
          y: startCrop.y + startCrop.h - newH,
          w: newW, h: newH,
        }));
      } else if (dragging === 'ne') {
        let newW = Math.max(20, startCrop.w + dx);
        let newH = aspect ? Math.round(newW / aspect) : Math.max(20, startCrop.h - dy);
        if (aspect) newW = Math.round(newH * aspect);
        setCrop(clampCrop({
          x: startCrop.x,
          y: startCrop.y + startCrop.h - newH,
          w: newW, h: newH,
        }));
      } else if (dragging === 'sw') {
        let newW = Math.max(20, startCrop.w - dx);
        let newH = aspect ? Math.round(newW / aspect) : Math.max(20, startCrop.h + dy);
        if (aspect) newW = Math.round(newH * aspect);
        setCrop(clampCrop({
          x: startCrop.x + startCrop.w - newW,
          y: startCrop.y,
          w: newW, h: newH,
        }));
      }
    };

    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, aspect, clampCrop, toImage]);

  const applyAspect = (ratio) => {
    setAspect(ratio);
    if (ratio && imgW > 0) {
      const newW = Math.min(crop.w, imgW);
      const newH = Math.round(newW / ratio);
      if (newH <= imgH) {
        setCrop(clampCrop({ ...crop, w: newW, h: newH }));
      } else {
        const h2 = Math.min(crop.h, imgH);
        setCrop(clampCrop({ ...crop, w: Math.round(h2 * ratio), h: h2 }));
      }
    }
  };

  const process = async () => {
    if (!file) return;
    const engineInfo = getEngineInfo();
    setStatus(`Cropping with ${engineInfo.type === 'vips' ? 'libvips' : 'Canvas'}…`);
    setOutputSize(null);

    try {
      const blob = await cropImage(file, crop.x, crop.y, crop.w, crop.h, format, quality);
      setOutputSize(blob.size);
      const ext = FORMAT_MAP[format]?.ext || '.png';
      await saveFile(blob, baseName(file.name) + `_${crop.w}x${crop.h}` + ext);
      setStatus('Cropped ✓');
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

  const handleStyle = (cursor) => ({
    position: 'absolute', width: 12, height: 12,
    background: theme.accent, borderRadius: 2,
    cursor, zIndex: 3,
    border: `1.5px solid ${theme.bg}`,
    touchAction: 'none',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept="image/*"
          onFiles={onFiles}
          label="Drop an image to crop"
          sublabel="Drag the crop rectangle to select a region"
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <FileChip name={file.name} size={file.size} onRemove={reset} />
            <span style={{
              fontSize: 12, fontFamily: theme.fontMono, color: theme.textMuted,
            }}>
              {imgW} × {imgH}
            </span>
          </div>

          {/* Crop overlay */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: displayW, height: displayH,
              margin: '0 auto',
              overflow: 'hidden',
              borderRadius: theme.radius,
              border: `1px solid ${theme.border}`,
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <img src={preview} alt="" style={{
              width: displayW, height: displayH, display: 'block',
            }} />

            {/* Darkened overlay — four rectangles around crop area */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: displayW, height: toDisplay(crop.y),
              background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: toDisplay(crop.y + crop.h), left: 0,
              width: displayW, height: displayH - toDisplay(crop.y + crop.h),
              background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: toDisplay(crop.y), left: 0,
              width: toDisplay(crop.x), height: toDisplay(crop.h),
              background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: toDisplay(crop.y), left: toDisplay(crop.x + crop.w),
              width: displayW - toDisplay(crop.x + crop.w), height: toDisplay(crop.h),
              background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
            }} />

            {/* Crop border */}
            <div
              onPointerDown={(e) => onPointerDown(e, 'move')}
              style={{
                position: 'absolute',
                left: toDisplay(crop.x), top: toDisplay(crop.y),
                width: toDisplay(crop.w), height: toDisplay(crop.h),
                border: `1.5px solid ${theme.accent}`,
                cursor: 'move', zIndex: 2,
                touchAction: 'none',
              }}
            />

            {/* Corner handles */}
            <div onPointerDown={(e) => onPointerDown(e, 'nw')} style={{
              ...handleStyle('nw-resize'),
              left: toDisplay(crop.x) - 6, top: toDisplay(crop.y) - 6,
            }} />
            <div onPointerDown={(e) => onPointerDown(e, 'ne')} style={{
              ...handleStyle('ne-resize'),
              left: toDisplay(crop.x + crop.w) - 6, top: toDisplay(crop.y) - 6,
            }} />
            <div onPointerDown={(e) => onPointerDown(e, 'sw')} style={{
              ...handleStyle('sw-resize'),
              left: toDisplay(crop.x) - 6, top: toDisplay(crop.y + crop.h) - 6,
            }} />
            <div onPointerDown={(e) => onPointerDown(e, 'se')} style={{
              ...handleStyle('se-resize'),
              left: toDisplay(crop.x + crop.w) - 6, top: toDisplay(crop.y + crop.h) - 6,
            }} />
          </div>

          {/* Crop info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 11, fontFamily: theme.fontMono, color: theme.textMuted,
            }}>
              {crop.w} × {crop.h} px
            </span>
            <span style={{ color: theme.textDim }}>from</span>
            <span style={{
              fontSize: 11, fontFamily: theme.fontMono, color: theme.textDim,
            }}>
              ({crop.x}, {crop.y})
            </span>
          </div>

          {/* Aspect ratio presets */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyAspect(p.ratio)}
                style={{
                  fontFamily: theme.font,
                  fontSize: 11, fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 6, border: 'none',
                  background: aspect === p.ratio ? theme.accentDim : theme.surface,
                  color: aspect === p.ratio ? theme.accent : theme.textMuted,
                  cursor: 'pointer',
                  transition: theme.transitionFast,
                }}
              >{p.label}</button>
            ))}
          </div>

          {/* Format + Quality */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Format</span>
              <Toggle options={FORMATS} value={format} onChange={setFormat} />
            </div>

            {format !== 'image/png' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>Quality</span>
                <input
                  type="range" min="0.1" max="1" step="0.01"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  style={{ width: 100 }}
                />
                <span style={{
                  fontFamily: theme.fontMono, fontSize: 12,
                  color: theme.accent, minWidth: 32,
                }}>
                  {Math.round(quality * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Action row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <Btn onClick={process}>Crop & Export</Btn>
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
        </>
      )}
    </div>
  );
}
