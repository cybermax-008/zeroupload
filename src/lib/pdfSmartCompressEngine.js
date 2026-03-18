/**
 * ═══════════════════════════════════════════════════════════════
 * Smart PDF Compression Engine
 *
 * Selectively recompresses embedded images while preserving
 * PDF structure, text, vectors, and fonts. Uses MozJPEG
 * (via wasm-vips) with SSIM-guided perceptual quality search.
 * ═══════════════════════════════════════════════════════════════
 */

import { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray, PDFRef } from 'pdf-lib';
import { getVipsInstance } from './imageEngine';
import { computeSSIM, rgbToGrayscale, downsampleGray } from './ssim';

// ── Constants ──
const SKIP = 0, RECOMPRESS = 1, DOWNSAMPLE = 2;
const THUMB_MAX = 256;

// ── Pixel helpers ──

function rgbaToRgb(rgba) {
  const rgb = new Uint8Array((rgba.length >> 2) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return rgb;
}

function grayToRgb(gray, pixelCount) {
  const rgb = new Uint8Array(pixelCount * 3);
  for (let i = 0, j = 0; i < pixelCount; i++, j += 3) {
    rgb[j] = rgb[j + 1] = rgb[j + 2] = gray[i];
  }
  return rgb;
}

function rgbToRgba(rgb) {
  const rgba = new Uint8Array((rgb.length / 3) * 4);
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    rgba[j] = rgb[i];
    rgba[j + 1] = rgb[i + 1];
    rgba[j + 2] = rgb[i + 2];
    rgba[j + 3] = 255;
  }
  return rgba;
}

// ── Image loading ──

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// ── Inflate (FlateDecode decompression) ──

async function inflate(data) {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(data);
    writer.close();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  } catch {
    return null;
  }
}

// ── PNG row un-filtering (Predictor >= 10) ──

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterPNG(data, width, bpp) {
  const stride = width * bpp;
  const rowLen = stride + 1; // +1 for filter type byte
  const height = Math.floor(data.length / rowLen);
  if (height === 0) return null;
  const out = new Uint8Array(height * stride);

  for (let y = 0; y < height; y++) {
    const filterType = data[y * rowLen];
    const srcOff = y * rowLen + 1;
    const dstOff = y * stride;
    const prevOff = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const raw = data[srcOff + x];
      const a = x >= bpp ? out[dstOff + x - bpp] : 0;
      const b = y > 0 ? out[prevOff + x] : 0;
      const c = (x >= bpp && y > 0) ? out[prevOff + x - bpp] : 0;

      switch (filterType) {
        case 0: out[dstOff + x] = raw; break;
        case 1: out[dstOff + x] = (raw + a) & 0xff; break;
        case 2: out[dstOff + x] = (raw + b) & 0xff; break;
        case 3: out[dstOff + x] = (raw + ((a + b) >> 1)) & 0xff; break;
        case 4: out[dstOff + x] = (raw + paeth(a, b, c)) & 0xff; break;
        default: out[dstOff + x] = raw;
      }
    }
  }
  return out;
}

// ── PDF dict helpers ──

function lookupNumber(dict, key, context) {
  if (!dict) return undefined;
  let val = dict.get(PDFName.of(key));
  if (val instanceof PDFRef) val = context.lookup(val);
  return (val && typeof val.asNumber === 'function') ? val.asNumber() : undefined;
}

function getFilterName(dict, context) {
  let filter = dict.get(PDFName.of('Filter'));
  if (!filter) return null;
  if (filter instanceof PDFRef) filter = context.lookup(filter);
  if (filter instanceof PDFArray) {
    if (filter.size() !== 1) return 'multi';
    filter = filter.get(0);
    if (filter instanceof PDFRef) filter = context.lookup(filter);
  }
  if (filter === PDFName.of('DCTDecode')) return 'DCTDecode';
  if (filter === PDFName.of('FlateDecode')) return 'FlateDecode';
  if (filter === PDFName.of('JBIG2Decode')) return 'JBIG2Decode';
  if (filter === PDFName.of('JPXDecode')) return 'JPXDecode';
  if (filter instanceof PDFName) return 'other';
  return null;
}

function getColorSpaceInfo(cs, context) {
  if (!cs) return null;
  if (cs instanceof PDFRef) return getColorSpaceInfo(context.lookup(cs), context);
  if (cs === PDFName.of('DeviceRGB')) return { components: 3 };
  if (cs === PDFName.of('DeviceGray')) return { components: 1 };
  if (cs === PDFName.of('DeviceCMYK')) return { components: 4 };
  if (cs instanceof PDFArray && cs.size() >= 2) {
    let first = cs.get(0);
    if (first instanceof PDFRef) first = context.lookup(first);
    if (first === PDFName.of('ICCBased')) {
      let profile = cs.get(1);
      if (profile instanceof PDFRef) profile = context.lookup(profile);
      if (profile?.dict) {
        const n = lookupNumber(profile.dict, 'N', context);
        if (n === 3) return { components: 3 };
        if (n === 1) return { components: 1 };
        if (n === 4) return { components: 4 };
      }
    }
    if (first === PDFName.of('CalRGB')) return { components: 3 };
    if (first === PDFName.of('CalGray')) return { components: 1 };
  }
  return { components: 0 };
}

