import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, 
  ScrollView, Alert, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 1. รายการสถานที่ตัวอย่าง (Preset List) แบบจุใจ
const PRESET_LOCATIONS = [
  "คาเฟ่แมวเหมียว", "คาเฟ่คนเท่", "คาเฟ่ริมหาด ชะอำ", "คาเฟ่สไตล์มินิมอล", "คาเฟ่สวนดอกไม้",
  "คาเฟ่ดาดฟ้าชมวิว", "ร้านอาหารริมน้ำ", "จุดชมวิวพระอาทิตย์ตก", "ถนนคนเดินเชียงใหม่",
  "ตลาดน้ำอัมพวา", "อุทยานแห่งชาติเขาใหญ่", "เกาะล้าน พัทยา", "หาดป่าตอง ภูเก็ต",
  "ดอยอินทนนท์", "น้ำตกเอราวัณ", "ลานกางเต็นท์รับลมหนาว", "วัดพระแก้ว"
];

const MOOD_OPTIONS = ['🥳 สนุกมาก', '☕ ชิลๆ', '🍕 อิ่มแปร้', '📸 ได้รูปเพียบ', '🌿 ผ่อนคลาย', '😴 เหนื่อยแต่คุ้ม'];
const TAG_OPTIONS = ['☀️ แดดดี', '🌧️ ฝนตก', '👫 ไปกับแฟน', '👨‍👩‍👧 ไปกับครอบครัว', '🎒 ลุยคนเดียว', '🐾 พาตัวโปรดมา'];
const EXPENSE_OPTIONS = ['฿ (ประหยัด)', '฿฿ (ปานกลาง)', '฿฿฿ (จัดเต็ม)'];

