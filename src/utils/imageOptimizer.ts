/**
 * Client-Side Image Compression & Downsampling Utility
 * Resizes images to max 1024px width/height preserving aspect ratio
 * and encodes to optimized JPEG (quality 0.85) to achieve sub-2-second transmission & vision processing.
 */
export async function optimizeChartImage(
  dataUrlOrFile: string | File,
  maxDimension = 1024,
  quality = 0.85
): Promise<{ optimizedDataUrl: string; mimeType: string; originalSizeKb: number; optimizedSizeKb: number }> {
  return new Promise((resolve, reject) => {
    let sourceDataUrl = '';

    const processImageSource = (src: string, originalBytes: number) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Draw onto high-performance offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          return resolve({
            optimizedDataUrl: src,
            mimeType: 'image/jpeg',
            originalSizeKb: Math.round(originalBytes / 1024),
            optimizedSizeKb: Math.round(originalBytes / 1024),
          });
        }

        // Clean dark fill for charts
        ctx.fillStyle = '#070a11';
        ctx.fillRect(0, 0, width, height);

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const optimizedBytes = Math.round((optimizedDataUrl.length * 3) / 4);

        resolve({
          optimizedDataUrl,
          mimeType: 'image/jpeg',
          originalSizeKb: Math.round(originalBytes / 1024),
          optimizedSizeKb: Math.round(optimizedBytes / 1024),
        });
      };

      img.onerror = () => {
        // Fallback to original if decoding fails
        resolve({
          optimizedDataUrl: src,
          mimeType: 'image/jpeg',
          originalSizeKb: Math.round(originalBytes / 1024),
          optimizedSizeKb: Math.round(originalBytes / 1024),
        });
      };

      img.src = src;
    };

    if (dataUrlOrFile instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        processImageSource(result, dataUrlOrFile.size);
      };
      reader.onerror = reject;
      reader.readAsDataURL(dataUrlOrFile);
    } else {
      const estimatedBytes = Math.round((dataUrlOrFile.length * 3) / 4);
      processImageSource(dataUrlOrFile, estimatedBytes);
    }
  });
}
