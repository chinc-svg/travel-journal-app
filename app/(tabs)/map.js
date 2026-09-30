import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

export default function MapScreen() {
  const [journals, setJournals] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadMarkers();
    }, [])
  );

  const loadMarkers = async () => {
    const data = await AsyncStorage.getItem('journals');
    if (data) {
      const parsed = JSON.parse(data);
      setJournals(parsed.filter(j => j && j.location));
    }
  };

  const openInGoogleMaps = (lat, lng, title) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิด Google Maps ได้');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📍 หมุดสถานที่เดินทาง ({journals.length})</Text>
      
      {journals.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>ยังไม่มีพิกัดสถานที่ถูกบันทึก</Text>
          <Text style={styles.subText}>กรุณาเพิ่มบันทึกพร้อมกด "ดึงพิกัด GPS"</Text>
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.coords}>
                  🌐 ละติจูด: {item.location.latitude.toFixed(4)}, ลองจิจูด: {item.location.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => openInGoogleMaps(item.location.latitude, item.location.longitude, item.title)}
              >
                <Text style={styles.btnText}>🗺️ เปิดแผนที่</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6c757d', fontWeight: 'bold' },
  subText: { fontSize: 13, color: '#adb5bd', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: 10 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  coords: { fontSize: 12, color: '#007AFF' },
  btn: { backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' }
});