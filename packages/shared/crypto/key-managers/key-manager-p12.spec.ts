import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';
import { P12KeyManager } from '@/crypto/key-managers/key-manager-p12';

describe('P12KeyManager', () => {
  let p12Manager: P12KeyManager;
  let p12Data: Buffer;

  beforeAll(() => {
    p12Data = fs.readFileSync(
      path.join(__dirname, '..', '..', '__fixtures__', 'test.p12')
    );
  });

  beforeEach(() => {
    // Initialize P12Manager with the test certificate
    p12Manager = new P12KeyManager(p12Data, 'firmasoftware');
  });

  it('should create and store keys from P12', async () => {
    await expect(p12Manager.create()).resolves.not.toThrow();
  });

  it('should sign a message', async () => {
    await p12Manager.create();
    const message = 'Test message';
    const signature = await p12Manager.sign(message);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
  });

  it('should verify a signature', async () => {
    await p12Manager.create();
    const message = 'Test message';
    const signature = await p12Manager.sign(message);
    const isValid = await p12Manager.verify(message, signature);
    expect(isValid).toBe(true);
  });

  it('should fail verification with wrong message', async () => {
    await p12Manager.create();
    const message = 'Test message';
    const wrongMessage = 'Wrong message';
    const signature = await p12Manager.sign(message);
    const isValid = await p12Manager.verify(wrongMessage, signature);
    expect(isValid).toBe(false);
  });

  it('should get public key', async () => {
    await p12Manager.create();
    const publicKey = p12Manager.getPublicKey();
    expect(publicKey).toBeDefined();
    expect(typeof publicKey).toBe('string');
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
  });
});
