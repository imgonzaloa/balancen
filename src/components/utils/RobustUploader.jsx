/**
 * Robust uploader with retry logic and error handling
 * Uses FormData + XMLHttpRequest for reliable multipart uploads
 */

import { logger } from '@/components/logger';

export async function uploadAvatar(file, onProgress) {
  const maxRetries = 3;
  let lastError;
  const endpoint = '/api/profile/avatar';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log('AVATAR_UPLOAD_START', { 
        attempt, 
        sizeKb: (file.size / 1024).toFixed(1),
        endpoint,
        method: 'POST'
      });
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('[UPLOAD] Request details:', {
        method: 'POST',
        endpoint,
        contentType: 'multipart/form-data (automatic)',
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
      });
      
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress?.(percentComplete);
            console.log('[UPLOAD] Progress:', percentComplete.toFixed(1) + '%');
          }
        });
        
        // Success
        xhr.addEventListener('load', () => {
          console.log('[UPLOAD] Response:', {
            status: xhr.status,
            statusText: xhr.statusText,
            bodyLength: xhr.responseText?.length
          });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('[UPLOAD] Success, avatar_url:', response.avatar_url);
              logger.log('AVATAR_UPLOAD_SUCCESS', { 
                status: xhr.status, 
                url: response.avatar_url,
                attempt 
              });
              resolve(response);
            } catch (e) {
              console.error('[UPLOAD] Invalid JSON response:', xhr.responseText);
              reject(new Error('Invalid response format'));
            }
          } else {
            // HTTP error (4xx, 5xx)
            const errorMsg = xhr.responseText || xhr.statusText;
            console.error('[UPLOAD] HTTP error:', {
              status: xhr.status,
              statusText: xhr.statusText,
              body: errorMsg,
              method: 'POST'
            });
            reject(new Error(`HTTP ${xhr.status}: ${errorMsg}`));
          }
        });
        
        // Network error
        xhr.addEventListener('error', () => {
          console.error('[UPLOAD] Network error');
          reject(new Error('Network error - no response from server'));
        });
        
        // Abort
        xhr.addEventListener('abort', () => {
          console.warn('[UPLOAD] Aborted');
          reject(new Error('Upload cancelled'));
        });
        
        // Timeout (30s)
        const timeoutHandle = setTimeout(() => {
          console.error('[UPLOAD] Timeout after 30s');
          xhr.abort();
          reject(new Error('Upload timeout (30s)'));
        }, 30000);
        
        xhr.upload.addEventListener('loadend', () => clearTimeout(timeoutHandle));
        
        // Open connection: POST method explicit
        xhr.open('POST', endpoint, true);
        
        // Send FormData (browser auto-sets Content-Type: multipart/form-data)
        console.log('[UPLOAD] Sending FormData to ' + endpoint);
        xhr.send(formData);
      });
      
    } catch (error) {
      lastError = error;
      console.error('[UPLOAD] Attempt ' + attempt + ' failed:', error.message);
      logger.error(`AVATAR_UPLOAD_ATTEMPT_${attempt}`, error);
      
      // Don't retry on specific errors
      if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
        logger.error('AVATAR_UPLOAD_AUTH_ERROR', error);
        throw error; // Don't retry auth errors
      }
      
      // Exponential backoff: 500ms, 1s, 2s
      const delayMs = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      
      if (attempt < maxRetries) {
        console.log(`[UPLOAD] Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error('[UPLOAD] All ' + maxRetries + ' attempts failed:', lastError.message);
  logger.error('AVATAR_UPLOAD_FAILED_ALL', lastError);
  throw lastError;
}