import { createStore } from './createStore';
import { KeyPair, KeyMetadata } from '../crypto/interfaces/types';

interface KeyState {
  key: {
    metadata: KeyMetadata;
    keyPair: KeyPair;
  } | null;

  // Actions
  saveKey: (keyPair: KeyPair, metadata: KeyMetadata) => void;
  getKey: () => { metadata: KeyMetadata; keyPair: KeyPair } | null;
  clearKey: () => void;
}

export const useKeyStore = createStore<KeyState>(
  (set, get) => ({
    key: null,

    saveKey: (keyPair, metadata) =>
      set(() => ({
        key: { keyPair, metadata }
      })),

    getKey: () => {
      const state = get();
      return state.key;
    },

    clearKey: () => set({ key: null }),
  }),
  {
    name: 'key-storage',
  }
);
