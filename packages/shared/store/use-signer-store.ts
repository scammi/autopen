import { createStore } from './create-store';

interface SignerState {
  signer: {
    nombre: string;
    apellido: string;
    dni: string;
    compania: string;
  } | null;
  setSigner: (data: SignerState['signer']) => void;
  clearSigner: () => void;
}

export const useSignerStore = createStore<SignerState>(
  set => ({
    signer: null,
    setSigner: data => set({ signer: data }),
    clearSigner: () => set({ signer: null }),
  }),
  {
    name: 'signer-storage',
  },
);
