/**
 * ZeroUpload PDF Page Engine
 *
 * Page-level operations: reorder, delete, insert, thumbnails.
 * All operations run client-side using pdf-lib + pdfjs-dist.
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

/**
 * Get page thumbnails for a PDF.
 * Returns array of { pageNum, blob, width, height }.
 */
export async function getPdfThumbnails(file, scale = 0.3, onProgress) {
  onProgress?.('Loading PDF renderer…');
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }

  const buffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const thumbnails = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Rendering thumbnail ${i}/${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.7));
    thumbnails.push({
      pageNum: i,
      blob,
      url: URL.createObjectURL(blob),
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    });
  }

  return thumbnails;
}

/**
 * Rebuild a PDF with pages in the given order.
 * @param {File} file - original PDF
 * @param {number[]} newOrder - array of 0-based page indices in desired order
 */
export async function reorderPdfPages(file, newOrder, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  onProgress?.(`Reordering ${newOrder.length} pages…`);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, newOrder);
  pages.forEach(p => newDoc.addPage(p));

  onProgress?.('Saving…');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: newDoc.getPageCount(),
    download: (filename) => downloadBlob(blob, filename || 'reordered.pdf'),
  };
}

/**
 * Delete specific pages from a PDF.
 * @param {File} file - original PDF
 * @param {Set<number>} deleteIndices - set of 0-based indices to remove
 */
export async function deletePdfPages(file, deleteIndices, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const keepIndices = [];
  for (let i = 0; i < totalPages; i++) {
    if (!deleteIndices.has(i)) keepIndices.push(i);
  }

  if (keepIndices.length === 0) throw new Error('Cannot delete all pages');

  onProgress?.(`Keeping ${keepIndices.length} pages…`);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, keepIndices);
  pages.forEach(p => newDoc.addPage(p));

  onProgress?.('Saving…');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: newDoc.getPageCount(),
    download: (filename) => downloadBlob(blob, filename || 'edited.pdf'),
  };
}

/**
 * Insert pages from a source PDF into a target PDF at a given index.
 */
export async function insertPdfPages(targetFile, sourceFile, insertIndex, onProgress) {
  onProgress?.('Reading PDFs…');
  const [targetBytes, sourceBytes] = await Promise.all([
    readFileAsArrayBuffer(targetFile),
    readFileAsArrayBuffer(sourceFile),
  ]);

  const targetDoc = await PDFDocument.load(targetBytes, { ignoreEncryption: true });
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });

  onProgress?.('Inserting pages…');
  const newDoc = await PDFDocument.create();
  const targetPages = await newDoc.copyPages(targetDoc, targetDoc.getPageIndices());
  const sourcePages = await newDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());

  // Add target pages up to insert index
  for (let i = 0; i < insertIndex && i < targetPages.length; i++) {
    newDoc.addPage(targetPages[i]);
  }
  // Add source pages
  sourcePages.forEach(p => newDoc.addPage(p));
  // Add remaining target pages
  for (let i = insertIndex; i < targetPages.length; i++) {
    newDoc.addPage(targetPages[i]);
  }

  onProgress?.('Saving…');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: newDoc.getPageCount(),
    download: (filename) => downloadBlob(blob, filename || 'combined.pdf'),
  };
}
