export interface IKeyManager {
  create(): Promise<void>;
  sign(message: string): Promise<string>;
  verify(message: string, signature: string): Promise<boolean>;
  getPublicKey(): string;
  getPrivateKey(): string;
}
