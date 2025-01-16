import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PDFSigner, SignatureInfo } from '@autopen/shared/signpdf/pdf-signer';

export default function DocumentVerificationView() {
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(
    null,
  );

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      console.log('User cancelled document picker');
      return;
    }

    const pickedFile = result.assets[0];
    const pdfBuffer = await fetch(pickedFile.uri).then(res =>
      res.arrayBuffer(),
    );

    const pdfSigner = new PDFSigner();
    const info = await pdfSigner.verify(Buffer.from(pdfBuffer));
    setSignatureInfo(info);
  };

  const renderVerificationResult = () => {
    if (!signatureInfo) {
      return <Text>No signature information available.</Text>;
    }

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>
          Signature Valid: {signatureInfo.isValid ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.resultText}>
          Signer Name: {signatureInfo.signerName}
        </Text>
        <Text style={styles.resultText}>
          Signing Time: {signatureInfo.signingTime.toString()}
        </Text>
        <Text style={styles.resultText}>Reason: {signatureInfo.reason}</Text>
        <Text style={styles.resultText}>
          Location: {signatureInfo.location}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Document Verification</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
        <Text style={styles.uploadText}>Upload Document</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scrollView}>
        {renderVerificationResult()}
      </ScrollView>
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
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1E1E1',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 10,
    fontSize: 18,
    color: '#007AFF',
  },
  scrollView: {
    width: '100%',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
});
