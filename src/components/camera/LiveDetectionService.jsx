/**
 * Live Detection Service
 * Implements stable food recognition with quality gating
 */

export class LiveDetectionService {
  constructor() {
    this.predictionWindow = [];
    this.windowSize = 10; // Last 10 predictions
    this.minConfidence = 0.70;
    this.stabilityThreshold = 0.6; // 60% of frames must agree
    this.lockConfidence = 0.85;
    this.currentLabel = null;
    this.lockedLabel = null;
    this.lockTimer = null;
  }

  /**
   * Check frame quality
   * Returns { ok: boolean, issue: string|null }
   */
  checkFrameQuality(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, issue: "CENTER_FOOD" };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple brightness check
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;

    // Check if too dark or too bright
    if (avgBrightness < 40) {
      return { ok: false, issue: "BETTER_LIGHTING" };
    }
    if (avgBrightness > 240) {
      return { ok: false, issue: "TOO_BRIGHT" };
    }

    // Basic center detection (check if center is darker than edges - food presence)
    const centerSize = Math.floor(canvas.width / 3);
    const centerX = Math.floor((canvas.width - centerSize) / 2);
    const centerY = Math.floor((canvas.height - centerSize) / 2);
    
    const centerData = ctx.getImageData(centerX, centerY, centerSize, centerSize);
    let centerBrightness = 0;
    for (let i = 0; i < centerData.data.length; i += 4) {
      centerBrightness += (centerData.data[i] + centerData.data[i + 1] + centerData.data[i + 2]) / 3;
    }
    centerBrightness /= (centerSize * centerSize);

    // If center is too similar to average, might not be centered
    if (Math.abs(centerBrightness - avgBrightness) < 15) {
      return { ok: false, issue: "CENTER_FOOD" };
    }

    return { ok: true, issue: null };
  }

  /**
   * Simulate detection (replace with real AI call)
   */
  async detectFood(canvas) {
    // Simulate AI detection with realistic food categories
    const foodCategories = [
      { key: "COOKIE", confidence: 0.75 + Math.random() * 0.2 },
      { key: "SALAD", confidence: 0.70 + Math.random() * 0.15 },
      { key: "PIZZA", confidence: 0.65 + Math.random() * 0.25 },
      { key: "BURGER", confidence: 0.60 + Math.random() * 0.3 },
      { key: "APPLE", confidence: 0.80 + Math.random() * 0.15 },
    ];

    // Pick one based on timestamp to create some persistence
    const index = Math.floor(Date.now() / 2000) % foodCategories.length;
    return foodCategories[index];
  }

  /**
   * Add prediction to window and compute stable result
   */
  addPrediction(prediction) {
    this.predictionWindow.push(prediction);
    
    // Keep window size limited
    if (this.predictionWindow.length > this.windowSize) {
      this.predictionWindow.shift();
    }

    // Count occurrences
    const counts = {};
    let maxCount = 0;
    let maxKey = null;

    this.predictionWindow.forEach(p => {
      counts[p.key] = (counts[p.key] || 0) + 1;
      if (counts[p.key] > maxCount) {
        maxCount = counts[p.key];
        maxKey = p.key;
      }
    });

    const stability = maxCount / this.predictionWindow.length;

    // Compute average confidence for the top key
    const topPredictions = this.predictionWindow.filter(p => p.key === maxKey);
    const avgConfidence = topPredictions.reduce((sum, p) => sum + p.confidence, 0) / topPredictions.length;

    console.log("[DETECTION] Stability:", stability.toFixed(2), "Confidence:", avgConfidence.toFixed(2), "Key:", maxKey);

    // Check if we should lock
    if (avgConfidence >= this.lockConfidence && stability >= this.stabilityThreshold) {
      if (!this.lockedLabel) {
        this.lockedLabel = { key: maxKey, confidence: avgConfidence };
        console.log("[DETECTION] LOCKED:", maxKey);
      }
      return { state: "LOCKED", label: maxKey, confidence: avgConfidence };
    }

    // Check if stable enough to show
    if (stability >= this.stabilityThreshold && avgConfidence >= this.minConfidence) {
      this.currentLabel = { key: maxKey, confidence: avgConfidence };
      return { state: "STABLE", label: maxKey, confidence: avgConfidence };
    }

    // Not stable - scanning
    return { state: "SCANNING", label: null, confidence: 0 };
  }

  /**
   * Process frame and return detection state
   */
  async processFrame(canvas) {
    // Check quality first
    const quality = this.checkFrameQuality(canvas);
    
    if (!quality.ok) {
      // Poor quality - show guidance
      this.predictionWindow = []; // Reset window
      return {
        state: "GUIDANCE",
        guidance: quality.issue,
        label: null,
        confidence: 0
      };
    }

    // If locked, return locked state
    if (this.lockedLabel) {
      return {
        state: "LOCKED",
        label: this.lockedLabel.key,
        confidence: this.lockedLabel.confidence
      };
    }

    // Run detection
    const prediction = await this.detectFood(canvas);
    
    // Add to stability window
    return this.addPrediction(prediction);
  }

  /**
   * Reset detection state
   */
  reset() {
    this.predictionWindow = [];
    this.currentLabel = null;
    this.lockedLabel = null;
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
    console.log("[DETECTION] Reset");
  }
}