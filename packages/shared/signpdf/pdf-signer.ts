import { PDFDocument, PDFName, PDFString, PDFHexString } from 'pdf-lib';
import { P12Signer } from '@/crypto/signers/p12.signer';

type SigningOptions = {
  reason?: string;
  contactInfo?: string;
  name?: string;
  location?: string;
  signingTime?: Date;
};

export class PDFSigner {
  private static DEFAULT_OPTIONS: SigningOptions = {
    reason: 'Digital Signature',
    contactInfo: '',
    name: 'Digital Signer',
    location: '',
    signingTime: new Date(),
  };

  private stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  async sign(
    pdfBuffer: Buffer,
    signer: P12Signer,
    options: SigningOptions = {},
  ): Promise<Buffer> {
    try {
      if (!signer.privateKey || !signer.cert) {
        throw new Error('Signer not initialized. Call initialize() first');
      }

      const mergedOptions = { ...PDFSigner.DEFAULT_OPTIONS, ...options };

      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const { context } = pdfDoc;

      // Create signature dictionary
      const placeholderLength = 8192;
      const signatureDict = context.obj({
        Type: 'Sig',
        Filter: 'Adobe.PPKLite',
        SubFilter: 'adbe.pkcs7.detached',
        Name: PDFString.of(mergedOptions.name || ''),
        Location: PDFString.of(mergedOptions.location || ''),
        Reason: PDFString.of(mergedOptions.reason || ''),
        SigningTime: PDFString.of(
          mergedOptions.signingTime?.toISOString() || new Date().toISOString(),
        ),
        ByteRange: context.obj([0, 0, 0, 0]),
        Contents: PDFHexString.of('0'.repeat(placeholderLength * 2)),
      });

      // Create signature field
      const signatureFieldDict = context.obj({
        Type: 'Annot',
        Subtype: 'Widget',
        FT: 'Sig',
        Rect: [0, 0, 0, 0],
        V: signatureDict,
        F: 4,
        P: context.register(pdfDoc.getPage(0).ref),
      });

      // Add signature field to AcroForm
      const acroForm = context.obj({
        SigFlags: 3,
        Fields: [signatureFieldDict],
      });

      pdfDoc.catalog.set(PDFName.of('AcroForm'), acroForm);

      // Save PDF with placeholder
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      // Find positions
      const pdfString = Buffer.from(pdfBytes).toString('binary');
      const byteRangePos = pdfString.indexOf('/ByteRange [');
      const contentsPos = pdfString.indexOf('/Contents <');
      const contentsEndPos = pdfString.indexOf('>', contentsPos);
      const contentsStartPos = contentsPos + '/Contents <'.length;

      // Calculate actual ByteRange
      const byteRange = [
        0,
        contentsStartPos,
        contentsEndPos,
        pdfBytes.length - contentsEndPos,
      ];

      // Create PDF for signing
      const pdfToSign = Buffer.concat([
        pdfBytes.slice(0, contentsStartPos),
        pdfBytes.slice(contentsEndPos),
      ]);

      const signature = await signer.sign(pdfToSign, mergedOptions.signingTime);

      // Convert signature to hex and ensure exact size match
      const signatureHex = Array.from(signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      if (signatureHex.length > placeholderLength * 2) {
        throw new Error('Signature too large for allocated space');
      }

      const paddedSignatureHex = signatureHex.padEnd(
        placeholderLength * 2,
        '0',
      );
      const signedPdf = this.concatUint8Arrays([
        pdfBytes.slice(0, byteRangePos),
        this.stringToUint8Array(`/ByteRange [${byteRange.join(' ')}] `),
        pdfBytes.slice(contentsPos, contentsStartPos),
        this.stringToUint8Array(paddedSignatureHex),
        this.stringToUint8Array('>'),
        pdfBytes.slice(contentsEndPos + 1),
      ]);

      if (signedPdf.length !== pdfBytes.length) {
        console.warn(
          'Size mismatch:',
          '\nOriginal:',
          pdfBytes.length,
          '\nSigned:',
          signedPdf.length,
          '\nDifference:',
          signedPdf.length - pdfBytes.length,
        );
      }

      return Buffer.from(signedPdf);
    } catch (error) {
      console.error('Error signing PDF:', error);
      throw error;
    }
  }
}
