import { createStore } from './createStore';
import { KeyPair, KeyMetadata } from '../crypto/interfaces/types';

interface KeyState {
  activeKeyId: string | null;
  keys: Record<
    string,
    {
      metadata: KeyMetadata;
      keyPair: KeyPair;
    }
  >;
  // Actions
  saveKeyPair: (keyPair: KeyPair, metadata: KeyMetadata) => void;
  getKeyPair: (
    id: string,
  ) => { metadata: KeyMetadata; keyPair: KeyPair } | null;
  setActiveKey: (id: string) => void;
  deleteKeyPair: (id: string) => void;
  clearKeys: () => void;
}

export const useKeyStore = createStore<KeyState>(
  (set, get) => ({
    activeKeyId: null,
    keys: {},

    saveKeyPair: (keyPair, metadata) =>
      set((state) => ({
        keys: {
          ...state.keys,
          [metadata.id]: { keyPair, metadata },
        },
      })),

    getKeyPair: (id) => {
      const state = get();
      return state.keys[id] || null;
    },

    setActiveKey: (id) =>
      set((state) => ({
        activeKeyId: state.keys[id] ? id : state.activeKeyId,
      })),

    deleteKeyPair: (id) =>
      set((state) => {
        const { [id]: _, ...remainingKeys } = state.keys;
        return {
          keys: remainingKeys,
          activeKeyId: state.activeKeyId === id ? null : state.activeKeyId,
        };
      }),

    clearKeys: () => set({ keys: {}, activeKeyId: null }),
  }),
  {
    name: 'key-storage',
  }
);
