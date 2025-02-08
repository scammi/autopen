import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSignerStore } from '@autopen/shared/store/use-signer-store';
import { KeyManager } from '@autopen/shared/crypto/key-managers/key-manager-viem';
import 'react-native-get-random-values';

const WelcomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { signer, setSigner } = useSignerStore();

  const lastNameRef = useRef<TextInput>(null);
  const dniRef = useRef<TextInput>(null);
  const companiaRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    nombre: signer?.nombre ?? '',
    apellido: signer?.apellido ?? '',
    dni: signer?.dni ?? '',
    compania: signer?.compania ?? '',
  });

  const handleLogin = async () => {
    try {
      const keyManager = new KeyManager();
      await keyManager.create();

      const testMessage = 'Hello, Autopen!';
      const signature = await keyManager.sign(testMessage);
      console.log('Test Message:', testMessage);
      console.log('Signature:', signature);

      setSigner({
        ...formData,
      });

      router.push('/(tabs)');
    } catch (error) {
      console.error('Error generating key pair:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={styles.container}>
        <View style={{ paddingTop: 20 }}>
          <Text style={styles.title}>{t('welcome.title')}</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('welcome.name')}</Text>
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={text => setFormData({ ...formData, nombre: text })}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              placeholder={t('welcome.name')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('welcome.lastname')}</Text>
            <TextInput
              ref={lastNameRef}
              style={styles.input}
              value={formData.apellido}
              onChangeText={text =>
                setFormData({ ...formData, apellido: text })
              }
              returnKeyType="next"
              onSubmitEditing={() => dniRef.current?.focus()}
              placeholder={t('welcome.lastname')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('welcome.dni')}</Text>
            <TextInput
              style={styles.input}
              ref={dniRef}
              value={formData.dni}
              onChangeText={text => setFormData({ ...formData, dni: text })}
              returnKeyType="next"
              onSubmitEditing={() => companiaRef.current?.focus()}
              placeholder={t('welcome.dni')}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('welcome.company')}</Text>
            <TextInput
              style={styles.input}
              ref={companiaRef}
              value={formData.compania}
              onChangeText={text =>
                setFormData({ ...formData, compania: text })
              }
              placeholder={t('welcome.company')}
              returnKeyType="done"
            />
          </View>
          <Button title={t('welcome.enter')} onPress={handleLogin} />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  form: {
    flex: 1,
    gap: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
});

export default WelcomeScreen;
