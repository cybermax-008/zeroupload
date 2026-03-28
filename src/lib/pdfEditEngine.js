/**
 * Acorn Tools PDF Edit Engine
 *
 * Loads PDFs with pdfjs-dist for page rendering, and exports
 * modified PDFs with pdf-lib by burning overlay elements into the output.
 * Coordinates map from screen space (top-left origin) to PDF space (bottom-left origin).
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

let pdfjsLib = null;

async function initPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }
  pdfjsLib = pdfjs;
  return pdfjsLib;
}

/**
 * Load a PDF file and return the pdfjs document + raw bytes.
 */
export async function loadPdf(file) {
  const pdfjs = await initPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  return { doc, bytes, totalPages: doc.numPages };
}

/**
 * Render a single PDF page to a canvas element.
 * Returns the viewport used for rendering (needed for coordinate mapping).
 */
export async function renderPageToCanvas(doc, pageNum, scale, canvas) {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return viewport;
}

/**
 * Export a modified PDF with overlay elements burned in.
 *
 * @param {Uint8Array} originalBytes - The original PDF file bytes
 * @param {Object} allElements - { [pageNum]: [element, ...] }
 * @param {Object} viewports - { [pageNum]: { width, height, scale } }
 * @returns {Promise<{ blob: Blob, download: Function }>}
 */
export async function exportEditedPdf(originalBytes, allElements, viewports) {
  const srcDoc = await PDFDocument.load(originalBytes.slice(0));
  const outDoc = await PDFDocument.create();

  const totalPages = srcDoc.getPageCount();
  const copiedPages = await outDoc.copyPages(srcDoc, Array.from({ length: totalPages }, (_, i) => i));
  copiedPages.forEach(p => outDoc.addPage(p));

  // Embed standard fonts
  const fonts = {
    'Helvetica': await outDoc.embedFont(StandardFonts.Helvetica),
    'Courier': await outDoc.embedFont(StandardFonts.Courier),
    'TimesRoman': await outDoc.embedFont(StandardFonts.TimesRoman),
  };

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const elements = allElements[pageNum];
    if (!elements?.length) continue;

    const page = outDoc.getPage(pageNum - 1);
    const vp = viewports[pageNum];
    if (!vp) continue;

    const { width: vpW, height: vpH } = vp;
    const { width: pdfW, height: pdfH } = page.getSize();
    const scaleX = pdfW / vpW;
    const scaleY = pdfH / vpH;

    for (const el of elements) {
      const x = el.x * scaleX;
      const w = el.width * scaleX;
      const h = el.height * scaleY;
      // PDF Y is bottom-up
      const y = pdfH - (el.y * scaleY) - h;

      if (el.type === 'text') {
        const font = fonts[el.fontFamily] || fonts['Helvetica'];
        const fontSize = (el.fontSize || 14) * scaleY;
        const color = hexToRgb(el.color || '#000000');
        const lines = (el.text || '').split('\n');
        const lineHeight = fontSize * 1.3;
        lines.forEach((line, i) => {
          if (!line.trim()) return;
          page.drawText(line, {
            x,
            y: y + h - fontSize - (i * lineHeight),
            size: fontSize,
            font,
            color,
            opacity: el.opacity ?? 1,
          });
        });
      } else if (el.type === 'rectangle') {
        const borderWidth = (el.borderWidth || 2) * scaleX;
        const opts = { x, y, width: w, height: h };
        if (el.fill && el.fill !== 'transparent') {
          opts.color = hexToRgb(el.fill);
          opts.opacity = el.opacity ?? 1;
        }
        opts.borderColor = hexToRgb(el.borderColor || '#ff0000');
        opts.borderWidth = borderWidth;
        opts.borderOpacity = el.opacity ?? 1;
        page.drawRectangle(opts);
      } else if (el.type === 'highlight') {
        page.drawRectangle({
          x, y, width: w, height: h,
          color: rgb(1, 0.92, 0),
          opacity: 0.35,
        });
      } else if (el.type === 'whiteout') {
        page.drawRectangle({
          x, y, width: w, height: h,
          color: rgb(1, 1, 1),
          opacity: 1,
        });
      } else if (el.type === 'image' && el.imageData) {
        try {
          let embedded;
          if (el.imageData.startsWith('data:image/png')) {
            const b64 = el.imageData.split(',')[1];
            embedded = await outDoc.embedPng(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
          } else {
            const b64 = el.imageData.split(',')[1];
            embedded = await outDoc.embedJpg(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
          }
          page.drawImage(embedded, {
            x, y, width: w, height: h,
            opacity: el.opacity ?? 1,
          });
        } catch (_) { /* skip unembeddable images */ }
      }
    }
  }

  const pdfBytes = await outDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return {
    blob,
    download(filename = 'edited.pdf') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
