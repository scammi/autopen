export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KeyMetadata {
  id: string;
  createdAt: number;
  keyType: KeyType;
}

export interface SignatureOptions {
  algorithm?: string;
  hashAlgorithm?: string;
}

export enum KeyType {
  RSA = 'RSA',
}
