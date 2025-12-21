import { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GarageSale } from '@/types/garageSale';
import { garageSaleService } from '@/services/garageSaleService';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';
import { historyService } from '@/services/historyService';
import FavoriteButton from '@/components/FavoriteButton';
import ReminderButton from '@/components/ReminderButton';
import { formatDate, formatTime } from '@/lib/dateUtils';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [garageSales, setGarageSales] = useState<GarageSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Load user location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          Alert.alert('Permission Denied', 'Please enable location services to use this feature');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        console.log('Current location:', currentLocation.coords);

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error: any) {
        console.error('Error getting location:', error);
        setErrorMsg('Error getting location: ' + error.message);
        Alert.alert('Location Error', 'Failed to get your current location.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load garage sales when location is available
  useEffect(() => {
    if (location) {
      loadGarageSales();
    }
  }, [location]);

  const loadGarageSales = async () => {
    try {
      console.log('🔄 Loading garage sales...');
      const sales = await garageSaleService.getAllGarageSales();
      setGarageSales(sales);
      console.log(`✅ Loaded ${sales.length} garage sales:`);
      sales.forEach((sale, idx) => {
        console.log(`  ${idx + 1}. ${sale.title} - ${sale.address} (${sale.date})`);
      });
    } catch (error) {
      console.error('❌ Error loading garage sales:', error);
      Alert.alert('Error', 'Failed to load garage sales');
    }
  };


  const handleCalloutPress = (sale: GarageSale) => {
    // Track view if user is authenticated
    if (isAuthenticated && user) {
      historyService.recordView(user.id, sale.id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View>
          <ThemedText type="title">Yardr</ThemedText>
          <ThemedText style={styles.subtitle}>
            {garageSales.length} garage sales nearby
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={loadGarageSales}
          style={styles.refreshButton}
        >
          <ThemedText style={styles.refreshText}>🔄 Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Map */}
      {location && !loading ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={location}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            provider={PROVIDER_DEFAULT}
          >
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
              pinColor="blue"
            />

            {/* Garage sale markers */}
            {garageSales.map((sale) => (
              <Marker
                key={sale.id}
                coordinate={{
                  latitude: sale.location.latitude,
                  longitude: sale.location.longitude,
                }}
                pinColor="red"
              >
                <Callout tooltip style={styles.calloutContainer} onPress={() => handleCalloutPress(sale)}>
                  <View style={styles.calloutCard}>
                    {/* Video Preview */}
                    {sale.videoUrl && (
                      <Video
                        source={{ uri: sale.videoUrl }}
                        style={styles.calloutVideo}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay
                        isMuted
                      />
                    )}

                    {/* Details */}
                    <View style={styles.calloutContent}>
                      <ThemedText style={styles.calloutTitle}>{sale.title}</ThemedText>

                      <View style={styles.calloutRow}>
                        <ThemedText style={styles.calloutIcon}>📅</ThemedText>
                        <ThemedText style={styles.calloutText}>
                          {formatDate(sale.date)}
                        </ThemedText>
                      </View>

                      <View style={styles.calloutRow}>
                        <ThemedText style={styles.calloutIcon}>🕐</ThemedText>
                        <ThemedText style={styles.calloutText}>
                          {formatTime(sale.startTime)} - {formatTime(sale.endTime)}
                        </ThemedText>
                      </View>

                      <View style={styles.calloutRow}>
                        <ThemedText style={styles.calloutIcon}>📍</ThemedText>
                        <ThemedText style={styles.calloutText} numberOfLines={1}>
                          {sale.location.address}
                        </ThemedText>
                      </View>

                      <View style={styles.calloutRow}>
                        <ThemedText style={styles.calloutIcon}>📝</ThemedText>
                        <ThemedText style={styles.calloutText} numberOfLines={2}>
                          {sale.description}
                        </ThemedText>
                      </View>

                      {sale.contactName && (
                        <View style={styles.calloutRow}>
                          <ThemedText style={styles.calloutIcon}>👤</ThemedText>
                          <ThemedText style={styles.calloutText}>
                            {sale.contactName}
                          </ThemedText>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={styles.calloutActions}>
                        <FavoriteButton garageSaleId={sale.id} size={20} showLabel />
                        <ReminderButton
                          garageSaleId={sale.id}
                          garageSaleTitle={sale.title}
                          garageSaleDate={sale.startDate || sale.date}
                          size={20}
                          showLabel
                        />
                      </View>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Map Type Toggle */}
          <View style={styles.mapTypeControls}>
            <TouchableOpacity
              style={[styles.mapTypeButton, mapType === 'standard' && styles.mapTypeButtonActive]}
              onPress={() => setMapType('standard')}
            >
              <ThemedText style={styles.mapTypeButtonText}>Map</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapTypeButton, mapType === 'satellite' && styles.mapTypeButtonActive]}
              onPress={() => setMapType('satellite')}
            >
              <ThemedText style={styles.mapTypeButtonText}>Satellite</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapTypeButton, mapType === 'hybrid' && styles.mapTypeButtonActive]}
              onPress={() => setMapType('hybrid')}
            >
              <ThemedText style={styles.mapTypeButtonText}>Hybrid</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Floating Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-garage-sale')}
          >
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>
            {errorMsg || 'Loading map...'}
          </ThemedText>
        </ThemedView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0066FF',
    borderRadius: 8,
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTypeControls: {
    position: 'absolute',
    top: 140,
    right: 20,
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  mapTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minWidth: 90,
  },
  mapTypeButtonActive: {
    backgroundColor: '#0066FF',
  },
  mapTypeButtonText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  calloutContainer: {
    minWidth: 280,
    maxWidth: 320,
  },
  calloutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutVideo: {
    width: '100%',
    height: 160,
    backgroundColor: '#000',
  },
  calloutContent: {
    padding: 12,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  calloutIcon: {
    fontSize: 14,
    marginRight: 6,
    width: 20,
  },
  calloutText: {
    fontSize: 12,
    flex: 1,
    color: '#333',
  },
  calloutActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
});
