/**
 * File utilities — works in both browser and Capacitor
 */

// ── Check if running in Capacitor ──
export function isCapacitor() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}

// ── Download blob (browser) or share (Capacitor) ──
export async function saveFile(blob, filename) {
  if (isCapacitor()) {
    return saveFileCapacitor(blob, filename);
  }
  return saveFileBrowser(blob, filename);
}

function saveFileBrowser(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function saveFileCapacitor(blob, filename) {
  try {
    // Dynamic import — only loads on native platforms
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Convert blob to base64
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Write to cache directory
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    // Share the file (opens native share sheet)
    await Share.share({
      title: filename,
      url: result.uri,
    });
  } catch (err) {
    console.warn('[ZeroUpload] Capacitor save failed, falling back to browser:', err);
    saveFileBrowser(blob, filename);
  }
}

// ── Read file as ArrayBuffer ──
export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Read file as Data URL ──
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Load image element ──
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// ── Human-readable file size ──
export function humanSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ── Get base name without extension ──
export function baseName(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

// ── MIME type to extension ──
export const FORMAT_MAP = {
  'image/png':  { label: 'PNG',  ext: '.png' },
  'image/jpeg': { label: 'JPEG', ext: '.jpg' },
  'image/webp': { label: 'WebP', ext: '.webp' },
  'image/avif': { label: 'AVIF', ext: '.avif' },
};

// ── Size presets ──
export const SIZE_PRESETS = [
  { label: 'Custom',      w: 0,    h: 0 },
  { label: 'Instagram',    w: 1080, h: 1080 },
  { label: 'Twitter/X',    w: 1200, h: 675 },
  { label: 'LinkedIn',     w: 1200, h: 627 },
  { label: 'Passport',     w: 600,  h: 600 },
  { label: 'A4 @150dpi',   w: 1240, h: 1754 },
];
