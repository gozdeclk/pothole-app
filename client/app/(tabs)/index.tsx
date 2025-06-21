import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, Modal, Button, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [potholes, setPotholes] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni', 'Uygulamanın düzgün çalışması için konum izni gereklidir.');
        return;
      }

      // İlk konumu alıp haritayı ortala ve çukurları oluştur
      const initialLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(initialLocation);

      const userLat = initialLocation.coords.latitude;
      const userLon = initialLocation.coords.longitude;

      setMapRegion({
        latitude: userLat,
        longitude: userLon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.01,
      });

      const generatedPotholes = [
        { id: 1, latitude: userLat + 0.001, longitude: userLon + 0.001, title: 'Büyük Çukur' },
        { id: 2, latitude: userLat - 0.002, longitude: userLon - 0.0015, title: 'Asfalt Çatlağı' },
        { id: 3, latitude: userLat + 0.003, longitude: userLon - 0.002, title: 'Rögar Kapağı' },
      ];
      setPotholes(generatedPotholes);

      // Konum değişikliklerini izlemeye başla
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // 2 saniyede bir güncelle
          distanceInterval: 10, // 10 metrede bir güncelle
        },
        (location) => {
          setUserLocation(location); // Mavi işareti güncelle
          // Haritayı kullanıcının konumuna otomatik olarak kaydır
          mapRef.current?.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.01,
          }, 1000);
        }
      );
    };

    startWatching();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapRegion({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else {
        Alert.alert('Konum bulunamadı.');
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      Alert.alert('Arama sırasında bir hata oluştu.');
    }
  };

  const handleReportButtonPress = () => {
    if (!userLocation) {
      Alert.alert('Konum Bekleniyor', 'Lütfen konumunuzun bulunmasını bekleyin.');
      return;
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf eklemek için kamera ve galeri izinleri gereklidir.');
      return;
    }

    Alert.alert('Fotoğraf Seç', 'Nereden fotoğraf eklemek istersiniz?', [
      {
        text: 'Kamera',
        onPress: async () => {
          let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
          if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Galeri',
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
          if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
          }
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const handleReportSubmit = () => {
    if (!selectedImage || !userLocation) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir fotoğraf ekleyin.');
      return;
    }

    const newPothole = {
      id: Date.now(),
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      title: 'Yeni Bildirim',
    };
    setPotholes(prevPotholes => [...prevPotholes, newPothole]);

    Alert.alert('Bildirim Başarılı!', 'Çukur bildirimi sisteme eklendi.');
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Arama Butonu */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Konum ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <ThemedText style={styles.searchButtonText}>Ara</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Harita */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={false}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation.coords}
            title="Konumum"
            pinColor="blue"
          />
        )}
        {potholes.map(pothole => (
          <Marker
            key={pothole.id}
            coordinate={{ latitude: pothole.latitude, longitude: pothole.longitude }}
            title={pothole.title}
          >
            <View style={styles.potholeMarker}>
              <ThemedText>🚧</ThemedText>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Çukur Bildir Butonu */}
      <TouchableOpacity style={styles.reportButton} onPress={handleReportButtonPress}>
        <ThemedText style={styles.reportButtonText}>🚧 Bildir</ThemedText>
      </TouchableOpacity>

      {/* Rapor Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Çukur Bildir</ThemedText>
            
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                <ThemedText>Fotoğraf Ekle +</ThemedText>
              )}
            </TouchableOpacity>

            {userLocation && (
              <ThemedText style={styles.locationText}>
                Konum: {userLocation.coords.latitude.toFixed(5)}, {userLocation.coords.longitude.toFixed(5)}
              </ThemedText>
            )}

            <View style={styles.modalButtons}>
              <Button title="İptal" onPress={closeModal} color="red" />
              <Button title="Gönder" onPress={handleReportSubmit} />
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  potholeMarker: {
    backgroundColor: 'rgba(255, 99, 71, 0.8)',
    padding: 8,
    borderRadius: 16,
    borderColor: 'white',
    borderWidth: 1,
  },
  reportButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#FF6347',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});
