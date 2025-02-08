import {
  IKeyMetadata,
  IKeyPair,
} from '../crypto/interfaces/crypto-provider.interface';
import { createStore } from './create-store';

interface IKeyState {
  key: {
    metadata: IKeyMetadata;
    keyPair: IKeyPair;
  } | null;

  // Actions
  saveKey: (keyPair: IKeyPair, metadata: IKeyMetadata) => void;
  getKey: () => { metadata: IKeyMetadata; keyPair: IKeyPair } | null;
  clearKey: () => void;
}

export const useKeyStore = createStore<IKeyState>(
  (set, get) => ({
    key: null,

    saveKey: (keyPair, metadata) =>
      set(() => ({
        key: { keyPair, metadata },
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
