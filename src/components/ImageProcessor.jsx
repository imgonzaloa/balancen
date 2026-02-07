/**
 * Image processor: HEIC→JPEG + resize + compress
 * Handles file validation, format conversion, and optimization
 */

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

/**
 * Convert HEIC/HEIF to JPEG using canvas
 * Falls back to original if conversion fails
 */
async function heicToJpeg(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    const url = URL.createObjectURL(blob);
    
    const img = new Image();
    img.src = url;
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: file.lastModified,
            }));
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load HEIC image'));
      };
    });
  } catch (err) {
    console.warn('HEIC conversion failed, using original', err);
    return file;
  }
}

/**
 * Resize image to max 1440px on longest side
 */
async function resizeImage(file, maxDimension = 1440) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: file.type === 'image/jpeg' ? 'image/jpeg' : 'image/jpeg',
              lastModified: file.lastModified,
            }));
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image to target size
 */
async function compressImage(file, targetSizeKb = 1500) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let quality = 0.85;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        const tryCompress = () => {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              const sizeKb = blob.size / 1024;
              
              if (sizeKb > targetSizeKb && quality > 0.5) {
                quality -= 0.05;
                tryCompress();
              } else {
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: file.lastModified,
                }));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Main image processor: validate → convert HEIC → resize → compress
 */
export async function processImage(file) {
  if (!file) throw new Error('No file provided');
  
  // Validate type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', ...HEIC_TYPES];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Invalid format: ${file.type}`);
  }
  
  // Validate size (allow up to 20MB input)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('File too large (max 20MB)');
  }
  
  let processed = file;
  
  // Step 1: Convert HEIC to JPEG
  if (HEIC_TYPES.includes(file.type)) {
    console.log('[IMAGE] Converting HEIC to JPEG');
    processed = await heicToJpeg(processed);
  }
  
  // Step 2: Resize
  console.log('[IMAGE] Resizing to 1440px');
  processed = await resizeImage(processed);
  
  // Step 3: Compress
  console.log('[IMAGE] Compressing to <1.5MB');
  processed = await compressImage(processed, 1500);
  
  console.log('[IMAGE] Final size:', (processed.size / 1024).toFixed(1) + 'KB');
  
  return processed;
}

export function getUploadErrorMessage(status, error, lang = 'es') {
  const messages = {
    es: {
      401: 'Sesión vencida. Reingresá.',
      413: 'Archivo muy grande. Lo estamos comprimiendo más...',
      415: 'Formato no soportado. Convertimos HEIC automáticamente.',
      500: 'Error del servidor. Intentá más tarde.',
      offline: 'Sin conexión. Revisá tu internet.',
      default: 'Error subiendo foto. Intentá de nuevo.'
    },
    en: {
      401: 'Session expired. Please login again.',
      413: 'File too large. We\'re compressing it...',
      415: 'Format not supported. We\'ll convert HEIC automatically.',
      500: 'Server error. Try again later.',
      offline: 'No connection. Check your internet.',
      default: 'Error uploading photo. Try again.'
    }
  };

  const msgSet = messages[lang] || messages.es;

  if (status === 401 || status === 403) return msgSet[401];
  if (status === 413) return msgSet[413];
  if (status === 415) return msgSet[415];
  if (status >= 500) return msgSet[500];
  if (!navigator.onLine) return msgSet.offline;
  return error?.message || msgSet.default;
}