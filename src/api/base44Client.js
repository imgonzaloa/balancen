import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

let base44Instance;

function getBase44Client() {
  if (!base44Instance) {
    const { appId, token, functionsVersion, appBaseUrl } = appParams;
    base44Instance = createClient({
      appId,
      token,
      functionsVersion,
      requiresAuth: false,
      appBaseUrl
    });
  }
  return base44Instance;
}

export const base44 = new Proxy({}, {
  get: (target, prop) => {
    const client = getBase44Client();
    return client[prop];
  }
});