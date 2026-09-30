import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity, 
  Modal, ScrollView, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null); // สำหรับเปิด Modal ดูรูปกะรายละเอียด

  useFocusEffect(
    useCallback(() => {
      loadJournals();
    }, [])
  );

  const loadJournals = async () => {
    try {
      const data = await AsyncStorage.getItem('journals');
      if (data) setJournals(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const renderStars = (count) => {
    return Array.from({ length: count || 5 }).map((_, i) => (
      <Ionicons key={i} name="star" size={14} color="#FFD700" />
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>✈️ บันทึกการเดินทาง ({journals.length})</Text>

      {journals.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="compass-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>ยังไม่มีบันทึกการเดินทาง</Text>
          <Text style={styles.emptySubText}>แตะแท็บ "เพิ่มบันทึก" ด้านล่างเพื่อเริ่มสร้างความทรงจำ</Text>
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const hasImages = item.images && item.images.length > 0;
            const coverImage = hasImages ? item.images[0] : item.image; // รองรับทั้งแบบรูปเดียวและหลายรูป

            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setSelectedJournal(item)}>
                {/* Banner Image + Photo Count Badge */}
                {coverImage ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: coverImage }} style={styles.cardCover} />
                    {hasImages && item.images.length > 1 && (
                      <View style={styles.photoBadge}>
                        <Ionicons name="images" size={12} color="#fff" />
                        <Text style={styles.photoBadgeText}>+{item.images.length - 1}</Text>
                      </View>
                    )}
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodBadgeText}>{item.mood || '🥳 สนุกมาก'}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.cardCover, styles.noImageCover]}>
                    <Ionicons name="map" size={40} color="#bbb" />
                  </View>
                )}

                {/* Content Details */}
                <View style={styles.cardContent}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.expenseText}>{item.expense || '฿฿'}</Text>
                  </View>

                  <View style={styles.ratingRow}>
                    {renderStars(item.rating)}
                    <Text style={styles.dateText}> • 📅 {item.date}</Text>
                  </View>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {item.tags.map((tag, idx) => (
                        <Text key={idx} style={styles.tagChip}>{tag}</Text>
                      ))}
                    </View>
                  )}

                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description || 'ไม่มีรายละเอียดข้อความเพิ่มเติม...'}
                  </Text>

                  {item.location && (
                    <Text style={styles.locationText}>
                      📍 พิกัด GPS: {item.location.latitude.toFixed(3)}, {item.location.longitude.toFixed(3)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* MODAL หน้าต่างปัดดูรูปภาพและรายละเอียดความทรงจำ */}
      {selectedJournal && (
        <Modal animationType="slide" transparent={false} visible={!!selectedJournal}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* 1. สไลด์ปัดซ้าย-ขวาดูรูปภาพ (Horizontal Image Carousel) */}
              <View style={styles.carouselContainer}>
                {selectedJournal.images && selectedJournal.images.length > 0 ? (
                  <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                    {selectedJournal.images.map((imgUri, idx) => (
                      <Image key={idx} source={{ uri: imgUri }} style={styles.carouselImage} />
                    ))}
                  </ScrollView>
                ) : selectedJournal.image ? (
                  <Image source={{ uri: selectedJournal.image }} style={styles.carouselImage} />
                ) : (
                  <View style={[styles.carouselImage, styles.noImageCover]}>
                    <Ionicons name="image-outline" size={60} color="#ccc" />
                  </View>
                )}

                {/* ปุ่มกากบาทปิด Modal */}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedJournal(null)}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>

                {/* ตัวบอกจำนวนรูป */}
                {selectedJournal.images && selectedJournal.images.length > 1 && (
                  <View style={styles.carouselIndicator}>
                    <Text style={styles.indicatorText}>👈 ปัดซ้าย-ขวาเพื่อดูรูป ({selectedJournal.images.length} รูป)</Text>
                  </View>
                )}
              </View>

              {/* 2. รายละเอียดข้อความใต้อัลบั้มภาพ */}
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedJournal.title}</Text>
                
                <View style={styles.modalHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {renderStars(selectedJournal.rating)}
                  </View>
                  <Text style={styles.modalDate}>📅 {selectedJournal.date}</Text>
                </View>

                {/* Badges */}
                <View style={styles.modalTagRow}>
                  {selectedJournal.mood && <Text style={styles.modalMoodChip}>{selectedJournal.mood}</Text>}
                  {selectedJournal.expense && <Text style={styles.modalExpenseChip}>{selectedJournal.expense}</Text>}
                  {selectedJournal.tags?.map((t, i) => (
                    <Text key={i} style={styles.modalTagChip}>{t}</Text>
                  ))}
                </View>

                <View style={styles.divider} />

                <Text style={styles.modalSubHeader}>📝 ความทรงจำ:</Text>
                <Text style={styles.modalDesc}>{selectedJournal.description || 'ไม่มีข้อความบันทึก'}</Text>

                {selectedJournal.location && (
                  <View style={styles.locationBox}>
                    <Ionicons name="location-sharp" size={20} color="#007AFF" />
                    <Text style={styles.locationBoxText}>
                      พิกัด GPS: {selectedJournal.location.latitude}, {selectedJournal.location.longitude}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1c1c1e' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#8e8e93', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#aeaeb2', textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 18, elevation: 3 },
  imageContainer: { position: 'relative' },
  cardCover: { width: '100%', height: 190 },
  noImageCover: { backgroundColor: '#e5e5ea', justifyContent: 'center', alignItems: 'center' },
  photoBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  moodBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  moodBadgeText: { fontSize: 12, fontWeight: 'bold' },
  cardContent: { padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', flex: 1 },
  expenseText: { fontSize: 14, fontWeight: 'bold', color: '#34C759', marginLeft: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  dateText: { fontSize: 12, color: '#8e8e93' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagChip: { fontSize: 11, backgroundColor: '#f2f2f7', color: '#555', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cardDesc: { fontSize: 14, color: '#3a3a3c', lineHeight: 20 },
  locationText: { fontSize: 12, color: '#007AFF', marginTop: 8, fontWeight: '500' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  carouselContainer: { position: 'relative', width, height: 320, backgroundColor: '#000' },
  carouselImage: { width, height: 320, resizeMode: 'cover' },
  closeBtn: { position: 'absolute', top: 44, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  carouselIndicator: { position: 'absolute', bottom: 12, width: '100%', alignItems: 'center' },
  indicatorText: { color: '#fff', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 8 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalDate: { fontSize: 13, color: '#8e8e93' },
  modalTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modalMoodChip: { backgroundColor: '#007AFF', color: '#fff', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold' },
  modalExpenseChip: { backgroundColor: '#34C759', color: '#fff', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold' },
  modalTagChip: { backgroundColor: '#e5e5ea', color: '#333', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  modalSubHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: '#3a3a3c', lineHeight: 22 },
  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef6ff', padding: 12, borderRadius: 10, marginTop: 20, gap: 8 },
  locationBoxText: { color: '#007AFF', fontSize: 13, fontWeight: '600' }
});