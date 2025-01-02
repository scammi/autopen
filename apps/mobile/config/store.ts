import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistStorage } from 'zustand/middleware';
import { useSignerStore } from '@autopen/shared/store/useSignerStore';

// Generic storage factory that works with any Zustand store
export function createPersistStorage<T>(): PersistStorage<T> {
  return {
    getItem: async name => {
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: async (name, value) => {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async name => {
      await AsyncStorage.removeItem(name);
    },
  };
}

useSignerStore.persist.setOptions({
  storage: createPersistStorage(),
});

// Example of how to use with future stores:
/*
import { useDocumentStore } from '@autopen/shared/store/useDocumentStore';

useDocumentStore.persist.setOptions({
  storage: createPersistStorage(),
});
*/
