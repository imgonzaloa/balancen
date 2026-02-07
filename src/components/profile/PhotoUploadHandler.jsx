import { base44 } from '@/api/base44Client';
import { logger } from '@/components/logger';

// HEIC to JPEG conversion
async function convertHEICToJPEG(file) {
  if (!file.type.toLowerCase().includes('heic') && !file.type.toLowerCase().includes('heif')) {
    return file;
  }

  try {
    const canvas = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const jpegFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg'
          });
          resolve(jpegFile);
        },
        'image/jpeg',
        0.85
      );
    });
  } catch (error) {
    logger.error('HEIC_CONVERSION_FAILED', error);
    return file; // Fallback to original
  }
}

// Resize image
async function resizeImage(file, maxSize = 1536) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(resizedFile);
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Compress image to target size
async function compressImage(file, targetSizeKB = 300) {
  return new Promise((resolve) => {
    let quality = 0.85;
    const maxAttempts = 5;
    let attempts = 0;

    const compress = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              const sizeKB = blob.size / 1024;
              
              if (sizeKB > targetSizeKB && quality > 0.3 && attempts < maxAttempts) {
                quality -= 0.15;
                attempts++;
                // Recursively compress
                setTimeout(compress, 0);
              } else {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg'
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    compress();
  });
}

// Main upload handler with retry logic
export async function uploadProfilePhoto(file, onProgress) {
  const MAX_FILE_SIZE_MB = 15;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      success: false,
      error: `File too large. Max ${MAX_FILE_SIZE_MB}MB`
    };
  }

  logger.log('PHOTO_UPLOAD_START', { fileName: file.name, fileSize: file.size });

  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Step 1: Convert HEIC if needed
      let processed = await convertHEICToJPEG(file);
      logger.log('PHOTO_CONVERSION_DONE', { newSize: processed.size, attempt });

      // Step 2: Resize
      processed = await resizeImage(processed, 1024);
      logger.log('PHOTO_RESIZE_DONE', { newSize: processed.size });

      // Step 3: Compress
      processed = await compressImage(processed, 250);
      logger.log('PHOTO_COMPRESS_DONE', { newSize: processed.size });

      // Step 4: Upload via integration directly (no custom function)
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: processed
      });

      if (uploadResult?.file_url) {
        logger.log('PHOTO_UPLOAD_SUCCESS', { url: uploadResult.file_url });
        return {
          success: true,
          fileUrl: uploadResult.file_url
        };
      } else {
        throw new Error('No file URL returned');
      }
    } catch (error) {
      lastError = error;
      logger.error(`PHOTO_UPLOAD_ERROR_ATTEMPT_${attempt}`, {
        message: error.message,
        attempt
      });

      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 500 * attempt)
        );
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Upload failed after retries'
  };
}