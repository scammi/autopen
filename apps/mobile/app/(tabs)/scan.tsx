import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, usePathname } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyManager } from '@autopen/shared/crypto/key-managers/key-manager-viem';

const SCAN_DEBOUNCE_MS = 2000; // 2 second debounce

export default function TabTwoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const pathname = usePathname();
  const [scanned, setScanned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const lastScannedTimestampRef = useRef(0);

  const keyManager = new KeyManager();

  useEffect(() => {
    setIsActive(pathname === '/explore');

    return () => {
      setScanned(false);
      setSigning(false);
      setIsActive(false);
    };
  }, [pathname]);

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

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    const timestamp = Date.now();
    if (
      scanned ||
      signing ||
      !isActive ||
      timestamp - lastScannedTimestampRef.current < SCAN_DEBOUNCE_MS
    ) {
      return;
    }

    lastScannedTimestampRef.current = timestamp;
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
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Invalid QR Code', 
        'Please scan a valid QR code.', 
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    }
  };

  const isValidQRCode = (data: string) => {
    try {
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
                setSigning(false);
                setScanned(false);
                router.push('/(tabs)');
              },
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to sign document');
        setSigning(false);
        setScanned(false);
      }
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
        onBarcodeScanned={!signing ? handleBarCodeScanned : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}></View>
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
