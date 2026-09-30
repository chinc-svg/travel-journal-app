import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Alert, TextInput, Platform 
} from 'react-native';
import * as Battery from 'expo-battery';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [username, setUsername] = useState('นายชิน ชาปัญญา');
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  
  // 1. สรุปสถิติการเดินทาง (Travel Dashboard)
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalPhotos: 0,
    avgRating: '0.0'
  });
  
  const [batteryLevel, setBatteryLevel] = useState(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      checkBattery();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      // โหลดข้อมูลชื่อและรูปโปรไฟล์
      const savedName = await AsyncStorage.getItem('user_name');
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      if (savedName) setUsername(savedName);
      if (savedAvatar) setAvatarUri(savedAvatar);

      // คำนวณสถิติจริงจาก journals ในเครื่อง
      const journalsData = await AsyncStorage.getItem('journals');
      if (journalsData) {
        const journals = JSON.parse(journalsData);
        const totalTrips = journals.length;
        
        let photoCount = 0;
        let ratingSum = 0;

        journals.forEach(item => {
          if (item.images && Array.isArray(item.images)) {
            photoCount += item.images.length;
          } else if (item.image) {
            photoCount += 1;
          }
          ratingSum += (item.rating || 5);
        });

        const avgRating = totalTrips > 0 ? (ratingSum / totalTrips).toFixed(1) : '0.0';

        setStats({
          totalTrips,
          totalPhotos: photoCount,
          avgRating
        });
      } else {
        setStats({ totalTrips: 0, totalPhotos: 0, avgRating: '0.0' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkBattery = async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(level * 100));
    } catch (e) {
      setBatteryLevel('ไม่รองรับบน Simulator');
    }
  };

  // เปลี่ยนรูปโปรไฟล์จากคลังภาพ
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('คำเตือน', 'ต้องการสิทธิ์เข้าถึงคลังภาพเพื่อเปลี่ยนรูปโปรไฟล์');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem('user_avatar', uri);
    }
  };

  // บันทึกชื่อผู้ใช้งาน
  const handleSaveName = async () => {
    setIsEditingName(false);
    await AsyncStorage.setItem('user_name', username);
  };

  // 2. การแจ้งเตือนแบบที่ 1: เตือนบันทึกการเดินทางประจำวัน (Daily Travel Reminder)
  const triggerNotification = () => {
    Alert.alert(
      "🔔 แจ้งเตือนประจำวัน (Daily Reminder)",
      "อย่าลืมบันทึกความทรงจำ! วันนี้คุณไปเที่ยวไหนมาบ้าง แวะมาเช็กอินในแอปได้นะ ✈️📸",
      [{ text: "ตกลง" }]
    );
  };

  // ล้างข้อมูลบันทึกทั้งหมด
  const handleResetData = () => {
    Alert.alert(
      "⚠️ ยืนยันการล้างข้อมูล",
      "คุณต้องการลบบันทึกการเดินทางทั้งหมดหรือไม่? (ข้อมูลจะหายไปทั้งหมด)",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ลบทั้งหมด", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('journals');
            loadProfileData();
            Alert.alert("สำเร็จ", "ล้างข้อมูลบันทึกการเดินทางเรียบร้อยแล้ว");
          } 
        }
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_session');
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. ส่วนหัวโปรไฟล์ (รูป + เปลี่ยนชื่อ) */}
      <View style={styles.profileHeaderCard}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#aaa" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {isEditingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.nameInput}
              value={username}
              onChangeText={setUsername}
              autoFocus
            />
            <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setIsEditingName(true)}>
            <Text style={styles.userName}>{username}</Text>
            <Ionicons name="pencil" size={16} color="#007AFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        <Text style={styles.studentId}>นักศึกษา: 663450181-4</Text>
      </View>

      {/* 2. สรุปสถิติการเดินทาง (Travel Dashboard) */}
      <Text style={styles.sectionHeader}>📊 สถิติการเดินทาง</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="compass" size={26} color="#007AFF" />
          <Text style={styles.statNumber}>{stats.totalTrips}</Text>
          <Text style={styles.statLabel}>ทริปทั้งหมด</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="images" size={26} color="#FF9500" />
          <Text style={styles.statNumber}>{stats.totalPhotos}</Text>
          <Text style={styles.statLabel}>รูปภาพรวม</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star" size={26} color="#FFD700" />
          <Text style={styles.statNumber}>{stats.avgRating}</Text>
          <Text style={styles.statLabel}>ดาวเฉลี่ย</Text>
        </View>
      </View>

      {/* 3. สถานะอุปกรณ์ (Hardware Info) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 สถานะอุปกรณ์ (Platform API)</Text>
        <View style={styles.infoRow}>
          <Ionicons name="battery-charging" size={18} color="#34C759" />
          <Text style={styles.infoText}>
            แบตเตอรี่คงเหลือ: {batteryLevel !== null ? `${batteryLevel}%` : 'กำลังตรวจสอบ...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="phone-portrait-outline" size={18} color="#5856D6" />
          <Text style={styles.infoText}>ระบบปฏิบัติการ: {Platform.OS.toUpperCase()}</Text>
        </View>
      </View>

      {/* 4. ปุ่มคำสั่งต่างๆ */}
      <TouchableOpacity style={styles.actionBtnNotif} onPress={triggerNotification}>
        <Ionicons name="notifications" size={20} color="#fff" />
        <Text style={styles.btnText}>🔔 ทดสอบส่งการแจ้งเตือนประจำวัน</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtnReset} onPress={handleResetData}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.btnText}>🗑️ ล้างข้อมูลบันทึกทั้งหมด</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtnLogout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.btnText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      {/* 5. ส่วนข้อมูลผู้พัฒนา & เครดิต (Developer Info) */}
      <View style={styles.developerCard}>
        <Ionicons name="code-slash-circle" size={28} color="#007AFF" />
        <Text style={styles.devTitle}>ข้อมูลผู้พัฒนาแอปพลิเคชัน</Text>
        <Text style={styles.devText}>👨‍💻 ผู้พัฒนา: นายชิน ชาปัญญา</Text>
        <Text style={styles.devText}>🆔 รหัสนักศึกษา: 663450181-4</Text>
        <Text style={styles.devVersion}>Travel Journal App • Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  profileHeaderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, elevation: 2 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e5e5ea', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1c1c1e' },
  studentId: { fontSize: 13, color: '#8e8e93' },
  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameInput: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, fontSize: 16, backgroundColor: '#fff' },
  saveNameBtn: { backgroundColor: '#34C759', padding: 6, borderRadius: 8 },
  
  sectionHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12, alignItems: 'center', elevation: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold', marginVertical: 4, color: '#1c1c1e' },
  statLabel: { fontSize: 11, color: '#8e8e93' },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#1c1c1e' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#3a3a3c' },

  actionBtnNotif: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  actionBtnReset: { flexDirection: 'row', backgroundColor: '#FF9500', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  actionBtnLogout: { flexDirection: 'row', backgroundColor: '#FF3B30', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  developerCard: { backgroundColor: '#eef6ff', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: '#cce3ff' },
  devTitle: { fontSize: 15, fontWeight: 'bold', color: '#007AFF', marginTop: 6, marginBottom: 8 },
  devText: { fontSize: 13, color: '#333', marginBottom: 4 },
  devVersion: { fontSize: 11, color: '#8e8e93', marginTop: 8 }
});