import { StyleSheet, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSignerStore } from '@autopen/shared/store/useSignerStore';

export default function HomeScreen() {
  const { signer } = useSignerStore();

  // Mock data for additional information
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(); // 1 year from now
  const status = 'Active';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <FontAwesome name="certificate" size={100} color="#FFD700" style={styles.certificateIcon} />
      }>
      <ThemedView style={styles.container}>
        <ThemedText type="title">X509 Digital Signer Credential</ThemedText>
        
        <ThemedView style={styles.infoContainer}>
          <InfoItem label="Name" value={signer ? `${signer.nombre} ${signer.apellido}` : 'N/A'} />
          <InfoItem label="DNI" value={signer?.dni || 'N/A'} />
          <InfoItem label="Company" value={signer?.compania || 'N/A'} />
          <InfoItem label="Valid Until" value={validUntil} />
          <InfoItem label="Status" value={status} />
        </ThemedView>

        <ThemedView style={styles.noteContainer}>
          <ThemedText type="subtitle">Important Notes:</ThemedText>
          <ThemedText>
            1. Keep your credential information confidential.
          </ThemedText>
          <ThemedText>
            2. Ensure your credential is up to date before signing documents.
          </ThemedText>
          <ThemedText>
            3. Contact support if you notice any discrepancies in your information.
          </ThemedText>
        </ThemedView>

      </ThemedView>
    </ParallaxScrollView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.infoItem}>
      <ThemedText type="defaultSemiBold">{label}:</ThemedText>
      <ThemedText>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
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
  footer: {
    textAlign: 'center',
    marginTop: 16,
  },
  certificateIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});

