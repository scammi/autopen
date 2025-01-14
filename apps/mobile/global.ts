import { Buffer as ReactNativeBuffer } from '@craftzdog/react-native-buffer';

declare global {
  interface Global {
    Buffer: typeof ReactNativeBuffer;
  }
}

(global as any).Buffer = ReactNativeBuffer;
