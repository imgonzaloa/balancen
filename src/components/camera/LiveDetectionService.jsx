/**
 * Live Detection Service
 * Implements stable food recognition with quality gating
 */

export class LiveDetectionService {
  constructor() {
    this.predictionWindow = [];
    this.windowSize = 8; // Smaller window for faster switching
    this.minConfidence = 0.65;
    this.stabilityThreshold = 0.5; // 50% agreement for faster response
    this.lockConfidence = 0.85;
    this.consecutiveCount = 0; // Track consecutive detections
    this.lastStableLabel = null;
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
   * Creates realistic detection behavior with gradual confidence building
   */
  async detectFood(canvas) {
    // Simulate AI detection with realistic food categories
    const foodCategories = [
      { key: "COOKIE", confidence: 0.70 + Math.random() * 0.25 },
      { key: "SALAD", confidence: 0.65 + Math.random() * 0.25 },
      { key: "PIZZA", confidence: 0.68 + Math.random() * 0.27 },
      { key: "BURGER", confidence: 0.62 + Math.random() * 0.3 },
      { key: "APPLE", confidence: 0.75 + Math.random() * 0.2 },
    ];

    // Pick based on timestamp but allow gradual transitions
    const index = Math.floor(Date.now() / 3000) % foodCategories.length;
    return foodCategories[index];
  }

  /**
   * Add prediction to window and compute stable result
   * Implements dynamic switching when camera moves to new food
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

    // DYNAMIC SWITCHING: If new food detected with confidence, switch immediately
    if (this.lastStableLabel && maxKey !== this.lastStableLabel && avgConfidence >= 0.70 && stability >= 0.4) {
      console.log("[DETECTION] SWITCHING from", this.lastStableLabel, "to", maxKey);
      this.lockedLabel = null;
      this.lastStableLabel = null;
      this.predictionWindow = [prediction]; // Reset window for new food
      this.consecutiveCount = 1;
    }
    
    // Track consecutive stable detections
    if (maxKey === this.lastStableLabel) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = 1;
      this.lastStableLabel = maxKey;
    }

    console.log("[DETECTION] Consecutive:", this.consecutiveCount, "Stability:", stability.toFixed(2), "Confidence:", avgConfidence.toFixed(2), "Key:", maxKey);

    // Require 3 consecutive stable frames before locking (as per requirements)
    if (avgConfidence >= this.lockConfidence && stability >= this.stabilityThreshold && this.consecutiveCount >= 3) {
      if (!this.lockedLabel) {
        this.lockedLabel = { key: maxKey, confidence: avgConfidence };
        console.log("[DETECTION] LOCKED after", this.consecutiveCount, "consistent frames:", maxKey);
      }
      return { state: "LOCKED", label: maxKey, confidence: avgConfidence, calories: this.getCalorieEstimate(maxKey) };
    }

    // Show stable detection even with lower threshold for continuous updates
    if (stability >= this.stabilityThreshold && avgConfidence >= this.minConfidence) {
      this.currentLabel = { key: maxKey, confidence: avgConfidence };
      return { state: "STABLE", label: maxKey, confidence: avgConfidence, calories: this.getCalorieEstimate(maxKey) };
    }

    // Not stable - scanning
    return { state: "SCANNING", label: null, confidence: 0, calories: null };
  }

  /**
   * Get calorie estimate range for food
   */
  getCalorieEstimate(foodKey) {
    const estimates = {
      COOKIE: { min: 150, max: 200 },
      SALAD: { min: 100, max: 250 },
      PIZZA: { min: 250, max: 350 },
      BURGER: { min: 450, max: 650 },
      APPLE: { min: 80, max: 100 },
      SANDWICH: { min: 300, max: 450 },
      PASTA: { min: 350, max: 500 },
    };
    return estimates[foodKey] || { min: 100, max: 300 };
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