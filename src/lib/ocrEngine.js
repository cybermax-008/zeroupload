/**
 * ZeroUpload OCR Engine
 *
 * Extracts text from images and scanned PDFs using tesseract.js.
 * All processing runs client-side in Web Workers.
 */

let worker = null;

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'kor', label: 'Korean' },
  { code: 'ara', label: 'Arabic' },
  { code: 'hin', label: 'Hindi' },
  { code: 'rus', label: 'Russian' },
];

export { LANGUAGES };

/**
 * Initialize OCR worker for a given language.
 * Lazy-loads tesseract.js on first call.
 */
async function getWorker(lang = 'eng') {
  if (worker) {
    await worker.terminate();
    worker = null;
  }

  const Tesseract = await import('tesseract.js');
  worker = await Tesseract.createWorker(lang, undefined, {
    logger: () => {},  // Suppress default logging
  });

  return worker;
}

/**
 * OCR a single image file.
 * Returns { text, confidence }.
 */
export async function ocrImage(imageFile, lang = 'eng', onProgress) {
  onProgress?.('Loading OCR engine…');
  const w = await getWorker(lang);

  onProgress?.('Recognizing text…');
  const { data } = await w.recognize(imageFile);

  return {
    text: data.text,
    confidence: data.confidence,
  };
}

/**
 * OCR all pages (or specified pages) of a PDF.
 * Renders each page to canvas, then runs OCR.
 * Returns { pages: [{ pageNum, text, confidence }], fullText }.
 */
export async function ocrPdf(pdfFile, lang = 'eng', onProgress) {
  onProgress?.('Loading PDF renderer…');
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  }

  const buffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;

  onProgress?.('Loading OCR engine…');
  const w = await getWorker(lang);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`OCR page ${i}/${totalPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert canvas to blob for tesseract
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const { data } = await w.recognize(blob);

    pages.push({
      pageNum: i,
      text: data.text,
      confidence: data.confidence,
    });
  }

  const fullText = pages.map(p => p.text).join('\n\n--- Page Break ---\n\n');

  return { pages, fullText };
}

/**
 * Cleanup OCR worker.
 */
export async function destroyOcrEngine() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
