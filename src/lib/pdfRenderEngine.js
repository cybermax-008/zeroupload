/**
 * ZeroUpload PDF Render Engine
 *
 * Renders PDF pages to images using pdfjs-dist.
 * Lazy-loaded — only imported when PDF→Image tab is used.
 */

let pdfjsLib = null;

export async function initPdfRenderer() {
  if (pdfjsLib) return pdfjsLib;

  const pdfjs = await import('pdfjs-dist');
  pdfjsLib = pdfjs;

  // Set up worker — use URL to the worker file for Vite compatibility
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  return pdfjsLib;
}

/**
 * Convert PDF pages to images.
 * @param {File} file - PDF file
 * @param {object} options - { format, quality, scale, pageRange }
 * @param {function} onProgress - progress callback
 * @returns {Promise<Array<{ blob, pageNum, width, height, download }>>}
 */
export async function pdfToImages(file, options = {}, onProgress) {
  const {
    format = 'image/jpeg',
    quality = 0.92,
    scale = 2,
    pageRange = null,
  } = options;

  onProgress?.('Loading PDF renderer…');
  const pdfjs = await initPdfRenderer();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;

  // Determine which pages to render
  let pageNums;
  if (pageRange) {
    pageNums = [];
    pageRange.split(',').forEach(part => {
      const trimmed = part.trim();
      const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = Math.max(1, parseInt(rangeMatch[1]));
        const end = Math.min(totalPages, parseInt(rangeMatch[2]));
        for (let i = start; i <= end; i++) pageNums.push(i);
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= totalPages) pageNums.push(num);
      }
    });
    pageNums = [...new Set(pageNums)].sort((a, b) => a - b);
  } else {
    pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (pageNums.length === 0) throw new Error('No valid pages selected');

  const results = [];

  for (let i = 0; i < pageNums.length; i++) {
    const pageNum = pageNums[i];
    onProgress?.(`Rendering page ${pageNum}/${totalPages}…`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // White background for JPEG
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('Failed to render page')),
        format,
        quality
      );
    });

    const ext = format === 'image/png' ? '.png' : '.jpg';

    results.push({
      blob,
      pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      download: (filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `page_${pageNum}${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  return results;
}

export function getPdfRendererInfo() {
  return { ready: pdfjsLib !== null };
}
