import {
  ICryptoProvider,
  IKeyPair,
  SignatureOptions,
} from '../interfaces/crypto-provider.interface';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toHex, recoverMessageAddress } from 'viem';

export class ViemCryptoProvider implements ICryptoProvider {
  async generateKeyPair(): Promise<IKeyPair> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    return {
      privateKey: privateKey,
      publicKey: account.address,
    };
  }

  async sign(
    message: string | Uint8Array | Buffer,
    privateKey: string,
    certificates?: string[],
    options?: SignatureOptions,
  ): Promise<string> {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const messageToSign =
      message instanceof Uint8Array ? toHex(message) : message;
    const signature = await account.signMessage({ message: messageToSign });
    return signature;
  }

  async verify(
    message: string | Uint8Array,
    signature: string,
    publicKey: string,
    options?: SignatureOptions,
  ): Promise<boolean> {
    const messageToVerify =
      message instanceof Uint8Array ? toHex(message) : message;
    const recoveredAddress = await recoverMessageAddress({
      message: messageToVerify,
      signature: signature as `0x${string}`,
    });

    return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
  }

  async getPublicKey(privateKey: string): Promise<string> {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return account.address;
  }
}
