/**
 * Robust uploader with retry logic and error handling
 */

import { logger } from '@/components/logger';

export async function uploadAvatar(file, onProgress) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log('AVATAR_UPLOAD_START', { attempt, sizeKb: file.size / 1024 });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // Track progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress?.(percentComplete);
          logger.log('AVATAR_UPLOAD_PROGRESS', { percent: percentComplete });
        }
      });
      
      return await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              logger.log('AVATAR_UPLOAD_SUCCESS', { status: xhr.status, url: response.avatar_url });
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            const errorMsg = xhr.responseText ? ` ${xhr.responseText}` : '';
            reject(new Error(`Upload failed: ${xhr.status}${errorMsg}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
        
        // Set timeout: 30s
        const timeout = setTimeout(() => {
          xhr.abort();
          reject(new Error('Upload timeout'));
        }, 30000);
        
        xhr.upload.addEventListener('loadend', () => clearTimeout(timeout));
        
        xhr.open('POST', '/api/profile/avatar', true);
        xhr.send(formData);
      });
      
    } catch (error) {
      lastError = error;
      logger.error(`AVATAR_UPLOAD_ATTEMPT_${attempt}`, error);
      
      // Exponential backoff: 500ms, 1s, 2s
      const delayMs = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      
      if (attempt < maxRetries) {
        console.log(`[UPLOAD] Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  logger.error('AVATAR_UPLOAD_FAILED', lastError);
  throw lastError;
}