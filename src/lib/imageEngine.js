/**
 * ═══════════════════════════════════════════════════════════════
 * Acorn Tools Image Engine
 * 
 * Dual-engine architecture:
 *   1. wasm-vips (PRIMARY)  — libvips compiled to WASM, best quality
 *   2. Pica.js   (FALLBACK) — Lanczos3 in JS, no CORS headers needed
 * 
 * The engine auto-detects SharedArrayBuffer support and falls
 * back gracefully. On Capacitor (iOS/Android), wasm-vips works
 * natively in the WebView.
 * ═══════════════════════════════════════════════════════════════
 */

// ── State ──
let engineType = null; // 'vips' | 'pica'
let vipsInstance = null;
let picaInstance = null;
let initPromise = null;

// ── Feature detection ──
function hasSharedArrayBuffer() {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
}

function hasCrossOriginIsolation() {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
}

// ── Timeout helper ──
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// ── Initialize engine ──
export async function initEngine(preferVips = true) {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Try wasm-vips first if conditions are met
    if (preferVips && hasSharedArrayBuffer() && hasCrossOriginIsolation()) {
      try {
        const Vips = (await import('wasm-vips')).default;
        vipsInstance = await withTimeout(
          Vips({ dynamicLibraries: [] }),
          30000,
          'wasm-vips init'
        );
        engineType = 'vips';
        console.log('[AcornTools] Engine: wasm-vips (libvips) ✓');
        return { engine: 'vips', quality: 'maximum' };
      } catch (err) {
        console.warn('[AcornTools] wasm-vips failed, falling back to Pica:', err.message);
        vipsInstance = null;
      }
    }

    // Fallback to Pica
    try {
      const Pica = (await import('pica')).default;
      picaInstance = new Pica({
        features: ['js', 'wasm', 'ww'], // Use WASM + WebWorkers when available
      });
      engineType = 'pica';
      console.log('[AcornTools] Engine: Pica (Lanczos3) ✓');
      return { engine: 'pica', quality: 'high' };
    } catch (err) {
      throw new Error('Failed to initialize any image engine: ' + err.message);
    }
  })();

  return initPromise;
}

// ── Get vips instance (for direct access by other engines) ──
export function getVipsInstance() {
  return vipsInstance;
}

// ── Get engine info ──
export function getEngineInfo() {
  return {
    type: engineType,
    label: engineType === 'vips' ? 'libvips (WASM)' : 'Pica (Lanczos3)',
    qualityLabel: engineType === 'vips' ? 'Maximum' : 'High',
    ready: engineType !== null,
  };
}

// ── Buffer helper for vips ──
async function toVipsBuffer(input) {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input instanceof Blob || input instanceof File) return new Uint8Array(await input.arrayBuffer());
  throw new Error('Unsupported input type');
}

// ── Format helpers ──
const VIPS_FORMAT_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/tiff': '.tiff',
};

const VIPS_SAVE_OPTIONS = {
  'image/jpeg': (q) => ({ Q: Math.round(q * 100) }),
  'image/png': () => ({ compression: 6 }),
  'image/webp': (q) => ({ Q: Math.round(q * 100) }),
  'image/avif': (q) => ({ Q: Math.round(q * 100) }),
};

