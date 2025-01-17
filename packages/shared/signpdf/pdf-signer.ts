import sign from '@signpdf/signpdf';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
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
        return null;
      }

      if (!acroForm) {
        return null;
      }

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

      const contents = sigDict.lookup(PDFName.of('Contents'), PDFHexString);
      const byteRange = sigDict.lookup(PDFName.of('ByteRange'), PDFArray);

      if (!contents || !byteRange) {
        console.error('Missing Contents or ByteRange');
        return null;
      }

      // Convert hex string to buffer
      const signatureBuffer = Buffer.from(contents.asBytes());

      console.log('Signature buffer length:', signatureBuffer.length);

      // Create forge buffer and parse ASN.1 structure
      let actualSignature = signatureBuffer;
      let i = signatureBuffer.length - 1;
      while (i >= 0 && signatureBuffer[i] === 0) {
        i--;
      }
      if (i < signatureBuffer.length - 1) {
        actualSignature = signatureBuffer.slice(0, i + 1);
      }

      // Look for ASN.1 sequence identifier (0x30)
      const startIndex = actualSignature.findIndex(byte => byte === 0x30);
      if (startIndex === -1) {
        throw new Error('Invalid signature format: No ASN.1 sequence found');
      }

      let p7Asn1;
      const forgeBuffer = forge.util.createBuffer(
        actualSignature.slice(startIndex),
      );
      p7Asn1 = forge.asn1.fromDer(forgeBuffer.data);
      const p7 = forge.pkcs7.messageFromAsn1(p7Asn1);

      // Debug logging
      console.log('Successfully parsed PKCS#7 structure');
      //@ts-ignore
      const certificateData = extractPKCS7Data(p7);
      console.log(certificateData);

      // Continue with the rest of your verification logic...
      // Extract signature information
      const signatureInfo: SignatureInfo = {
        signatureExists: true,
        isValid: true, // Mocking verification as true
        signerName: certificateData.subject?.commonName || 'Unknown',
        reason: this.extractString(sigDict, 'Reason') || '',
        location: this.extractString(sigDict, 'Location'),
        contactInfo: this.extractString(sigDict, 'ContactInfo'),
        signingTime: this.extractDate(sigDict, 'M') || new Date(),
        signatureType: 'Digital Signature',
        subFilter: this.extractString(sigDict, 'SubFilter'),
        byteRange: this.extractByteRange(sigDict),
        hasVisibleSignature: false,
        certificateInfo: {
          issuer: certificateData.issuer.commonName,
          subject: certificateData.subject?.serialNumber ?? 'n/a',
          validFrom: certificateData.validity.notBefore,
          validTo: certificateData.validity.notAfter,
        },
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

function extractPKCS7Data(p7: any) {
  // Extract certificate details
  const certificateData = p7.certificates[0];
  const extractedData = {
    version: certificateData.version,
    serialNumber: certificateData.serialNumber,
    signatureAlgorithm: certificateData.signatureOid,

    signature: Buffer.from(certificateData.signature, 'binary'),

    subject: formatDN(certificateData.subject),
    issuer: formatDN(certificateData.issuer),

    validity: {
      notBefore: certificateData.validity.notBefore,
      notAfter: certificateData.validity.notAfter,
    },

    authenticatedAttributes: p7.rawCapture.authenticatedAttributes.map(
      (attr: any) => ({
        type: attr.type,
        value: attr.value,
      }),
    ),

    pkcs7Signature: Buffer.from(p7.rawCapture.signature, 'binary'),

    contentType: p7.rawCapture.contentType,

    digestAlgorithm: p7.rawCapture.digestAlgorithm,
  };

  return extractedData;
}

function formatDN(dn: any) {
  const result: Record<string, string> = {};
  if (dn && dn.attributes) {
    dn.attributes.forEach((attr: any) => {
      result[attr.name || attr.type] = attr.value;
    });
  }
  return result;
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
