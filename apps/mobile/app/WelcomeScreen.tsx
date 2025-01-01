import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const WelcomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    apellido: '',
    dni: '',
    compania: '',
  });

  const handleLogin = () => {
    // Implement login logic here with formData
    console.log(formData);
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome.title')}</Text>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('welcome.name')}</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({...formData, nombre: text})}
            placeholder={t('welcome.name')}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('welcome.lastname')}</Text>
          <TextInput
            style={styles.input}
            value={formData.apellido}
            onChangeText={(text) => setFormData({...formData, apellido: text})}
            placeholder={t('welcome.lastname')}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('welcome.dni')}</Text>
          <TextInput
            style={styles.input}
            value={formData.dni}
            onChangeText={(text) => setFormData({...formData, dni: text})}
            placeholder={t('welcome.dni')}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('welcome.company')}</Text>
          <TextInput
            style={styles.input}
            value={formData.compania}
            onChangeText={(text) => setFormData({...formData, compania: text})}
            placeholder={t('welcome.company')}
          />
        </View>

        <Button title={t('welcome.enter')} onPress={handleLogin} />
      </View>
    </View>
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
