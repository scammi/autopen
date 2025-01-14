import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { P12Signer } from '@autopen/shared/crypto/signers/p12.signer';
import { PDFSigner } from '@autopen/shared/signpdf/pdf-signer';

type DocumentMetadata = {
  name: string;
  type: string;
  size: string;
  lastModified: string;
  buffer: Buffer;
};

export default function DocumentSigningView() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'share'>(
    'upload',
  );
  const [documentMetadata, setDocumentMetadata] =
    useState<DocumentMetadata | null>(null);

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf', // Restrict to PDF files
      copyToCacheDirectory: true, // This ensures we get a local URI we can use
    });

    if (result.canceled) {
      console.log('User cancelled document picker');
      return;
    }

    const pickedFile = result.assets[0];
    const base64 = await FileSystem.readAsStringAsync(pickedFile.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Buffer.from(base64, 'base64');

    setDocumentMetadata({
      name: pickedFile.name,
      type: pickedFile.mimeType || 'application/pdf',
      size: `${(pickedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      lastModified: new Date().toISOString(),
      buffer: buffer,
    });
    setCurrentStep('review');
  };

  const handleSign = async () => {
    if (!documentMetadata?.buffer) {
      throw new Error('No document loaded');
    }

    const asset = await Asset.loadAsync(require('../../assets/test.p12'));
    const assetUri = asset[0].localUri;
    if (!assetUri) {
      throw new Error('Failed to load p12 asset');
    }

    const p12Uri = `${FileSystem.documentDirectory}test.p12`;

    const fileInfo = await FileSystem.getInfoAsync(p12Uri);
    if (!fileInfo.exists) {
      // Copy from asset to document directory
      await FileSystem.copyAsync({
        from: assetUri,
        to: p12Uri,
      });
    }

    const base64Content = await FileSystem.readAsStringAsync(p12Uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const p12Buffer = Buffer.from(base64Content, 'base64');

    const signer = new P12Signer(p12Buffer, {
      passphrase: 'firmasoftware', // TODO MOVE TO ENV.
    });

    await signer.initialize();
    const pdfSigner = new PDFSigner();
    const signedPdf = await pdfSigner.sign(documentMetadata.buffer, signer);

    // Save signed PDF to file system
    const signedFileName = `signed_${documentMetadata.name}`;
    const signedFilePath = `${FileSystem.documentDirectory}${signedFileName}`;
    await FileSystem.writeAsStringAsync(
      signedFilePath,
      signedPdf.toString('base64'),
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    // Update document metadata with signed file info
    setDocumentMetadata({
      ...documentMetadata,
      buffer: signedPdf,
      name: signedFileName,
    });

    setCurrentStep('share');
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setDocumentMetadata(null);
  };

  const handleShare = async () => {
    if (!documentMetadata?.name) {
      alert('No signed document available');
      return;
    }

    try {
      const signedFilePath = `${FileSystem.documentDirectory}${documentMetadata.name}`;

      // Check if sharing is available on the device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        alert('Sharing is not available on this device');
        return;
      }

      // Share/save the file
      await Sharing.shareAsync(signedFilePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save PDF',
        UTI: 'com.adobe.pdf', // for iOS
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
              <Text style={styles.uploadText}>Upload Document</Text>
            </TouchableOpacity>
          </View>
        );
      case 'review':
        return (
          <ScrollView style={styles.scrollView}>
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>Document Metadata</Text>
              {documentMetadata && (
                <View style={styles.metadataContainer}>
                  <MetadataItem label="Name" value={documentMetadata.name} />
                  <MetadataItem label="Type" value={documentMetadata.type} />
                  <MetadataItem label="Size" value={documentMetadata.size} />
                  <MetadataItem
                    label="Last Modified"
                    value={documentMetadata.lastModified}
                  />
                </View>
              )}
              <Text style={styles.sectionTitle}>Additional Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Document Description"
                multiline
              />
              <TextInput style={styles.input} placeholder="Signing Purpose" />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSign}
              >
                <Text style={styles.actionButtonText}>Sign</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      case 'share':
        return (
          <View style={styles.stepContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.successText}>
              Document Signed Successfully!
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.resetButton, { marginTop: 20 }]}
              onPress={handleReset}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.resetButtonText}>New Document</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Document Signing</Text>
      {renderStep()}
    </View>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metadataItem}>
      <Text style={styles.metadataLabel}>{label}:</Text>
      <Text style={styles.metadataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1E1E1',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    aspectRatio: 1,
  },
  uploadText: {
    marginTop: 10,
    fontSize: 18,
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  metadataContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metadataLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  metadataValue: {
    color: '#333',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signatureArea: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 5,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureText: {
    color: '#999',
    fontSize: 18,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 20,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
