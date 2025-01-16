import sign from '@signpdf/signpdf';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFString,
} from 'pdf-lib';
import * as forge from 'node-forge';
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

  async verify(pdfBuffer: Buffer): Promise<SignatureInfo | null> {
    try {
      const pdf = await PDFDocument.load(pdfBuffer);

      // Get the acroForm dictionary
      let acroForm: PDFDict | undefined;
      try {
        acroForm = pdf.catalog.lookup(PDFName.of('AcroForm'), PDFDict);
      } catch (error) {
        console.warn('AcroForm not found or not a PDFDict:', error);
        return null; // Return null if AcroForm is not found
      }

      if (!acroForm) {
        return null;
      }

      // Get the fields array
      const fields = acroForm.lookup(PDFName.of('Fields'), PDFArray);
      if (!fields || !(fields instanceof PDFArray)) {
        return null;
      }

      // Look for signature field
      let signatureField: PDFDict | null = null;

      for (let i = 0; i < fields.size(); i++) {
        const field = fields.lookup(i, PDFDict);
        if (!field) continue;

        const fieldType = field.lookup(PDFName.of('FT'), PDFName);
        if (fieldType?.toString() === '/Sig') {
          signatureField = field;
          break;
        }
      }

      if (!signatureField) {
        return null; // No signature field found
      }

      // Get the signature dictionary
      const sigDict = signatureField.lookup(PDFName.of('V'), PDFDict);
      if (!sigDict || !(sigDict instanceof PDFDict)) {
        return null;
      }

      // Extract signature information
      const signatureInfo: SignatureInfo = {
        signatureExists: true,
        isValid: true, // Mocking verification as true
        signerName: this.extractString(sigDict, 'Name') || 'Unknown',
        reason: this.extractString(sigDict, 'Reason') || '',
        location: this.extractString(sigDict, 'Location'),
        contactInfo: this.extractString(sigDict, 'ContactInfo'),
        signingTime: this.extractDate(sigDict, 'M') || new Date(),
        signatureType: 'Digital Signature',
        subFilter: this.extractString(sigDict, 'SubFilter'),
        byteRange: this.extractByteRange(sigDict),
        hasVisibleSignature: false,
      };

      return signatureInfo;
    } catch (error) {
      console.error('Error verifying PDF:', error);
      throw new Error('PDF verification failed: ' + error.message);
    }
  }

  private extractString(dict: PDFDict, key: string): string | undefined {
    const value = dict.lookup(PDFName.of(key));

    if (value instanceof PDFString || value instanceof PDFHexString) {
      return value.decodeText();
    } else if (value instanceof PDFName) {
      return value.toString();
    }

    return undefined;
  }
  private extractDate(dict: PDFDict, key: string): Date | undefined {
    const dateStr = this.extractString(dict, key);
    if (!dateStr) return undefined;

    // PDF date format: D:YYYYMMDDHHmmSS
    const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!match) return undefined;

    const [_, year, month, day, hour, minute, second] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
    );
  }

  private extractByteRange(dict: PDFDict): number[] | undefined {
    const byteRange = dict.lookup(PDFName.of('ByteRange'), PDFArray);
    if (!byteRange || !(byteRange instanceof PDFArray)) return undefined;

    const result: number[] = [];
    for (let i = 0; i < byteRange.size(); i++) {
      const num = byteRange.lookup(i, PDFNumber);
      if (num) result.push(num.value());
    }
    return result;
  }
}

export interface SignatureInfo {
  // Basic validation info
  isValid: boolean;
  signatureExists: boolean;

  // Signer details
  signerName: string;
  signerDN?: string; // Distinguished Name from certificate
  certificateInfo?: {
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    serialNumber?: string;
  };

  // Signature details
  signingTime: Date;
  reason: string;
  location?: string;
  contactInfo?: string;
  signatureType: string;
  subFilter?: string; // e.g., 'adbe.pkcs7.detached' or 'ETSI.CAdES.detached'

  // Technical details
  digestAlgorithm?: string;
  hasVisibleSignature?: boolean;
  byteRange?: number[];
}
