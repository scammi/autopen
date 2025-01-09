export interface IKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface IKeyMetadata {
  id: string;
  createdAt: number;
  keyType: KeyType;
}

export interface SignatureOptions {
  algorithm?: string;
  hashAlgorithm?: string;
}

export interface ICryptoProvider {
  /**
   * Generates a cryptographic key pair
   */
  generateKeyPair(options?: {
    type?: 'RSA' | 'EC';
    keySize?: number;
  }): Promise<IKeyPair>;

  /**
   * Creates a cryptographic signature
   */
  sign(
    message: string | Uint8Array | Buffer,
    privateKey: string,
    certificates?: string[],
    options?: SignatureOptions,
  ): Promise<string | Buffer>;

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

export enum KeyType {
  RSA = 'RSA',
  P12 = 'P12',
}
