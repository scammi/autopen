import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';
import { P12Signer } from './p12.signer';

describe('P12Signer', () => {
  let p12Signer: P12Signer;
  let p12Data: Buffer;

  beforeAll(() => {
    p12Data = fs.readFileSync(
      path.join(__dirname, '..', '..', '__fixtures__', 'test.p12'),
    );
  });

  beforeEach(() => {
    p12Signer = new P12Signer(p12Data, { passphrase: 'firmasoftware' });
  });

  it('should initialize with P12 data', async () => {
    await expect(p12Signer.initialize()).resolves.not.toThrow();
    expect(p12Signer.privateKey).toBeDefined();
    expect(p12Signer.cert).toBeDefined();
  });

  it('should throw error when initializing with invalid P12 data', async () => {
    const invalidSigner = new P12Signer(Buffer.from('invalid data'));
    await expect(invalidSigner.initialize()).rejects.toThrow();
  });

  it('should sign content successfully after initialization', async () => {
    await p12Signer.initialize();
    const content = Buffer.from('Test content');
    const signature = await p12Signer.sign(content);

    expect(signature).toBeDefined();
    expect(signature).toBeInstanceOf(Buffer);
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should throw error when signing without initialization', async () => {
    const content = Buffer.from('Test content');
    await expect(p12Signer.sign(content)).rejects.toThrow(
      'Signer not initialized',
    );
  });

  it('should throw error when signing with non-Buffer content', async () => {
    await p12Signer.initialize();
    // @ts-ignore - intentionally passing wrong type
    await expect(p12Signer.sign('string content')).rejects.toThrow(
      'Content expected as Buffer',
    );
  });

  it('should include signing time in signature', async () => {
    await p12Signer.initialize();
    const content = Buffer.from('Test content');
    const signingTime = new Date('2024-01-01T00:00:00Z');

    const signature = await p12Signer.sign(content, signingTime);
    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(0);
  });
});
