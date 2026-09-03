import { createStorage, StorageEnum } from '../base/index.js';

// One-time data-use notice for the extension. Mirrors the dashboard's
// first-use consent and the (future) Android app's — the extension keeps its
// own local record since it can run before the dashboard has ever been opened.
export const CONSENT_VERSION = '2026-09-03';

interface ConsentState {
  acceptedVersion: string | null;
  acceptedAt: number | null;
}

const storage = createStorage<ConsentState>(
  'weft-consent-storage',
  { acceptedVersion: null, acceptedAt: null },
  { storageEnum: StorageEnum.Local, liveUpdate: true },
);

export const consentStorage = {
  ...storage,
  accept: async () => {
    await storage.set(() => ({ acceptedVersion: CONSENT_VERSION, acceptedAt: Date.now() }));
  },
  isAccepted: async () => {
    const s = await storage.get();
    return s.acceptedVersion === CONSENT_VERSION;
  },
};
