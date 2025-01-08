import AsyncStorage from '@react-native-async-storage/async-storage';
import { setPersistStorage } from '@autopen/shared/store/create-store';

export function createPersistStorage() {
  return {
    getItem: async (name: string) => {
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: async (name: string, value: any) => {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async (name: string) => {
      await AsyncStorage.removeItem(name);
    },
  };
}

// Configure storage once for all stores
setPersistStorage(createPersistStorage());
