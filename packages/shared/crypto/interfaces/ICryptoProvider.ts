import { KeyPair, SignatureOptions } from './types';

export interface ICryptoProvider {
  /**
   * Generates a cryptographic key pair
   */
  generateKeyPair(options?: {
    type?: 'RSA' | 'EC';
    keySize?: number;
  }): Promise<KeyPair>;

  /**
   * Creates a cryptographic signature
   */
  sign(
    message: string | Uint8Array,
    privateKey: string,
    options?: SignatureOptions,
  ): Promise<string>;

  /**
   * Verifies a cryptographic signature
   */
  verify(
    message: string | Uint8Array,
    signature: string,
    publicKey: string,
    options?: SignatureOptions,
  ): Promise<boolean>;

  /**
   * Derives public key from private key
   */
  getPublicKey(privateKey: string): Promise<string>;
}
