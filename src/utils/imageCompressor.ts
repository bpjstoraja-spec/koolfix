/**
 * Image compression utility to ensure photos stay well within Firestore document limits (<1MB total per doc).
 * At 720px max dimension and 0.65 quality, photos are crisp and clear (~25KB-45KB each).
 */
export async function compressImage(
  source: File | string,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If source is already a remote URL (non-base64), we can return as is
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://')) && !source.startsWith('data:')) {
      return resolve(source);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      // Draw background in case of transparent png
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      console.warn('Image compression fallback:', err);
      if (typeof source === 'string') {
        resolve(source);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(source);
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    }
  });
}

export async function compressImageList(images: string[]): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const results = await Promise.all(
    images.map(img => compressImage(img, 720, 720, 0.65))
  );
  return results.filter(Boolean);
}