export default function AddJournalScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); // อาร์เรย์เก็บรูปภาพหลายรูป
  const [location, setLocation] = useState(null);
  
  // ลูกเล่นความทรงจำ
  const [rating, setRating] = useState(5);
  const [selectedMood, setSelectedMood] = useState('🥳 สนุกมาก');
  const [selectedTags, setSelectedTags] = useState([]);
  const [expense, setExpense] = useState('฿฿ (ปานกลาง)');

  // ระบบแนะนำสถานที่
  const [historyLocations, setHistoryLocations] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadHistoryLocations();
  }, []);

  // ดึงชื่อสถานที่ที่เคยบันทึกไว้ในอดีต
  const loadHistoryLocations = async () => {
    try {
      const data = await AsyncStorage.getItem('journals');
      if (data) {
        const parsed = JSON.parse(data);
        const historyTitles = parsed.map(item => item.title).filter(Boolean);
        setHistoryLocations([...new Set(historyTitles)]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ค้นหาและแนะนำสถานที่ขณะพิมพ์
  const handleTitleChange = (text) => {
    setTitle(text);
    if (text.trim().length > 0) {
      const allPresets = [...new Set([...PRESET_LOCATIONS, ...historyLocations])];
      const matches = allPresets.filter(item => 
        item.toLowerCase().includes(text.toLowerCase()) && item.toLowerCase() !== text.toLowerCase()
      );
      setFilteredSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (selectedText) => {
    setTitle(selectedText);
    setShowSuggestions(false);
  };

  // เลือกรูปภาพได้หลายรูปพร้อมกัน
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('คำเตือน', 'ต้องการสิทธิ์เข้าถึงคลังภาพ');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // เลือกได้หลายรูป
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // เลือก/ยกเลิกแท็กบรรยากาศ
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // ดึงพิกัด GPS
  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('คำเตือน', 'ต้องการสิทธิ์เข้าถึงพิกัด GPS');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    Alert.alert('สำเร็จ', 'ดึงพิกัดตำแหน่งเรียบร้อยแล้ว');
  };

  // บันทึกข้อมูล
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('คำเตือน', 'กรุณากรอกชื่อสถานที่');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      title,
      description,
      images,
      location,
      rating,
      mood: selectedMood,
      tags: selectedTags,
      expense,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    try {
      const existingData = await AsyncStorage.getItem('journals');
      const journals = existingData ? JSON.parse(existingData) : [];
      journals.unshift(newEntry);
      await AsyncStorage.setItem('journals', JSON.stringify(journals));

      Alert.alert('สำเร็จ', 'บันทึกความทรงจำเรียบร้อยแล้ว!');
      // รีเซ็ตค่า
      setTitle('');
      setDescription('');
      setImages([]);
      setLocation(null);
      setSelectedTags([]);
      router.push('/(tabs)');
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* 1. ช่องกรอกชื่อสถานที่ + ตัวเลือก Autocomplete */}
      <Text style={styles.sectionHeader}>📍 ชื่อสถานที่ / ความทรงจำ</Text>
      <TextInput 
        style={styles.input} 
        value={title} 
        onChangeText={handleTitleChange} 
        placeholder="พิมพ์ชื่อ เช่น คาเฟ่, ชะอำ..." 
      />

      {showSuggestions && (
        <View style={styles.suggestionContainer}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 130 }}>
            {filteredSuggestions.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                <Text style={styles.suggestionText}>✨ {item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 2. ระบบเลือกอารมณ์ (Mood) */}
      <Text style={styles.sectionHeader}>🎭 อารมณ์วันนี้ (Mood)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
        {MOOD_OPTIONS.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[styles.chip, selectedMood === mood && styles.chipActive]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={[styles.chipText, selectedMood === mood && styles.chipTextActive]}>{mood}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 3. แท็กบรรยากาศ & เพื่อนร่วมทริป */}
      <Text style={styles.sectionHeader}>🏷️ บรรยากาศ & เพื่อนร่วมทริป</Text>
      <View style={styles.flexWrapContainer}>
        {TAG_OPTIONS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. คะแนนความประทับใจ (Rating Star) */}
      <Text style={styles.sectionHeader}>⭐ คะแนนความประทับใจ</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color="#FFD700"
              style={{ marginRight: 6 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 5. งบประมาณ (Expense) */}
      <Text style={styles.sectionHeader}>💰 งบประมาณโดยประมาณ</Text>
      <View style={styles.row}>
        {EXPENSE_OPTIONS.map((exp) => (
          <TouchableOpacity
            key={exp}
            style={[styles.chipFlex, expense === exp && styles.chipActive]}
            onPress={() => setExpense(exp)}
          >
            <Text style={[styles.chipText, expense === exp && styles.chipTextActive]}>{exp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 6. รูปภาพหลายรูป (Multi-Image Picker) */}
      <Text style={styles.sectionHeader}>📸 รูปภาพความทรงจำ ({images.length} รูป)</Text>
      <TouchableOpacity style={styles.addImgBtn} onPress={pickImages}>
        <Ionicons name="images" size={20} color="#fff" />
        <Text style={styles.addImgBtnText}>เลือกรูปภาพเพิ่ม (เลือกได้หลายรูป)</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgScroll}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imgWrapper}>
              <Image source={{ uri }} style={styles.thumbImage} />
              <TouchableOpacity style={styles.deleteBadge} onPress={() => removeImage(idx)}>
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 7. บันทึกพิกัด GPS */}
      <TouchableOpacity style={[styles.gpsBtn, location && { backgroundColor: '#34C759' }]} onPress={getLocation}>
        <Ionicons name="location" size={20} color="#fff" />
        <Text style={styles.addImgBtnText}>
          {location ? `พิกัด: ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}` : 'กดดึงพิกัด GPS ปัจจุบัน'}
        </Text>
      </TouchableOpacity>

      {/* 8. ข้อความความทรงจำ */}
      <Text style={styles.sectionHeader}>📝 เรื่องราวความทรงจำ</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="เล่าบรรยากาศ สิ่งที่ประทับใจ..."
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>💾 บันทึกการเดินทาง</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  suggestionContainer: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, backgroundColor: '#fff', marginTop: 4 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  rowScroll: { flexDirection: 'row', marginBottom: 4 },
  flexWrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, marginBottom: 6 },
  chipFlex: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center', marginHorizontal: 3 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  addImgBtn: { flexDirection: 'row', backgroundColor: '#FF9500', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addImgBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  imgScroll: { marginTop: 12, flexDirection: 'row' },
  imgWrapper: { position: 'relative', marginRight: 10 },
  thumbImage: { width: 90, height: 90, borderRadius: 10 },
  deleteBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 12 },
  gpsBtn: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  saveBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, marginTop: 24, marginBottom: 50, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' }
});