/**
 * Acorn Tools Metadata Engine
 *
 * Strips EXIF/metadata from images and PDFs.
 * All operations run client-side.
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
 * Read EXIF metadata from a JPEG file.
 * Returns an array of { tag, value } entries.
 */
export function readImageMetadata(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const entries = [];

  if (view.getUint16(0) !== 0xFFD8) return entries; // Not JPEG

  let offset = 2;
  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) { // APP1 — EXIF
      const length = view.getUint16(offset + 2);
      const exifData = parseExif(view, offset + 4, length - 2);
      entries.push(...exifData);
      break;
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    const segLen = view.getUint16(offset + 2);
    offset += 2 + segLen;
  }

  return entries;
}

function parseExif(view, start, length) {
  const entries = [];
  const end = start + length;

  // Check for "Exif\0\0"
  if (start + 6 > view.byteLength) return entries;
  const exifHeader = String.fromCharCode(
    view.getUint8(start), view.getUint8(start + 1),
    view.getUint8(start + 2), view.getUint8(start + 3)
  );
  if (exifHeader !== 'Exif') return entries;

  const tiffStart = start + 6;
  if (tiffStart + 8 > view.byteLength) return entries;
  const byteOrder = view.getUint16(tiffStart);
  const le = byteOrder === 0x4949; // Intel byte order

  const getU16 = (off) => view.getUint16(off, le);
  const getU32 = (off) => view.getUint32(off, le);

  const TAG_NAMES = {
    0x010F: 'Camera Make',
    0x0110: 'Camera Model',
    0x0131: 'Software',
    0x0132: 'Date/Time',
    0x013B: 'Artist',
    0x8298: 'Copyright',
    0x8769: 'EXIF IFD',
    0x8825: 'GPS Data',
    0x9003: 'Date Taken',
    0x9004: 'Date Digitized',
    0xA002: 'Image Width',
    0xA003: 'Image Height',
    0xA434: 'Lens Model',
    0x0001: 'GPS Latitude Ref',
    0x0002: 'GPS Latitude',
    0x0003: 'GPS Longitude Ref',
    0x0004: 'GPS Longitude',
  };

  try {
    const ifdOffset = tiffStart + getU32(tiffStart + 4);
    if (ifdOffset + 2 > end) return entries;
    const numEntries = getU16(ifdOffset);

    for (let i = 0; i < numEntries && i < 50; i++) {
      const entryOff = ifdOffset + 2 + i * 12;
      if (entryOff + 12 > view.byteLength) break;
      const tag = getU16(entryOff);
      const tagName = TAG_NAMES[tag];
      if (tagName) {
        if (tag === 0x8825) {
          entries.push({ tag: 'GPS Location', value: 'Present (will be removed)' });
        } else if (tag === 0x8769) {
          entries.push({ tag: 'EXIF Data', value: 'Present (will be removed)' });
        } else {
          const type = getU16(entryOff + 2);
          const count = getU32(entryOff + 4);
          let value = readTagValue(view, entryOff, type, count, tiffStart, le);
          entries.push({ tag: tagName, value: value || 'Present' });
        }
      }
    }
  } catch {
    // Malformed EXIF, just return what we have
  }

  return entries;
}

function readTagValue(view, entryOff, type, count, tiffStart, le) {
  const getU16 = (off) => view.getUint16(off, le);
  const getU32 = (off) => view.getUint32(off, le);

  // ASCII string
  if (type === 2 && count > 0 && count < 200) {
    let dataOff = count <= 4 ? entryOff + 8 : tiffStart + getU32(entryOff + 8);
    if (dataOff + count > view.byteLength) return null;
    let str = '';
    for (let j = 0; j < count - 1 && dataOff + j < view.byteLength; j++) {
      const c = view.getUint8(dataOff + j);
      if (c === 0) break;
      str += String.fromCharCode(c);
    }
    return str.trim();
  }
  // SHORT
  if (type === 3) return String(getU16(entryOff + 8));
  // LONG
  if (type === 4) return String(getU32(entryOff + 8));
  return null;
}

/**
 * Strip all metadata from an image by re-encoding through canvas.
 * Preserves visual quality but removes all EXIF, GPS, device info.
 */
export async function stripImageMetadata(file, onProgress) {
  onProgress?.('Reading image…');
  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load image'));
      i.src = url;
    });

    onProgress?.('Stripping metadata…');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Re-encode — canvas output has zero metadata
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const quality = isJpeg ? 0.95 : undefined;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Failed to encode image')),
        mimeType,
        quality
      );
    });

    return {
      blob,
      download: (filename) => downloadBlob(blob, filename || 'clean_' + file.name),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Strip metadata from a PDF (author, creator, producer, dates, etc.)
 */
export async function stripPdfMetadata(file, onProgress) {
  onProgress?.('Reading PDF…');
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  onProgress?.('Stripping metadata…');
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));

  onProgress?.('Saving…');
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: doc.getPageCount(),
    download: (filename) => downloadBlob(blob, filename || 'clean_' + file.name),
  };
}

/**
 * Read PDF metadata fields for display.
 */
export async function readPdfMetadata(file) {
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const entries = [];

  const title = doc.getTitle();
  const author = doc.getAuthor();
  const subject = doc.getSubject();
  const keywords = doc.getKeywords();
  const producer = doc.getProducer();
  const creator = doc.getCreator();
  const created = doc.getCreationDate();
  const modified = doc.getModificationDate();

  if (title) entries.push({ tag: 'Title', value: title });
  if (author) entries.push({ tag: 'Author', value: author });
  if (subject) entries.push({ tag: 'Subject', value: subject });
  if (keywords) entries.push({ tag: 'Keywords', value: keywords });
  if (producer) entries.push({ tag: 'Producer', value: producer });
  if (creator) entries.push({ tag: 'Creator', value: creator });
  if (created) entries.push({ tag: 'Created', value: created.toISOString() });
  if (modified) entries.push({ tag: 'Modified', value: modified.toISOString() });

  return entries;
}
