interface PreparePDFResult {
  preparedPDF: ArrayBuffer;  // PDF with placeholder
  documentHash: string;      // Hash to be signed (for QR code)
  byteRanges: number[];     // Keep track of signed ranges
}

interface SignatureData {
  signature: Buffer;        // From mobile app
  certificate: Buffer;      // Signer's certificate
}

// Step 1: Prepare PDF and get hash for QR code
async function preparePDFForSigning(originalPDF: ArrayBuffer): Promise<PreparePDFResult> {
  // 1. Add placeholder to PDF
  const pdfWithPlaceholder = await pdfkitAddPlaceholder({
    pdf: originalPDF,
    reason: 'Digital Signature',
    name: 'Document Signer',
    location: 'Web Browser'
  });

  // 2. Calculate hash of byte ranges
  const byteRanges = extractByteRanges(pdfWithPlaceholder);
  const documentHash = await calculateDocumentHash(pdfWithPlaceholder, byteRanges);

  return {
    preparedPDF: pdfWithPlaceholder,
    documentHash,
    byteRanges
  };
}

// Step 2: Embed signature received from mobile app
async function embedSignature(
  preparedPDF: ArrayBuffer,
  signatureData: SignatureData,
  byteRanges: number[]
): Promise<ArrayBuffer> {
  // 1. Create CMS structure with signature
  const cms = await createCMSStructure(signatureData);
  
  // 2. Embed CMS into PDF
  const signedPDF = await embedCMSSignature(preparedPDF, cms, byteRanges);
  
  return signedPDF;
}

// Usage in your app:
async function signDocument(originalPDF: ArrayBuffer) {
  // 1. Prepare PDF and get hash
  const { preparedPDF, documentHash, byteRanges } = await preparePDFForSigning(originalPDF);
  
  // 2. Create QR code with hash
  const qrCode = await generateQRCode(documentHash);
  
  // 3. When signature comes back from mobile:
  mobileApp.on('signature', async (signatureData: SignatureData) => {
    // 4. Embed signature
    const signedPDF = await embedSignature(preparedPDF, signatureData, byteRanges);
    
    // 5. Allow user to download signed PDF
    downloadPDF(signedPDF);
  });
}