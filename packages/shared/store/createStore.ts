import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// This will be overridden by the mobile app
let persistStorage: PersistOptions<any>['storage'] = undefined;

export const setPersistStorage = (storage: PersistOptions<any>['storage']) => {
  persistStorage = storage;
};

export function createStore<T extends object>(
  initializer: StateCreator<T>,
  persistOptions: Omit<PersistOptions<T>, 'storage'>,
) {
  return create<T>()(
    persist(initializer, {
      ...persistOptions,
      storage: persistStorage,
    }),
  );
}
