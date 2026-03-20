/**
 * Acorn Tools PDF Redaction Engine
 *
 * True redaction: rasterizes pages with redaction rectangles,
 * destroying the original text/vector content underneath.
 * Pages without redactions are copied verbatim via pdf-lib.
 */

import { PDFDocument } from 'pdf-lib';

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
  return pdfjs;
}

/**
 * Render a single PDF page for preview.
 * Returns a blob URL for display + page dimensions.
 */
export async function renderPagePreview(file, pageNum, scale = 0.75) {
  const pdfjs = await initPdfjs();
  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const blobUrl = URL.createObjectURL(blob);

  // Original page dimensions in PDF points (scale=1)
  const origViewport = page.getViewport({ scale: 1 });

  return {
    blobUrl,
    displayWidth: Math.round(viewport.width),
    displayHeight: Math.round(viewport.height),
    pdfWidth: origViewport.width,
    pdfHeight: origViewport.height,
  };
}

/**
 * Get total page count for a PDF.
 */
export async function getRedactPageCount(file) {
  const pdfjs = await initPdfjs();
  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  return pdf.numPages;
}

/**
 * Redact a PDF. Pages with redactions are rasterized with black rectangles
 * burned in. Pages without redactions are copied verbatim.
 *
 * @param {File} file - Source PDF
 * @param {Map<number, Array<{x,y,w,h}>>} redactions - Normalized (0-1) rects per page (1-based)
 * @param {function} onProgress - Status callback
 * @returns {{ blob, pageCount, download }}
 */
export async function redactPdf(file, redactions, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);

  const pdfjs = await initPdfjs();
  // pdfjs transfers the ArrayBuffer to a worker (detaches it),
  // so give it a copy and keep the original for pdf-lib
  const renderDoc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  const totalPages = renderDoc.numPages;

  // Load with pdf-lib for copying clean pages (uses the original buffer)
  const sourceDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const renderScale = 2; // High quality for export

  for (let i = 1; i <= totalPages; i++) {
    const pageRects = redactions.get(i);

    if (!pageRects || pageRects.length === 0) {
      // No redactions — copy page verbatim (preserves text/vectors)
      onProgress?.(`Copying page ${i}/${totalPages}…`);
      const [copied] = await newDoc.copyPages(sourceDoc, [i - 1]);
      newDoc.addPage(copied);
    } else {
      // Has redactions — rasterize with black fills
      onProgress?.(`Redacting page ${i}/${totalPages}…`);
      const page = await renderDoc.getPage(i);
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Draw black rectangles over redacted areas
      ctx.fillStyle = '#000000';
      for (const rect of pageRects) {
        const rx = rect.x * canvas.width;
        const ry = rect.y * canvas.height;
        const rw = rect.w * canvas.width;
        const rh = rect.h * canvas.height;
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Encode as PNG (lossless, sharp text edges)
      const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const img = await newDoc.embedPng(pngBytes);

      // Use original page dimensions so output matches
      const origViewport = page.getViewport({ scale: 1 });
      const pw = origViewport.width;
      const ph = origViewport.height;
      const newPage = newDoc.addPage([pw, ph]);
      newPage.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
    }
  }

  onProgress?.('Saving redacted PDF…');
  const pdfBytes = await newDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  const redactedCount = Array.from(redactions.values()).filter(r => r.length > 0).length;

  return {
    blob,
    pageCount: totalPages,
    redactedPages: redactedCount,
    download: (filename) => downloadBlob(blob, filename || 'redacted.pdf'),
  };
}
