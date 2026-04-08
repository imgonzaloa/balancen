import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

let base44Instance = null;

function initializeBase44() {
  if (base44Instance) return base44Instance;

  const config = {
    appId: appParams.appId,
    token: appParams.token,
    functionsVersion: appParams.functionsVersion,
    requiresAuth: false,
    appBaseUrl: appParams.appBaseUrl
  };

  if (!config.appId) {
    console.error('Base44 initialization failed: appId is missing', { config });
    throw new Error('Base44 appId is required but not configured');
  }

  base44Instance = createClient(config);
  return base44Instance;
}

// Export a getter that initializes on first access
export const base44 = new Proxy({}, {
  get: (target, prop) => {
    const client = initializeBase44();
    return client[prop];
  }
});