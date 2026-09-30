import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('คำเตือน', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    // [สัปดาห์ 7, 8] จัดเก็บข้อมูลการเข้าสู่ระบบไว้ใน Local Storage
    await AsyncStorage.setItem('user_session', JSON.stringify({ username }));
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✈️ Travel Journal</Text>
      <Text style={styles.subtitle}>ระบบบันทึกความทรงจำการเดินทาง</Text>
      
      <TextInput
        style={styles.input}
        placeholder="ชื่อผู้ใช้งาน"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8f9fa' },
  title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#007AFF', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, color: '#6c757d' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6' },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});