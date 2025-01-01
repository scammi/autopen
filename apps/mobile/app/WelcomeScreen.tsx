import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();

  const handleLogin = () => {
    // Implement login logic here
    // On successful login, navigate to the main layout
    router.push('/(tabs)');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the App!</Text>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default WelcomeScreen;