// ── Resize with wasm-vips ──
async function resizeVips(imageBuffer, targetW, targetH, format, quality, options = {}) {
  if (!vipsInstance) throw new Error('wasm-vips not initialized');
  const vips = vipsInstance;

  // Load image from buffer
  const img = vips.Image.newFromBuffer(imageBuffer);

  try {
    const srcW = img.width;
    const srcH = img.height;

    // Calculate scale — use thumbnailBuffer for best quality downscaling
    // libvips thumbnail uses a multi-pass approach: 
    //   1. Shrink-on-load (JPEG/WebP shrink flags)
    //   2. Affine resize with Lanczos3
    //   3. Sharpen
    let processed;

    if (targetW < srcW || targetH < srcH) {
      // Downscaling — use thumbnail pipeline for best results
      processed = vips.Image.thumbnailBuffer(imageBuffer, targetW, {
        height: targetH,
        size: options.crop ? 'both' : 'down',
        crop: options.crop ? vips.Interesting.attention : vips.Interesting.none,
        no_rotate: true,
        linear: false, // Use sRGB-aware processing
      });
    } else {
      // Upscaling — use affine resize with Lanczos3
      const hScale = targetW / srcW;
      const vScale = targetH / srcH;
      const scale = Math.min(hScale, vScale);
      processed = img.resize(scale, {
        kernel: vips.Kernel.lanczos3,
        gap: 0, // No gap between passes
      });
    }

    // Optional: apply unsharp mask for crispness after resize
    if (options.sharpen !== false) {
      const sharpened = processed.sharpen({
        sigma: 0.5,
        x1: 2,
        y2: 10,
        y3: 20,
        m1: 0,
        m2: 3,
      });
      processed.delete();
      processed = sharpened;
    }

    // Write to output format
    const ext = VIPS_FORMAT_MAP[format] || '.png';
    const saveOpts = VIPS_SAVE_OPTIONS[format]?.(quality) || {};
    const outBuffer = processed.writeToBuffer(ext, saveOpts);

    processed.delete();
    img.delete();

    return new Blob([outBuffer], { type: format });
  } catch (err) {
    img.delete();
    throw err;
  }
}

// ── Resize with Pica ──
async function resizePica(imageSource, targetW, targetH, format, quality) {
  if (!picaInstance) throw new Error('Pica not initialized');

  // imageSource can be HTMLImageElement, Canvas, or ImageBitmap
  let srcCanvas;

  if (imageSource instanceof HTMLCanvasElement) {
    srcCanvas = imageSource;
  } else {
    // It's an Image element — draw to canvas
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageSource.naturalWidth || imageSource.width;
    srcCanvas.height = imageSource.naturalHeight || imageSource.height;
    srcCanvas.getContext('2d').drawImage(imageSource, 0, 0);
  }

  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetW;
  destCanvas.height = targetH;

  await picaInstance.resize(srcCanvas, destCanvas, {
    quality: 3, // Maximum quality (Lanczos3 with window=3)
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
    alpha: true,
  });

  return new Promise((resolve, reject) => {
    destCanvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      format,
      quality
    );
  });
}

// ── Public API ──

/**
 * Resize an image with the best available engine.
 * 
 * @param {File|Blob|ArrayBuffer} input - Source image
 * @param {number} targetW - Target width in pixels
 * @param {number} targetH - Target height in pixels  
 * @param {string} format - Output MIME type ('image/jpeg', 'image/png', 'image/webp')
 * @param {number} quality - Output quality 0-1 (for JPEG/WebP)
 * @param {object} options - Extra options { sharpen, crop }
 * @returns {Promise<Blob>} - Processed image blob
 */
