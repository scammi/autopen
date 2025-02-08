import { v4 as uuidv4 } from 'uuid';
import { useKeyStore } from '../../store/use-key-store';
import { P12CryptoProvider } from '../providers/p12-crypto-provider';
import { IKeyManager } from '../interfaces/key-manager-interfase';
import { IKeyMetadata, KeyType } from '../interfaces/crypto-provider.interface';

export class P12KeyManager implements IKeyManager {
  private cryptoProvider: P12CryptoProvider;
  private keyStore: typeof useKeyStore;
  private p12Data: Buffer | string;
  private passphrase: string;

  constructor(p12Data: Buffer | string, passphrase: string = '') {
    this.cryptoProvider = new P12CryptoProvider();
    this.keyStore = useKeyStore;
    this.p12Data = p12Data;
    this.passphrase = passphrase;
  }

  async create(): Promise<void> {
    try {
      const keyPair = await this.cryptoProvider.importP12(
        this.p12Data,
        this.passphrase,
      );
      const metadata: IKeyMetadata = {
        id: uuidv4(),
        createdAt: Date.now(),
        keyType: KeyType.P12,
      };

      this.keyStore.getState().saveKey(keyPair, metadata);
    } catch (error) {
      console.error('Error creating P12 key pair:', error);
      throw error;
    }
  }

  async sign(message: string): Promise<string | Buffer> {
    const key = this.keyStore.getState().getKey();
    if (!key) throw new Error('No key available');
    return this.cryptoProvider.sign(message, key.keyPair.privateKey);
  }

  async verify(message: string, signature: string): Promise<boolean> {
    const key = this.keyStore.getState().getKey();
    if (!key) throw new Error('No key available');
    return this.cryptoProvider.verify(
      message,
      signature,
      key.keyPair.publicKey,
    );
  }

  getPublicKey(): string {
    const key = this.keyStore.getState().getKey();
    if (!key) throw new Error('No key available');
    return key.keyPair.publicKey;
  }

  getPrivateKey(): string {
    const key = this.keyStore.getState().getKey();
    if (!key) throw new Error('No key available');
    return key.keyPair.privateKey;
  }
}
