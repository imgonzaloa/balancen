/**
 * SafeBootManager: Detects crashes and activates safe mode
 * CRITICAL: Prevents infinite reload loops
 */

const CRASH_THRESHOLD = 2;
const CRASH_WINDOW_MS = 60000; // 60 seconds

export class SafeBootManager {
  static isInSafeMode() {
    return localStorage.getItem('SAFE_MODE') === '1';
  }

  static enterSafeMode(reason) {
    console.warn('[SAFE_MODE] Activated:', reason);
    localStorage.setItem('SAFE_MODE', '1');
    localStorage.setItem('SAFE_MODE_REASON', reason);
    localStorage.setItem('SAFE_MODE_TIME', Date.now().toString());
  }

  static exitSafeMode() {
    localStorage.removeItem('SAFE_MODE');
    localStorage.removeItem('SAFE_MODE_REASON');
    localStorage.removeItem('SAFE_MODE_TIME');
  }

  static recordCrash() {
    const now = Date.now();
    const crashes = this.getCrashes();
    
    // Remove old crashes outside the window
    const recentCrashes = crashes.filter(time => now - time < CRASH_WINDOW_MS);
    recentCrashes.push(now);
    
    localStorage.setItem('CRASH_LOG', JSON.stringify(recentCrashes));
    
    if (recentCrashes.length >= CRASH_THRESHOLD) {
      this.enterSafeMode(`${recentCrashes.length} crashes in ${CRASH_WINDOW_MS / 1000}s`);
    }
    
    return recentCrashes.length;
  }

  static getCrashes() {
    try {
      const crashes = localStorage.getItem('CRASH_LOG');
      return crashes ? JSON.parse(crashes) : [];
    } catch {
      return [];
    }
  }

  static clearCrashLog() {
    localStorage.removeItem('CRASH_LOG');
  }

  static getSafeModeInfo() {
    return {
      active: this.isInSafeMode(),
      reason: localStorage.getItem('SAFE_MODE_REASON'),
      activatedAt: localStorage.getItem('SAFE_MODE_TIME'),
      crashCount: this.getCrashes().length,
    };
  }
}