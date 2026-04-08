import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// Log configuration for debugging
console.debug('Base44 Client Config:', {
  appId: appParams.appId ? 'set' : 'missing',
  appBaseUrl: appParams.appBaseUrl ? 'set' : 'missing',
  token: appParams.token ? 'set' : 'missing'
});

export const base44 = createClient({
  appId: appParams.appId,
  token: appParams.token,
  functionsVersion: appParams.functionsVersion,
  requiresAuth: false,
  appBaseUrl: appParams.appBaseUrl
});