import sign from '@signpdf/signpdf';
import { PDFDocument } from 'pdf-lib';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { P12Signer } from '@/crypto/signers/p12.signer';
import { SigningOptions } from '@/crypto/interfaces/signer.interface';

export class PDFSigner {
  private static DEFAULT_OPTIONS: SigningOptions = {
    reason: 'Digital Signature',
    contactInfo: '',
    name: 'Digital Signer',
    location: '',
    signingTime: new Date(),
  };

  async sign(
    pdfBuffer: Buffer,
    signer: P12Signer,
    options: SigningOptions = {},
  ): Promise<Buffer> {
    try {
      const mergedOptions = { ...PDFSigner.DEFAULT_OPTIONS, ...options };

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Add placeholder for signature
      await pdflibAddPlaceholder({
        pdfDoc,
        reason: mergedOptions.reason,
        contactInfo: mergedOptions.contactInfo,
        name: mergedOptions.name,
        location: mergedOptions.location,
      });

      // Get the PDF with placeholder
      const pdfWithPlaceholder = await pdfDoc.save();

      // Sign the PDF
      const signedPdf = await sign.sign(pdfWithPlaceholder, signer);

      return Buffer.from(signedPdf);
    } catch (error) {
      console.error('Error signing PDF:', error);
      throw error;
    }
  }
}