export async function resizeImage(input, targetW, targetH, format = 'image/png', quality = 0.92, options = {}) {
  await initEngine();

  if (engineType === 'vips') {
    try {
      const buffer = await toVipsBuffer(input);
      return await withTimeout(
        resizeVips(buffer, targetW, targetH, format, quality, options),
        60000,
        'Image resize'
      );
    } catch (err) {
      console.warn('[AcornTools] vips resize failed, falling back to Pica:', err.message);
      // Fall through to Pica path below
    }
  }

  // Pica path — needs an HTMLImageElement
  if (input instanceof HTMLImageElement) {
    return resizePica(input, targetW, targetH, format, quality);
  }

  // Convert File/Blob to Image element for Pica
  const url = URL.createObjectURL(input instanceof Blob ? input : new Blob([input]));
  try {
    const img = await loadImageElement(url);
    return resizePica(img, targetW, targetH, format, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Convert image format without resizing.
 */
export async function convertFormat(input, format, quality = 0.92) {
  await initEngine();

  if (engineType === 'vips') {
    try {
      const buffer = await toVipsBuffer(input);
      const vips = vipsInstance;
      const img = vips.Image.newFromBuffer(buffer);
      const ext = VIPS_FORMAT_MAP[format] || '.png';
      const saveOpts = VIPS_SAVE_OPTIONS[format]?.(quality) || {};
      const outBuffer = img.writeToBuffer(ext, saveOpts);
      img.delete();
      return new Blob([outBuffer], { type: format });
    } catch (err) {
      console.warn('[AcornTools] vips convert failed, falling back to Canvas:', err.message);
    }
  }

  // Pica/Canvas path
  const url = URL.createObjectURL(input instanceof Blob ? input : new Blob([input]));
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Conversion failed')),
        format,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get image dimensions without fully decoding.
 */
export async function getImageDimensions(input) {
  await initEngine();

  if (engineType === 'vips') {
    const buffer = await toVipsBuffer(input);
    const vips = vipsInstance;
    const img = vips.Image.newFromBuffer(buffer, '', { access: 'sequential' });
    const dims = { width: img.width, height: img.height };
    img.delete();
    return dims;
  }

  // Canvas path
  const url = URL.createObjectURL(input instanceof Blob ? input : new Blob([input]));
  try {
    const img = await loadImageElement(url);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Compress an image by adjusting quality and optionally max dimension.
 */
export async function compressImage(input, format = 'image/jpeg', quality = 0.7, maxDimension = null) {
  await initEngine();

  if (engineType === 'vips') {
    try {
      const buffer = await toVipsBuffer(input);
      const vips = vipsInstance;
      let img;

      if (maxDimension) {
        img = vips.Image.thumbnailBuffer(buffer, maxDimension, {
          height: maxDimension,
          size: 'down',
          no_rotate: true,
        });
      } else {
        img = vips.Image.newFromBuffer(buffer);
      }

      const ext = VIPS_FORMAT_MAP[format] || '.jpg';
      const saveOpts = VIPS_SAVE_OPTIONS[format]?.(quality) || {};
      const outBuffer = img.writeToBuffer(ext, saveOpts);
      img.delete();
      return new Blob([outBuffer], { type: format });
    } catch (err) {
      console.warn('[AcornTools] vips compress failed, falling back to Canvas:', err.message);
    }
  }

  // Pica/Canvas path
  const url = URL.createObjectURL(input instanceof Blob ? input : new Blob([input]));
  try {
    const img = await loadImageElement(url);
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (maxDimension && (w > maxDimension || h > maxDimension)) {
      const scale = maxDimension / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        format,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Crop an image to a specific region.
 */
export async function cropImage(input, x, y, width, height, format = 'image/png', quality = 0.92) {
  await initEngine();

  if (engineType === 'vips') {
    try {
      const buffer = await toVipsBuffer(input);
      const vips = vipsInstance;
      const img = vips.Image.newFromBuffer(buffer);
      try {
        const cropped = img.extractArea(x, y, width, height);
        const ext = VIPS_FORMAT_MAP[format] || '.png';
        const saveOpts = VIPS_SAVE_OPTIONS[format]?.(quality) || {};
        const outBuffer = cropped.writeToBuffer(ext, saveOpts);
        cropped.delete();
        img.delete();
        return new Blob([outBuffer], { type: format });
      } catch (err) {
        img.delete();
        throw err;
      }
    } catch (err) {
      console.warn('[AcornTools] vips crop failed, falling back to Canvas:', err.message);
    }
  }

  // Canvas path
  const url = URL.createObjectURL(input instanceof Blob ? input : new Blob([input]));
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, x, y, width, height, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Crop failed')),
        format,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── Internal helpers ──
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Cleanup — call when app unmounts (important for wasm-vips memory)
 */
export function destroyEngine() {
  if (vipsInstance) {
    try { vipsInstance.shutdown?.(); } catch {}
    vipsInstance = null;
  }
  picaInstance = null;
  engineType = null;
  initPromise = null;
}
