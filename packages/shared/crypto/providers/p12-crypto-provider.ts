import * as forge from 'node-forge';
import { Buffer } from 'buffer';
import {
  ICryptoProvider,
  IKeyPair,
  SignatureOptions,
} from '../interfaces/crypto-provider.interface';

export class P12CryptoProvider implements ICryptoProvider {
  private async extractKeysFromP12(
    p12Buffer: Buffer | string,
    passphrase: string = '',
  ): Promise<{
    privateKey: forge.pki.PrivateKey;
    publicKey: forge.pki.Certificate;
  }> {
    try {
      const buffer =
        typeof p12Buffer === 'string'
          ? Buffer.from(p12Buffer, 'base64')
          : p12Buffer;

      const p12Der = forge.util.createBuffer(buffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);

      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      })[forge.pki.oids.pkcs8ShroudedKeyBag];

      const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
      })[forge.pki.oids.certBag];

      if (!keyBags || !keyBags[0] || !certBags || !certBags[0]) {
        throw new Error('Failed to extract keys from P12');
      }

      return {
        privateKey: keyBags[0].key,
        publicKey: certBags[0].cert,
      };
    } catch (error) {
      console.error('Error extracting keys from P12:', error);
      throw error;
    }
  }

  async generateKeyPair(): Promise<IKeyPair> {
    throw new Error(
      'Direct key pair generation not supported for P12. Import an existing P12 certificate instead.',
    );
  }

  async sign(
    message: string | Uint8Array | Buffer,
    privateKeyPem: string,
    options?: SignatureOptions,
  ): Promise<string | Buffer> {
    try {
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const messageString =
        message instanceof Uint8Array
          ? Buffer.from(message).toString('utf8')
          : message;

      // Create message digest
      const md = forge.md.sha256.create();
      md.update(messageString, 'utf8');

      // Sign the digest
      const signature = privateKey.sign(md);

      // Return base64 encoded signature
      return Buffer.from(signature, 'binary').toString('base64');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  async verify(
    message: string | Uint8Array,
    signature: string,
    publicKeyPem: string,
    options?: SignatureOptions,
  ): Promise<boolean> {
    try {
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const messageString =
        message instanceof Uint8Array
          ? Buffer.from(message).toString('utf8')
          : message;

      // Create message digest
      const md = forge.md.sha256.create();
      md.update(messageString, 'utf8');

      // Convert base64 signature back to binary
      const signatureBinary = Buffer.from(signature, 'base64').toString(
        'binary',
      );

      // Verify the signature
      return publicKey.verify(md.digest().bytes(), signatureBinary);
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw error;
    }
  }

  async getPublicKey(privateKeyPem: string): Promise<string> {
    try {
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
      return forge.pki.publicKeyToPem(publicKey);
    } catch (error) {
      console.error('Error getting public key:', error);
      throw error;
    }
  }

  async importP12(
    p12Data: Buffer | string,
    passphrase: string = '',
  ): Promise<IKeyPair> {
    try {
      const { privateKey, publicKey } = await this.extractKeysFromP12(
        p12Data,
        passphrase,
      );
      return {
        privateKey: forge.pki.privateKeyToPem(privateKey),
        publicKey: forge.pki.publicKeyToPem(publicKey.publicKey),
      };
    } catch (error) {
      console.error('Error importing P12:', error);
      throw error;
    }
  }
}
