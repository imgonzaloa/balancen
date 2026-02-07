/**
 * Professional-grade image processor for mobile/web/PWA
 * Handles HEIC conversion, compression, resizing with retry logic
 */

export class ImageProcessor {
  constructor() {
    this.maxDimension = 2048;
    this.targetQuality = 0.82;
    this.maxFileSizeBytes = 1.5 * 1024 * 1024; // 1.5MB hard cap
    this.minQuality = 0.65;
  }

  /**
   * Logs detailed diagnostic info for debugging
   */
  log(stage, data) {
    const platform = this.detectPlatform();
    console.log(`[IMAGE_PROCESSOR:${stage}]`, {
      platform,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Detect platform (iOS, Android, Web)
   */
  detectPlatform() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (window.matchMedia('(display-mode: standalone)').matches) return "PWA";
    return "Web";
  }

  /**
   * Normalize MIME type and handle HEIC
   */
  normalizeMimeType(file) {
    let mime = file.type?.toLowerCase() || '';
    
    // If no mime, infer from extension
    if (!mime) {
      const ext = file.name?.split('.').pop()?.toLowerCase();
      if (ext === 'heic' || ext === 'heif') mime = 'image/heic';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
    }

    // Convert HEIC/HEIF to JPEG (we'll convert the actual image too)
    if (mime === 'image/heic' || mime === 'image/heif') {
      mime = 'image/jpeg';
    }

    this.log('MIME_NORMALIZED', { original: file.type, normalized: mime, fileName: file.name });
    return mime;
  }

  /**
   * Convert HEIC to JPEG (and any other format to JPEG for consistency)
   */
  async convertToJPEG(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = () => {
        this.log('READ_ERROR', { error: reader.error });
        reject(new Error('FILE_READ_ERROR'));
      };

      reader.onload = (e) => {
        const img = new Image();
        
        img.onerror = () => {
          this.log('IMAGE_LOAD_ERROR', { src: 'data URL' });
          reject(new Error('IMAGE_DECODE_ERROR'));
        };

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('CANVAS_CONTEXT_ERROR'));
              return;
            }

            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('BLOB_CREATION_ERROR'));
                  return;
                }
                
