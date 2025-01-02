import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useSignerStore = create<SignerState>()(
  persist(
    set => ({
      signer: null,
      setSigner: data => set({ signer: data }),
      clearSigner: () => set({ signer: null }),
    }),
    {
      name: 'signer-storage',
    },
  ),
);
