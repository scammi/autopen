import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyManager } from '@autopen/shared/crypto/KeyManager';

const keyManager = new KeyManager();

export default function TabTwoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!permission) {
    return (
      <ThemedView>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          We need your permission to use the camera
        </ThemedText>
        <ThemedText style={styles.button} onPress={requestPermission}>
          Grant permission
        </ThemedText>
      </ThemedView>
    );
  }

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    setScanned(true);
    if (isValidQRCode(data)) {
      Alert.alert(
        'Valid QR Code',
        'The scanned QR code is valid. Do you want to proceed?',
        [
          {
            text: 'Cancel',
            onPress: () => setScanned(false),
            style: 'cancel',
          },
          { text: 'OK', onPress: () => handleValidQRCode(data) },
        ],
      );
    } else {
      Alert.alert('Invalid QR Code', 'Please scan a valid QR code.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  const isValidQRCode = (data: string) => {
    try {
      console.log('data>>>', data)
      return data.startsWith('autopen:') && data.split(':')[1].length > 0;
    } catch {
      return false;
    }
  };

  const handleValidQRCode = async (data: string) => {
    try {
      const hash = data.split(':')[1];

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign document',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: true,
      });

      if (!auth.success) {
        Alert.alert('Authentication Failed', 'Please try again');
        setScanned(false);
        return;
      }

      Alert.alert(
        'Confirm Signing',
        `You are about to sign the following hash:\n\n${hash.slice(0, 20)}...`,
        [
          {
            text: 'Cancel',
            onPress: () => setScanned(false),
            style: 'cancel',
          },
          {
            text: 'Sign',
            onPress: async () => {
              try {
                setSigning(true);
                const signature = await keyManager.sign(hash);

                Alert.alert(
                  'Successfully Signed!',
                  `Signature: ${signature.slice(0, 20)}...`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setScanned(false);
                        router.push('/(tabs)');
                      },
                    },
                  ],
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to sign document');
                setScanned(false);
              } finally {
                setSigning(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
      setScanned(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {scanned && !signing && (
                <ThemedText
                  style={styles.scanAgainText}
                  onPress={() => setScanned(false)}
                >
                  Tap to Scan Again
                </ThemedText>
              )}
              {signing && (
                <ThemedText style={styles.scanAgainText}>
                  Signing...
                </ThemedText>
              )}
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  button: {
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  scanAgainText: {
    textAlign: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
  },
});
