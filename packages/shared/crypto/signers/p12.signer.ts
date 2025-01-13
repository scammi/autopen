import * as forge from 'node-forge';
import { ISigner } from '../interfaces/signer.interface';

type P12Options = {
  passphrase?: string;
};

export class P12Signer implements ISigner {
  p12Buffer: Uint8Array | Buffer;
  passphrase?: string;

  cert: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;

  constructor(p12Buffer: Uint8Array | Buffer, options: P12Options = {}) {
    this.p12Buffer = p12Buffer;
    this.passphrase = options.passphrase;
  }

  async initialize() {
    const { privateKey, certificate } = await this.extractKeysFromP12();

    this.cert = certificate;
    this.privateKey = privateKey;
  }

  async extractKeysFromP12(): Promise<{
    privateKey: forge.pki.PrivateKey;
    certificate: forge.pki.Certificate;
  }> {
    try {
      const binaryString = Array.from(this.p12Buffer)
        .map(byte => String.fromCharCode(byte))
        .join('');
      const p12Der = forge.util.createBuffer(binaryString);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.passphrase);

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
        certificate: certBags[0].cert,
      };
    } catch (error) {
      console.error('Error extracting keys from P12:', error);
      throw error;
    }
  }

  async sign(
    content: Uint8Array | Buffer,
    signingTime: Date = new Date(),
  ): Promise<Buffer | Uint8Array> {
    if (!(content instanceof Uint8Array) && !Buffer.isBuffer(content)) {
      throw new Error('Content expected as Buffer');
    }

    if (!this.privateKey || !this.cert) {
      throw new Error('Signer not initialized. Call initialize() first');
    }

    const binaryString = Array.from(content)
      .map(byte => String.fromCharCode(byte))
      .join('');

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(binaryString);

    p7.addCertificate(this.cert);

    p7.addSigner({
      key: this.privateKey as forge.pki.rsa.PrivateKey,
      certificate: this.cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.signingTime,
          value: signingTime.toString(),
        },
        {
          type: forge.pki.oids.messageDigest,
        },
      ],
    });

    p7.sign({ detached: true });
    const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return new Uint8Array(derBytes.split('').map(c => c.charCodeAt(0)));
  }
}
