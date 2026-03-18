/**
 * SSIM (Structural Similarity Index) for perceptual image quality comparison.
 * Operates on grayscale thumbnails for speed.
 */

/**
 * Convert RGB/RGBA/Gray pixels to grayscale.
 * Auto-detects channel count from array length.
 * Y = 0.299R + 0.587G + 0.114B
 */
export function rgbToGrayscale(pixels, width, height) {
  const n = width * height;
  const gray = new Uint8Array(n);
  const channels = Math.round(pixels.length / n);

  if (channels === 1) {
    gray.set(pixels.subarray(0, n));
    return gray;
  }

  for (let i = 0; i < n; i++) {
    const off = i * channels;
    gray[i] = (0.299 * pixels[off] + 0.587 * pixels[off + 1] + 0.114 * pixels[off + 2] + 0.5) | 0;
  }
  return gray;
}

/**
 * Box-average downsample grayscale buffer to fit within maxDim x maxDim.
 * Returns { data, width, height }.
 */
export function downsampleGray(gray, srcW, srcH, maxDim) {
  if (srcW <= maxDim && srcH <= maxDim) {
    return { data: gray, width: srcW, height: srcH };
  }

  const scale = maxDim / Math.max(srcW, srcH);
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));
  const out = new Uint8Array(dstW * dstH);

  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = Math.floor(dy * yRatio);
    const sy1 = Math.min(Math.ceil((dy + 1) * yRatio), srcH);
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * xRatio);
      const sx1 = Math.min(Math.ceil((dx + 1) * xRatio), srcW);
      let sum = 0, count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          sum += gray[sy * srcW + sx];
          count++;
        }
      }
      out[dy * dstW + dx] = (sum / count + 0.5) | 0;
    }
  }

  return { data: out, width: dstW, height: dstH };
}

/**
 * Compute mean SSIM between two grayscale images using 8x8 non-overlapping windows.
 * Both images must have the same dimensions. Returns 0.0-1.0.
 */
export function computeSSIM(imgA, imgB, width, height) {
  const C1 = 6.5025;   // (0.01 * 255)^2
  const C2 = 58.5225;  // (0.03 * 255)^2
  const BLOCK = 8;

  const blocksX = (width / BLOCK) | 0;
  const blocksY = (height / BLOCK) | 0;
  if (blocksX === 0 || blocksY === 0) return 1.0;

  let totalSSIM = 0;
  const n = BLOCK * BLOCK;

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0, sumAB = 0;

      for (let y = 0; y < BLOCK; y++) {
        const row = (by * BLOCK + y) * width + bx * BLOCK;
        for (let x = 0; x < BLOCK; x++) {
          const a = imgA[row + x];
          const b = imgB[row + x];
          sumA += a;
          sumB += b;
          sumA2 += a * a;
          sumB2 += b * b;
          sumAB += a * b;
        }
      }

      const mA = sumA / n;
      const mB = sumB / n;
      const vA = sumA2 / n - mA * mA;
      const vB = sumB2 / n - mB * mB;
      const cov = sumAB / n - mA * mB;

      totalSSIM += ((2 * mA * mB + C1) * (2 * cov + C2)) /
                   ((mA * mA + mB * mB + C1) * (vA + vB + C2));
    }
  }

  return totalSSIM / (blocksX * blocksY);
}
