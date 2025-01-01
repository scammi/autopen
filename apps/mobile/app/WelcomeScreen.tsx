import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
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
      <Text style={styles.title}>Bienvenido</Text>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={formData.nombre}
            onChangeText={(text) => setFormData({...formData, nombre: text})}
            placeholder="Ingrese su nombre"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={formData.apellido}
            onChangeText={(text) => setFormData({...formData, apellido: text})}
            placeholder="Ingrese su apellido"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={formData.dni}
            onChangeText={(text) => setFormData({...formData, dni: text})}
            placeholder="Ingrese su DNI"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Compañía</Text>
          <TextInput
            style={styles.input}
            value={formData.compania}
            onChangeText={(text) => setFormData({...formData, compania: text})}
            placeholder="Ingrese su compañía"
          />
        </View>

        <Button title="Ingresar" onPress={handleLogin} />
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
