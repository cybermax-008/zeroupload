/**
 * ZeroUpload PDF Security Engine
 *
 * Protect (password encrypt) and Unlock PDFs.
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
 * Unlock a password-protected PDF.
 * Opens with the user-provided password, then re-saves without encryption.
 */
export async function unlockPdf(file, password, onProgress) {
  onProgress?.('Reading encrypted PDF…');
  const bytes = await readFileAsArrayBuffer(file);

  onProgress?.('Decrypting…');
  // pdfjs-dist handles decryption on load
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: bytes, password }).promise;
  } catch (e) {
    if (e.name === 'PasswordException') {
      throw new Error('Incorrect password');
    }
    throw e;
  }

  // Render each page and rebuild as a clean PDF using pdf-lib
  // This ensures all encryption is stripped
  const newDoc = await PDFDocument.create();
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Processing page ${i}/${totalPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
    const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
    const img = await newDoc.embedJpg(imgBytes);

    // Use original page dimensions (in points)
    const origViewport = page.getViewport({ scale: 1 });
    const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(img, {
      x: 0, y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  onProgress?.('Saving…');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(blob, filename || 'unlocked.pdf'),
  };
}

/**
 * Protect a PDF with a password.
 * Renders pages via pdfjs-dist, then rebuilds with jsPDF which has
 * built-in encryption support.
 */
export async function protectPdf(file, userPassword, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);

  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }

  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const totalPages = pdf.numPages;

  onProgress?.('Rendering pages…');
  const { default: jsPDF } = await import('jspdf');

  // Get first page to determine initial orientation/size
  const firstPage = await pdf.getPage(1);
  const firstVp = firstPage.getViewport({ scale: 1 });
  const orientation = firstVp.width > firstVp.height ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: [firstVp.width, firstVp.height],
    encryption: {
      userPassword: userPassword,
      ownerPassword: userPassword,
      userPermissions: [],
    },
  });

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Encrypting page ${i}/${totalPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const origVp = page.getViewport({ scale: 1 });

    if (i > 1) {
      const orient = origVp.width > origVp.height ? 'landscape' : 'portrait';
      doc.addPage([origVp.width, origVp.height], orient);
    }

    doc.addImage(imgData, 'JPEG', 0, 0, origVp.width, origVp.height);
  }

  onProgress?.('Saving encrypted PDF…');
  const pdfBlob = doc.output('blob');

  return {
    blob: pdfBlob,
    pageCount: totalPages,
    download: (filename) => downloadBlob(pdfBlob, filename || 'protected.pdf'),
  };
}