// ── Decode image streams to RGB pixels ──

async function decodeJpegToRgb(jpegBytes) {
  const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImg(url);
    const w = img.naturalWidth, h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, w, h).data;
    return { rgb: rgbaToRgb(new Uint8Array(rgba.buffer)), width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeFlatDecodeToRgb(imgInfo, context) {
  const inflated = await inflate(imgInfo.obj.contents);
  if (!inflated) return null;

  const { width, height, csInfo, dict } = imgInfo;
  const components = csInfo.components;

  // Check for predictor in DecodeParms
  let decodeParms = dict.get(PDFName.of('DecodeParms'));
  if (decodeParms instanceof PDFRef) decodeParms = context.lookup(decodeParms);
  const predictor = (decodeParms instanceof PDFDict)
    ? (lookupNumber(decodeParms, 'Predictor', context) || 1)
    : 1;

  let pixels;
  if (predictor >= 10) {
    pixels = unfilterPNG(inflated, width, components);
    if (!pixels) return null;
  } else if (predictor === 1) {
    pixels = inflated;
  } else {
    return null; // Unsupported predictor (e.g. TIFF)
  }

  // Verify size
  const expected = width * height * components;
  if (pixels.length < expected) return null;

  if (components === 1) return grayToRgb(pixels, width * height);
  if (components === 3) return pixels.length === expected ? pixels : pixels.subarray(0, expected);
  return null;
}

// ── Canvas-based RGB resize ──

async function resizeRgbCanvas(rgb, srcW, srcH, dstW, dstH) {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const rgba = rgbToRgba(rgb);
  srcCanvas.getContext('2d').putImageData(
    new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), srcW, srcH),
    0, 0,
  );
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  dstCanvas.getContext('2d').drawImage(srcCanvas, 0, 0, dstW, dstH);
  const result = dstCanvas.getContext('2d').getImageData(0, 0, dstW, dstH);
  return rgbaToRgb(new Uint8Array(result.data.buffer));
}

function getDownsampleDims(w, h, maxPixels) {
  if (w * h <= maxPixels) return { width: w, height: h };
  const scale = Math.sqrt(maxPixels / (w * h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

// ── JPEG encoding (MozJPEG via vips, canvas fallback) ──

async function encodeJpeg(rgb, width, height, quality, vips) {
  if (vips) {
    try {
      const img = vips.Image.newFromMemory(rgb, width, height, 3, 'uchar');
      try {
        const buf = img.writeToBuffer('.jpg', {
          Q: quality,
          optimize_coding: true,
          trellis_quant: true,
          overshoot_deringing: true,
          optimize_scans: true,
        });
        return new Uint8Array(buf);
      } finally {
        img.delete();
      }
    } catch (e) {
      console.warn('[SmartCompress] vips encode failed, using canvas:', e.message);
    }
  }
  // Canvas fallback
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const rgba = rgbToRgba(rgb);
  canvas.getContext('2d').putImageData(
    new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), width, height),
    0, 0,
  );
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality / 100));
  return new Uint8Array(await blob.arrayBuffer());
}

// ── SSIM-guided quality binary search ──