                const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                  type: 'image/jpeg'
                });
                
                this.log('HEIC_CONVERTED', { 
                  originalSize: file.size, 
                  convertedSize: convertedFile.size 
                });
                
                resolve(convertedFile);
              },
              'image/jpeg',
              0.95 // High quality for conversion step
            );
          } catch (err) {
            this.log('CONVERSION_ERROR', { error: err.message });
            reject(err);
          }
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Resize and compress image
   */
  async resizeAndCompress(file, quality = this.targetQuality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = () => reject(new Error('FILE_READ_ERROR'));

      reader.onload = (e) => {
        const img = new Image();
        
        img.onerror = () => reject(new Error('IMAGE_DECODE_ERROR'));

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize to max dimension
            if (width > this.maxDimension || height > this.maxDimension) {
              if (width > height) {
                height = Math.round((height / width) * this.maxDimension);
                width = this.maxDimension;
              } else {
                width = Math.round((width / height) * this.maxDimension);
                height = this.maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('CANVAS_CONTEXT_ERROR'));
              return;
            }

            // Use high-quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('BLOB_CREATION_ERROR'));
                  return;
                }
                
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg'
                });
                
                this.log('COMPRESSED', {
                  originalSize: file.size,
                  compressedSize: compressedFile.size,
                  dimensions: `${width}x${height}`,
                  quality,
                  compressionRatio: (compressedFile.size / file.size * 100).toFixed(1) + '%'
                });
                
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          } catch (err) {
            this.log('COMPRESSION_ERROR', { error: err.message });
            reject(err);
          }
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Iteratively compress until under max file size
   */
  async compressUntilTargetSize(file) {
    let currentFile = file;
    let currentQuality = this.targetQuality;
    let attempts = 0;
    const maxAttempts = 5;

    while (currentFile.size > this.maxFileSizeBytes && attempts < maxAttempts) {
      attempts++;
      currentQuality -= 0.08; // Reduce quality by 8% each iteration
      
      if (currentQuality < this.minQuality) {
        this.log('COMPRESSION_LIMIT', { 
          finalSize: currentFile.size,
          message: 'Reached minimum quality threshold'
        });
        break;
      }

      this.log('RECOMPRESSING', { attempt: attempts, quality: currentQuality, currentSize: currentFile.size });
      currentFile = await this.resizeAndCompress(currentFile, currentQuality);
    }

    if (currentFile.size > this.maxFileSizeBytes) {
      this.log('SIZE_EXCEEDED', { finalSize: currentFile.size, maxSize: this.maxFileSizeBytes });
      throw new Error('FILE_TOO_LARGE');
    }

    return currentFile;
  }

  /**
   * Main processing pipeline
   */
  async processImage(file) {
    this.log('START', {
      fileName: file.name,
      originalSize: file.size,
      originalType: file.type,
      platform: this.detectPlatform()
    });

    try {
      // Step 1: Normalize MIME
      const normalizedMime = this.normalizeMimeType(file);
      
      // Step 2: Convert HEIC/HEIF to JPEG if needed
      let processedFile = file;
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name?.toLowerCase().match(/\.(heic|heif)$/)) {
        this.log('CONVERTING_HEIC', { fileName: file.name });
        processedFile = await this.convertToJPEG(file);
      }

      // Step 3: Resize and compress
      processedFile = await this.resizeAndCompress(processedFile);

      // Step 4: Ensure under max file size
      if (processedFile.size > this.maxFileSizeBytes) {
        this.log('EXCEEDS_TARGET', { size: processedFile.size, target: this.maxFileSizeBytes });
        processedFile = await this.compressUntilTargetSize(processedFile);
      }

      this.log('SUCCESS', {
        finalSize: processedFile.size,
        finalType: processedFile.type,
        reduction: ((1 - processedFile.size / file.size) * 100).toFixed(1) + '%'
      });

      return processedFile;
    } catch (error) {
      this.log('ERROR', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

/**
 * Error mapper for user-friendly messages
 */
export function getUploadErrorMessage(error, lang = 'en') {
  const errorMap = {
    en: {
      FILE_READ_ERROR: "Couldn't read the image. Try another one.",
      IMAGE_DECODE_ERROR: "Image format not supported. Try a different photo.",
      CANVAS_CONTEXT_ERROR: "Browser error. Try refreshing the page.",
      BLOB_CREATION_ERROR: "Processing failed. Please try again.",
      FILE_TOO_LARGE: "Photo is too large. Try a different one.",
      HEIC_CONVERSION_ERROR: "Couldn't convert HEIC image. Try a JPEG or PNG.",
      UPLOAD_FAILED: "Upload failed. Check your connection and try again.",
      NETWORK_ERROR: "Network error. Check your internet and retry.",
      TIMEOUT_ERROR: "Upload timed out. Try again with better connection.",
      UNKNOWN_ERROR: "Something went wrong. Please try again."
    },
    es: {
      FILE_READ_ERROR: "No pudimos leer la imagen. Probá con otra.",
      IMAGE_DECODE_ERROR: "Formato no soportado. Probá con otra foto.",
      CANVAS_CONTEXT_ERROR: "Error del navegador. Refrescá la página.",
      BLOB_CREATION_ERROR: "Procesamiento fallido. Intentá de nuevo.",
      FILE_TOO_LARGE: "La foto es muy grande. Probá con otra.",
      HEIC_CONVERSION_ERROR: "No pudimos convertir la imagen HEIC. Probá con JPEG o PNG.",
      UPLOAD_FAILED: "Falló la subida. Revisá tu conexión e intentá de nuevo.",
      NETWORK_ERROR: "Error de red. Revisá tu internet e intentá de nuevo.",
      TIMEOUT_ERROR: "Tiempo agotado. Intentá con mejor conexión.",
      UNKNOWN_ERROR: "Algo salió mal. Por favor intentá de nuevo."
    }
  };

  const errorCode = error.message || 'UNKNOWN_ERROR';
  return errorMap[lang][errorCode] || errorMap[lang].UNKNOWN_ERROR;
}