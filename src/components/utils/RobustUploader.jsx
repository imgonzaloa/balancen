/**
 * Robust uploader with retry logic, timeout, and CORS handling
 */

export class RobustUploader {
  constructor() {
    this.timeout = 30000; // 30s
    this.maxRetries = 2;
    this.retryDelay = 800; // ms
  }

  log(stage, data) {
    console.log(`[ROBUST_UPLOADER:${stage}]`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Wait for exponential backoff
   */
  async wait(attempt) {
    const delay = this.retryDelay * Math.pow(2, attempt);
    this.log('RETRY_WAIT', { attempt, delayMs: delay });
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Upload with timeout
   */
  async uploadWithTimeout(uploadFn) {
    return Promise.race([
      uploadFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_ERROR')), this.timeout)
      )
    ]);
  }

  /**
   * Upload file to Base44 storage
   */
  async upload(base44, file, onProgress) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.wait(attempt - 1);
        }

        this.log('ATTEMPT', { 
          attempt: attempt + 1, 
          maxRetries: this.maxRetries + 1,
          fileSize: file.size,
          fileName: file.name
        });

        // Call upload with timeout
        const result = await this.uploadWithTimeout(async () => {
          const { data } = await base44.integrations.Core.UploadFile({ file });
          return data;
        });

        this.log('SUCCESS', { 
          attempt: attempt + 1,
          fileUrl: result.file_url 
        });

        return result;

      } catch (error) {
        lastError = error;
        
        this.log('ATTEMPT_FAILED', {
          attempt: attempt + 1,
          error: error.message,
          willRetry: attempt < this.maxRetries
        });

        // Don't retry on certain errors
        if (error.message === 'FILE_TOO_LARGE' || 
            error.message === 'UNSUPPORTED_FORMAT') {
          throw error;
        }
      }
    }

    // All retries exhausted
    this.log('ALL_RETRIES_FAILED', { 
      totalAttempts: this.maxRetries + 1,
      lastError: lastError?.message 
    });
    
    throw lastError || new Error('UPLOAD_FAILED');
  }
}