async function ssimSearch(rgb, width, height, opts) {
  const { targetSSIM, maxQuality, minQuality, vips } = opts;

  // Prepare reference thumbnail (original → grayscale → downsample)
  const refGray = rgbToGrayscale(rgb, width, height);
  const ref = downsampleGray(refGray, width, height, THUMB_MAX);

  // Try a quality, return { jpegBytes, ssim }
  async function tryQ(q) {
    const jpegBytes = await encodeJpeg(rgb, width, height, q, vips);
    // Decode compressed JPEG to measure distortion
    const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadImg(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const testRgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const testGray = rgbToGrayscale(testRgba, canvas.width, canvas.height);
      const test = downsampleGray(testGray, canvas.width, canvas.height, THUMB_MAX);
      const ssim = computeSSIM(ref.data, test.data, ref.width, ref.height);
      return { jpegBytes, ssim };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // 1. Try maxQuality — best we can do
  let best = await tryQ(maxQuality);
  if (best.ssim < targetSSIM) return best; // Can't meet target even at max

  // 2. Try minQuality — check if it's already good enough
  const minResult = await tryQ(minQuality);
  if (minResult.ssim >= targetSSIM) return minResult;

  // 3. Binary search (4 iterations)
  let lo = minQuality, hi = maxQuality;
  for (let i = 0; i < 4; i++) {
    const mid = Math.round((lo + hi) / 2);
    if (mid === lo || mid === hi) break;
    const trial = await tryQ(mid);
    if (trial.ssim >= targetSSIM) {
      best = trial;
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return best;
}

// ── Image classification ──

function classifyStream(obj, ref, context, minStreamSize, downsampleThreshold) {
  const dict = obj.dict;
  const subtype = dict.get(PDFName.of('Subtype'));
  if (!subtype || subtype !== PDFName.of('Image')) return null;

  const width = lookupNumber(dict, 'Width', context);
  const height = lookupNumber(dict, 'Height', context);
  if (!width || !height) return null;

  const bpc = lookupNumber(dict, 'BitsPerComponent', context);
  const streamSize = obj.contents.length;
  const filterName = getFilterName(dict, context);
  const csInfo = getColorSpaceInfo(dict.get(PDFName.of('ColorSpace')), context);
  const smask = dict.get(PDFName.of('SMask'));

  // Strategy assignment (first match wins)
  let strategy;
  if (bpc === 1) {
    strategy = SKIP;
  } else if (!filterName || filterName === 'JBIG2Decode' || filterName === 'JPXDecode' ||
             filterName === 'other' || filterName === 'multi') {
    strategy = SKIP;
  } else if (streamSize < minStreamSize) {
    strategy = SKIP;
  } else if (!csInfo || csInfo.components === 0 || csInfo.components === 4) {
    strategy = SKIP;
  } else if (width * height > downsampleThreshold) {
    strategy = DOWNSAMPLE;
  } else {
    strategy = RECOMPRESS;
  }

  return { ref, obj, dict, width, height, bpc, streamSize, filterName, csInfo, smask, strategy };
}

// ── Process a single image ──

async function processImage(doc, img, opts) {
  const { targetSSIM, maxQuality, minQuality, vips, downsampleThreshold } = opts;

  // Decode to RGB pixels
  let rgb, width = img.width, height = img.height;
  if (img.filterName === 'DCTDecode') {
    const decoded = await decodeJpegToRgb(img.obj.contents);
    rgb = decoded.rgb;
    width = decoded.width;
    height = decoded.height;
  } else if (img.filterName === 'FlateDecode') {
    rgb = await decodeFlatDecodeToRgb(img, doc.context);
    if (!rgb) return null;
  } else {
    return null;
  }

  // Downsample if needed
  if (img.strategy === DOWNSAMPLE) {
    const dims = getDownsampleDims(width, height, downsampleThreshold);
    rgb = await resizeRgbCanvas(rgb, width, height, dims.width, dims.height);
    width = dims.width;
    height = dims.height;
  }

  // SSIM-guided binary search for optimal quality
  const result = await ssimSearch(rgb, width, height, {
    targetSSIM, maxQuality, minQuality, vips,
  });
  rgb = null; // Allow GC

  if (!result || result.jpegBytes.length >= img.streamSize) return null;

  // Build replacement stream dict
  const newDict = doc.context.obj({
    Type: 'XObject',
    Subtype: 'Image',
    Width: width,
    Height: height,
    ColorSpace: 'DeviceRGB',
    BitsPerComponent: 8,
    Filter: 'DCTDecode',
    Length: result.jpegBytes.length,
  });

  // Preserve SMask reference if original had one
  if (img.smask && img.smask !== PDFName.of('None')) {
    newDict.set(PDFName.of('SMask'), img.smask);
  }

  const newStream = PDFRawStream.of(newDict, result.jpegBytes);
  doc.context.assign(img.ref, newStream);

  return { newSize: result.jpegBytes.length };
}

// ── Main export ──

export async function smartCompressPdf(file, options = {}, onProgress) {
  const {
    targetSSIM = 0.95,
    maxQuality = 82,
    minQuality = 30,
    downsampleThreshold = 2_000_000,
    minStreamSize = 50 * 1024,
  } = options;

  // Phase 0: Load PDF
  onProgress?.('Reading PDF…');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  // Phase 1: Find and classify images
  onProgress?.('Analyzing images…');
  const images = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const info = classifyStream(obj, ref, doc.context, minStreamSize, downsampleThreshold);
    if (info) images.push(info);
  }

  const stats = {
    totalImages: images.length,
    imagesRecompressed: 0,
    imagesDownsampled: 0,
    imagesSkipped: 0,
    originalImageBytes: 0,
    newImageBytes: 0,
  };

  const toProcess = images.filter(i => i.strategy !== SKIP);
  stats.imagesSkipped = images.length - toProcess.length;

  // Phase 2: Process images sequentially (memory safety)
  const vips = getVipsInstance();

  for (let i = 0; i < toProcess.length; i++) {
    const img = toProcess[i];
    onProgress?.(`Compressing image ${i + 1}/${toProcess.length}…`);

    try {
      const result = await processImage(doc, img, {
        targetSSIM, maxQuality, minQuality, vips, downsampleThreshold,
      });
      if (result) {
        stats.originalImageBytes += img.streamSize;
        stats.newImageBytes += result.newSize;
        if (img.strategy === DOWNSAMPLE) stats.imagesDownsampled++;
        else stats.imagesRecompressed++;
      } else {
        stats.imagesSkipped++;
      }
    } catch (err) {
      console.warn('[SmartCompress] Skipping image:', err.message);
      stats.imagesSkipped++;
    }
  }

  // Phase 3: Save with structural optimization
  onProgress?.('Saving…');
  const pdfBytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    pageCount: doc.getPageCount(),
    stats,
    download(filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'compressed.pdf';
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}
