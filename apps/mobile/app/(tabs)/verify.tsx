import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PDFSigner, SignatureInfo } from '@autopen/shared/signpdf/pdf-signer';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

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
      return <ThemedText>No signature information available.</ThemedText>;
    }

    return (
      <ThemedView style={styles.tableContainer}>
        <ThemedText type="subtitle" style={styles.tableTitle}>
          Signature Information
        </ThemedText>
        <View style={styles.tableBody}>
          <TableRow
            label="Signature Valid"
            value={signatureInfo.isValid ? 'Yes' : 'No'}
          />
          <TableRow label="Signer Name" value={signatureInfo.signerName} />
          <TableRow
            label="Signing Time"
            value={signatureInfo.signingTime.toString()}
          />
          <TableRow label="Reason" value={signatureInfo.reason} />
          <TableRow label="Location" value={signatureInfo.location} />
        </View>
      </ThemedView>
    );
  };

  const TableRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.tableRow}>
      <ThemedText style={[styles.tableCell, styles.labelCell]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.tableCell, styles.valueCell]}>
        {value}
      </ThemedText>
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <FontAwesome
          name="file-pdf-o"
          size={100}
          color="#FFD700"
          style={styles.pdfIcon}
        />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Document Verification</ThemedText>

        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <FontAwesome name="cloud-upload" size={48} color="#007AFF" />
          <ThemedText style={styles.uploadText}>Upload Document</ThemedText>
        </TouchableOpacity>

        {renderVerificationResult()}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 20,
    width: '100%',
  },
  uploadText: {
    marginTop: 10,
    fontSize: 18,
    color: '#007AFF',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteContainer: {
    gap: 8,
  },
  pdfIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  tableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    textAlign: 'left',
  },
  tableBody: {
    gap: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
  },
  labelCell: {
    fontWeight: '600',
  },
  valueCell: {
    textAlign: 'right',
  },
});
