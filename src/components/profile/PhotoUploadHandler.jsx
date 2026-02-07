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

// Main upload handler
export async function uploadProfilePhoto(file, onProgress) {
  logger.log('PHOTO_UPLOAD_START', { fileName: file.name, fileSize: file.size });

  try {
    // Step 1: Convert HEIC if needed
    let processed = await convertHEICToJPEG(file);
    logger.log('PHOTO_CONVERSION_DONE', { newSize: processed.size });

    // Step 2: Resize
    processed = await resizeImage(processed, 1536);
    logger.log('PHOTO_RESIZE_DONE', { newSize: processed.size });

    // Step 3: Compress
    processed = await compressImage(processed, 350);
    logger.log('PHOTO_COMPRESS_DONE', { newSize: processed.size });

    // Step 4: Upload via function
    const formData = new FormData();
    formData.append('file', processed);

    const response = await base44.functions.invoke('uploadProfilePhoto', {}, {
      data: formData,
      headers: {
        'X-File-Name': processed.name,
        'X-File-Size': processed.size.toString()
      }
    });

    if (response.data?.success && response.data?.file_url) {
      logger.log('PHOTO_UPLOAD_SUCCESS', { url: response.data.file_url });
      return {
        success: true,
        fileUrl: response.data.file_url
      };
    } else {
      throw new Error(response.data?.error || 'Upload failed');
    }
  } catch (error) {
    logger.error('PHOTO_UPLOAD_ERROR', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}