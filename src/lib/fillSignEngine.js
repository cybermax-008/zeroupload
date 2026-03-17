/**
 * ZeroUpload Fill & Sign Engine
 *
 * Pure business logic for PDF form filling and annotation embedding.
 * All operations run client-side using pdf-lib + pdfjs-dist.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ── Helpers ──

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

// ── pdfjs lazy loader ──

let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = await import('pdfjs-dist');
  if (!_pdfjs.GlobalWorkerOptions.workerSrc) {
    _pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }
  return _pdfjs;
}

// ── Coordinate conversions ──
// PDF: bottom-left origin, points. Display: top-left origin, pixels.

export function pdfToDisplay(pdfX, pdfY, pdfW, pdfH, pagePts, displayPx) {
  const sx = displayPx.width / pagePts.width;
  const sy = displayPx.height / pagePts.height;
  return {
    x: pdfX * sx,
    y: (pagePts.height - pdfY - pdfH) * sy,
    width: pdfW * sx,
    height: pdfH * sy,
  };
}

export function displayToPdf(dispX, dispY, dispW, dispH, pagePts, displayPx) {
  const sx = pagePts.width / displayPx.width;
  const sy = pagePts.height / displayPx.height;
  return {
    x: dispX * sx,
    y: pagePts.height - (dispY + dispH) * sy,
    width: dispW * sx,
    height: dispH * sy,
  };
}

// ── Page rendering ──

export async function renderPagePreview(pdfBytes, pageNum, scale = 1.5) {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(pageNum);

  const rotation = page.rotate || 0;
  const viewport = page.getViewport({ scale, rotation: 0 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);

  // Get unscaled page dimensions in PDF points
  const rawViewport = page.getViewport({ scale: 1, rotation: 0 });

  return {
    url,
    pageWidthPts: rawViewport.width,
    pageHeightPts: rawViewport.height,
    displayWidth: Math.round(viewport.width),
    displayHeight: Math.round(viewport.height),
    rotation,
  };
}

// ── Page dimensions ──

export async function getPageDimensions(pdfBytes) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const dims = [];
  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    if (rot === 90 || rot === 270) {
      dims.push({ width: height, height: width });
    } else {
      dims.push({ width, height });
    }
  }
  return dims;
}

// ── Form field detection ──

export async function detectFormFields(pdfBytes) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  let form;
  try {
    form = doc.getForm();
  } catch {
    return [];
  }

  const fields = [];
  const allFields = form.getFields();

  for (const field of allFields) {
    const name = field.getName();
    const type = field.constructor.name;
    const widgets = field.acroField.getWidgets();
    let pageIndex = 0;

    // Try to determine page index from widget
    if (widgets.length > 0) {
      const pages = doc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const annots = pages[i].node.lookupMaybe(
          doc.context.obj([]),
          'Annots'
        );
        // Simple approach: just default to 0 for now, position from widget rect
      }
    }

    let rect = null;
    if (widgets.length > 0) {
      const widget = widgets[0];
      const r = widget.getRectangle();
      rect = { x: r.x, y: r.y, width: r.width, height: r.height };
    }

    let fieldType = 'text';
    let options = null;

    if (type === 'PDFTextField') fieldType = 'text';
    else if (type === 'PDFCheckBox') fieldType = 'checkbox';
    else if (type === 'PDFDropdown') {
      fieldType = 'dropdown';
      try { options = field.getOptions(); } catch { options = []; }
    }
    else if (type === 'PDFRadioGroup') {
      fieldType = 'radio';
      try { options = field.getOptions(); } catch { options = []; }
    }
    else if (type === 'PDFOptionList') {
      fieldType = 'optionlist';
      try { options = field.getOptions(); } catch { options = []; }
    }

    // Read current value
    let currentValue = '';
    try {
      if (fieldType === 'checkbox') {
        currentValue = field.isChecked() ? 'true' : 'false';
      } else if (fieldType === 'radio') {
        currentValue = field.getSelected() || '';
      } else {
        currentValue = field.getText() || '';
      }
    } catch {
      // Field may not have a value
    }

    fields.push({
      name,
      type: fieldType,
      rect,
      pageIndex,
      options,
      currentValue,
    });
  }

  return fields;
}

// ── Fill form fields ──

export async function fillFormFields(pdfBytes, fieldValues) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const errors = [];

  for (const [name, value] of Object.entries(fieldValues)) {
    if (value === '' || value === undefined) continue;
    try {
      const field = form.getField(name);
      const type = field.constructor.name;

      if (type === 'PDFTextField') {
        field.setText(value);
      } else if (type === 'PDFCheckBox') {
        if (value === 'true' || value === true) field.check();
        else field.uncheck();
      } else if (type === 'PDFDropdown') {
        field.select(value);
      } else if (type === 'PDFRadioGroup') {
        field.select(value);
      } else if (type === 'PDFOptionList') {
        field.select(value);
      }
    } catch (e) {
      errors.push({ field: name, error: e.message });
    }
  }

  // Try to flatten
  try {
    form.flatten();
  } catch (e) {
    errors.push({ field: '__flatten__', error: 'Could not flatten form: ' + e.message });
  }

  const saved = await doc.save();
  const blob = new Blob([saved], { type: 'application/pdf' });

  return { blob, errors, download: (fn) => downloadBlob(blob, fn || 'filled.pdf') };
}

// ── Embed annotations ──

export async function embedAnnotations(pdfBytes, annotations, onProgress) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Group annotations by page
  const byPage = {};
  for (const ann of annotations) {
    if (!byPage[ann.pageIndex]) byPage[ann.pageIndex] = [];
    byPage[ann.pageIndex].push(ann);
  }

  const pageIndices = Object.keys(byPage).map(Number);
  let done = 0;
  const total = annotations.length;

  for (const pageIdx of pageIndices) {
    const page = doc.getPage(pageIdx);
    const pageAnns = byPage[pageIdx];

    for (const ann of pageAnns) {
      onProgress?.(`Embedding ${++done}/${total}…`);

      if (ann.type === 'signature' || ann.type === 'initials') {
        if (!ann.imageDataUrl) continue;
        try {
          const imgBytes = dataUrlToUint8Array(ann.imageDataUrl);
          const img = await doc.embedPng(imgBytes);
          page.drawImage(img, {
            x: ann.pdfX,
            y: ann.pdfY,
            width: ann.pdfWidth,
            height: ann.pdfHeight,
          });
        } catch (e) {
          console.error('Failed to embed signature:', e);
        }
      } else if (ann.type === 'text' || ann.type === 'date') {
        const text = ann.text || '';
        if (!text) continue;
        const c = hexToRgb(ann.color || '#1a1a2e');
        const fontSize = ann.fontSize || 14;

        try {
          page.drawText(text, {
            x: ann.pdfX,
            y: ann.pdfY,
            size: fontSize,
            font,
            color: rgb(c.r, c.g, c.b),
            maxWidth: ann.pdfWidth > 0 ? ann.pdfWidth : undefined,
          });
        } catch (e) {
          // Non-Latin characters: try basic fallback
          const safeText = text.replace(/[^\x00-\x7F]/g, '?');
          try {
            page.drawText(safeText, {
              x: ann.pdfX,
              y: ann.pdfY,
              size: fontSize,
              font,
              color: rgb(c.r, c.g, c.b),
            });
          } catch {
            console.error('Failed to embed text:', e);
          }
        }
      } else if (ann.type === 'checkmark') {
        const c = hexToRgb(ann.color || '#1a1a2e');
        const size = Math.min(ann.pdfWidth, ann.pdfHeight);
        page.drawText('✓', {
          x: ann.pdfX + (ann.pdfWidth - size * 0.6) / 2,
          y: ann.pdfY + (ann.pdfHeight - size) / 2,
          size: size,
          font,
          color: rgb(c.r, c.g, c.b),
        });
      } else if (ann.type === 'xmark') {
        const c = hexToRgb(ann.color || '#1a1a2e');
        const size = Math.min(ann.pdfWidth, ann.pdfHeight);
        page.drawText('X', {
          x: ann.pdfX + (ann.pdfWidth - size * 0.6) / 2,
          y: ann.pdfY + (ann.pdfHeight - size) / 2,
          size: size,
          font,
          color: rgb(c.r, c.g, c.b),
        });
      }
    }
  }

  onProgress?.('Saving…');
  const saved = await doc.save();
  const blob = new Blob([saved], { type: 'application/pdf' });

  return {
    blob,
    pageCount: doc.getPageCount(),
    download: (fn) => downloadBlob(blob, fn || 'signed.pdf'),
  };
}

// ── Signature canvas processing ──

export function processSignatureImage(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Find bounding box of non-white pixels
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      // Check if pixel has content (not transparent and not white)
      if (a > 10 && (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240)) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent) return null;

  // Add small padding
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const trimW = maxX - minX + 1;
  const trimH = maxY - minY + 1;

  const trimCanvas = document.createElement('canvas');
  trimCanvas.width = trimW;
  trimCanvas.height = trimH;
  const trimCtx = trimCanvas.getContext('2d');
  trimCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);

  return trimCanvas.toDataURL('image/png');
}

// ── Internal helpers ──

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Read file as bytes (for component use) ──

export async function loadPdfBytes(file) {
  const buf = await readFileAsArrayBuffer(file);
  return new Uint8Array(buf);
}
