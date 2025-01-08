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

export enum KeyType {
  RSA = 'RSA',
}
