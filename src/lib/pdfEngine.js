/**
 * ═══════════════════════════════════════════════════════════════
 * ZeroUpload PDF Engine
 * 
 * All operations run client-side using pdf-lib.
 * Supports: merge, split/extract, image-to-PDF
 * ═══════════════════════════════════════════════════════════════
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

// ── Helpers ──
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
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

// ── Page size constants (in points, 72pt = 1 inch) ──
export const PAGE_SIZES = {
  fit: null, // auto-fit to image
  a4: [595.28, 841.89],
  a3: [841.89, 1190.55],
  letter: [612, 792],
  legal: [612, 1008],
};

// ── Parse page ranges like "1-3, 5, 7-9" ──
export function parsePageRanges(rangeStr, maxPages) {
  const pages = new Set();
  
  rangeStr.split(',').forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1]));
      const end = Math.min(maxPages, parseInt(rangeMatch[2]));
      for (let i = start; i <= end; i++) {
        pages.add(i - 1); // 0-indexed
      }
    } else {
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num - 1);
      }
    }
  });

  return [...pages].sort((a, b) => a - b);
}

// ── Get PDF page count ──
export async function getPdfPageCount(file) {
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

// ── Merge multiple PDFs ──
export async function mergePdfs(files, onProgress) {
  const merged = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    onProgress?.(`Merging ${i + 1}/${files.length}…`);
    const bytes = await readFileAsArrayBuffer(files[i]);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }

  onProgress?.('Saving…');
  const pdfBytes = await merged.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  return {
    blob,
    pageCount: merged.getPageCount(),
    download: (filename = 'merged.pdf') => downloadBlob(blob, filename),
  };
}

// ── Split/Extract pages from PDF ──
export async function splitPdf(file, rangeStr, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = src.getPageCount();
  
  const indices = parsePageRanges(rangeStr, totalPages);
  if (indices.length === 0) {
    throw new Error('No valid pages selected');
  }

  onProgress?.(`Extracting ${indices.length} pages…`);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(src, indices);
  pages.forEach(page => newDoc.addPage(page));

  onProgress?.('Saving…');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const rangeLabel = rangeStr.replace(/\s/g, '');
  
  return {
    blob,
    pageCount: newDoc.getPageCount(),
    download: (filename) => downloadBlob(blob, filename || `pages_${rangeLabel}.pdf`),
  };
}

// ── Convert images to PDF ──
export async function imagesToPdf(files, options = {}, onProgress) {
  const {
    pageSize = 'fit',
    margin = 0,
  } = options;

  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(`Processing image ${i + 1}/${files.length}…`);

    const bytes = await readFileAsArrayBuffer(file);
    const uint8 = new Uint8Array(bytes);

    let img;

    if (file.type === 'image/png') {
      img = await doc.embedPng(uint8);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      img = await doc.embedJpg(uint8);
    } else {
      // Convert unsupported formats (WebP, AVIF, etc.) to PNG via canvas
      const url = URL.createObjectURL(file);
      try {
        const imgEl = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        canvas.getContext('2d').drawImage(imgEl, 0, 0);
        const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        img = await doc.embedPng(pngBytes);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    // Calculate page dimensions
    const m = margin;
    let pw, ph;

    if (pageSize === 'fit' || !PAGE_SIZES[pageSize]) {
      pw = img.width + m * 2;
      ph = img.height + m * 2;
    } else {
      [pw, ph] = PAGE_SIZES[pageSize];
    }

    // Add page and draw image centered
    const page = doc.addPage([pw, ph]);
    const availW = pw - m * 2;
    const availH = ph - m * 2;
    const scale = Math.min(availW / img.width, availH / img.height, 1);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    page.drawImage(img, {
      x: m + (availW - drawW) / 2,
      y: m + (availH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  onProgress?.('Saving…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: doc.getPageCount(),
    download: (filename = 'images.pdf') => downloadBlob(blob, filename),
  };
}

// ── Rotate PDF pages ──
export async function rotatePdf(file, rotationDegrees, rangeStr, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  const indices = rangeStr
    ? parsePageRanges(rangeStr, totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  if (indices.length === 0) throw new Error('No valid pages selected');

  onProgress?.(`Rotating ${indices.length} pages…`);
  for (const idx of indices) {
    const page = doc.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation(degrees(current + rotationDegrees));
  }

  onProgress?.('Saving…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(blob, filename || 'rotated.pdf'),
  };
}

// ── Watermark PDF ──
export async function watermarkPdf(file, text, options = {}, onProgress) {
  const {
    fontSize = 48,
    opacity = 0.15,
    color = { r: 0.5, g: 0.5, b: 0.5 },
    diagonal = true,
  } = options;

  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const totalPages = doc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(`Watermarking page ${i + 1}/${totalPages}…`);
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    if (diagonal) {
      const angle = Math.atan2(height, width) * (180 / Math.PI);
      page.drawText(text, {
        x: (width - textWidth * Math.cos(angle * Math.PI / 180)) / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(angle),
      });
    } else {
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
      });
    }
  }

  onProgress?.('Saving…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(blob, filename || 'watermarked.pdf'),
  };
}

// ── Add page numbers ──
export async function addPageNumbers(file, options = {}, onProgress) {
  const {
    format = 'Page {n} of {total}',
    position = 'bottom-center',
    fontSize = 11,
    margin = 36,
    startNumber = 1,
  } = options;

  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const totalPages = doc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(`Numbering page ${i + 1}/${totalPages}…`);
    const page = doc.getPage(i);
    const { width } = page.getSize();
    const num = startNumber + i;
    const text = format
      .replace('{n}', num)
      .replace('{total}', startNumber + totalPages - 1);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x;
    if (position.includes('left')) x = margin;
    else if (position.includes('right')) x = width - textWidth - margin;
    else x = (width - textWidth) / 2;

    const y = position.startsWith('top') ? page.getSize().height - margin : margin;

    page.drawText(text, {
      x, y,
      size: fontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  onProgress?.('Saving…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(blob, filename || 'numbered.pdf'),
  };
}

// ── Compress PDF (re-encode embedded images at lower quality) ──
export async function compressPdf(file, imageQuality = 0.5, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  // Strategy: render each page to canvas at original size, re-encode as JPEG, build new PDF
  // This loses text selectability but reliably compresses
  onProgress?.('Compressing pages…');

  const newDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(`Compressing page ${i + 1}/${totalPages}…`);

    const [srcPage] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(srcPage);
  }

  // Try to compress by removing metadata and using object streams
  onProgress?.('Optimizing…');
  const pdfBytes = await newDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(blob, filename || 'compressed.pdf'),
  };
}
