/**
 * Map Selection Screen
 * Professional Google Maps integration for location selection
 * Features:
 * - User location detection
 * - Fixed center pin
 * - Search bar for North Cyprus addresses
 * - Save location functionality
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Region, PROVIDER_GOOGLE, Polygon} from 'react-native-maps';
import * as Location from 'expo-location';
import {useNavigation} from '@react-navigation/native';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {Button} from '@shared/ui';
import {useAuthStore} from '@store/slices/authStore';
import {supabase} from '@core/services/supabase';
import {profileService} from '../services/profileService';
import {AddressSearchInput} from '@shared/components/AddressSearchInput';
import {NavArrowDown} from 'iconoir-react-native';
import {useTranslation} from '@localization';
import {CountryCodePicker} from '@shared/components/CountryCodePicker';
import {
  DELIVERY_AREA_POLYGON,
  isInDeliveryArea,
  getDeliveryAreaRegion,
  Coordinate,
} from '@core/utils/polygon';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
}

// Kuzey Kıbrıs sınırları
const NORTH_CYPRUS_BOUNDS = {
  minLat: 35.0,
  maxLat: 35.7,
  minLng: 32.5,
  maxLng: 34.6,
};

// Kuzey Kıbrıs merkez koordinatları
const NORTH_CYPRUS_CENTER = {
  latitude: 35.185566,
  longitude: 33.382276,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

// Teslimat alanı merkez koordinatları
const DELIVERY_AREA_CENTER = getDeliveryAreaRegion();

export const MapSelectionScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, isAuthenticated, profile, setProfile} = useAuthStore();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(DELIVERY_AREA_CENTER);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [addressDetails, setAddressDetails] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [userHasPhone, setUserHasPhone] = useState(false);
  const [isLocationInDeliveryArea, setIsLocationInDeliveryArea] = useState<boolean | null>(null); // null = henüz kontrol edilmedi
  const [isMapReady, setIsMapReady] = useState(false); // Harita hazır mı kontrolü
  const isInitialLoadRef = useRef(true); // İlk yükleme kontrolü

  // Profile'dan telefon bilgisini yükle
  useEffect(() => {
    if (profile?.phone) {
      // Debug log silindi - production'da gereksiz
      setPhoneNumber(profile.phone);
      setCountryCode(profile.country_code || '+90');
      setUserHasPhone(true);
    } else {
      // Debug log silindi - production'da gereksiz
      setPhoneNumber('');
      setCountryCode('+90');
      setUserHasPhone(false);
    }
  }, [profile]);

  // Kullanıcının kayıtlı konumunu yükle ve ardından GPS konumunu al
  useEffect(() => {
    let mounted = true;
    
    const initializeLocation = async () => {
      try {
        // Debug logları silindi - production'da gereksiz
        
        if (isAuthenticated && user?.id) {
          await loadSavedLocation();
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
        
        // Kayıtlı konum yüklendikten sonra GPS konumunu otomatik al
        if (mounted) {
          await getCurrentLocation(false);
        }
      } catch (error: any) {
        console.error('❌ MapSelectionScreen initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeLocation();
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Kayıtlı konumu yükle (hızlı)
  const loadSavedLocation = async () => {
    try {
      if (!user?.id) {
        return false; // Kayıtlı konum yok
      }

      // Kullanıcının kayıtlı konumunu al
      const {data, error} = await supabase
        .from('profiles')
        .select('location_lat, location_lng, address, address_details')
        .eq('id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows found, this is expected for new users or RLS not ready yet
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Profil henüz yüklenmedi (RLS hazır değil veya profil oluşturulmamış)');
        } else {
          console.error('❌ Profil yükleme hatası:', error);
        }
        return false; // Kayıtlı konum yok
      }

      if (data) {
        // Kayıtlı konum varsa onu kullan
        if (data.location_lat && data.location_lng) {
          const savedLocation = {
            latitude: data.location_lat,
            longitude: data.location_lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(savedLocation);
          const locationData = {
            latitude: data.location_lat,
            longitude: data.location_lng,
            address: data.address || undefined,
          };
          setSelectedLocation(locationData);
          setSearchQuery(data.address || '');
          setAddressDetails(data.address_details || '');
          
          // Kayıtlı konum için hizmet alanı kontrolü - harita hazır olduktan sonra
          const checkDeliveryArea = () => {
            if (isMapReady && !isInitialLoadRef.current) {
              const inDeliveryArea = isInDeliveryArea(locationData);
              setIsLocationInDeliveryArea(inDeliveryArea);
            } else {
              // Harita henüz hazır değilse tekrar dene
              setTimeout(checkDeliveryArea, 200);
            }
          };
          setTimeout(checkDeliveryArea, 500);
          
          return true; // Kayıtlı konum var
        } else {
          // Konum yoksa GPS konumu alınacak
          // Debug log silindi - production'da gereksiz
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Kayıtlı konum yüklenemedi:', error);
      return false;
    }
  };

  const getCurrentLocation = async (isManual = false) => {
    if (isManual) {
      setGettingLocation(true);
    }

    try {
      // Debug log silindi - production'da gereksiz
      
      // Konum izni iste
      const {status} = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('❌ Location permission denied');
        if (isManual) {
          Alert.alert(
            'Konum İzni Gerekli',
            'Konumunuzu kullanabilmek için konum iznine ihtiyacımız var.',
            [
              {text: 'Tamam', onPress: () => {
                setLoading(false);
                setGettingLocation(false);
              }},
            ]
          );
        } else {
          // Otomatik çağrıda sessizce geç
          // Debug log silindi - production'da gereksiz
          setLoading(false);
        }
        return;
      }

      // Mevcut konumu al - Balanced accuracy ve timeout ile daha hızlı
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // High yerine Balanced - daha hızlı
        timeInterval: 5000, // 5 saniye timeout
        distanceInterval: 0,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Kuzey Kıbrıs sınırları içinde mi kontrol et
      const isInNorthCyprus = 
        location.coords.latitude >= NORTH_CYPRUS_BOUNDS.minLat &&
        location.coords.latitude <= NORTH_CYPRUS_BOUNDS.maxLat &&
        location.coords.longitude >= NORTH_CYPRUS_BOUNDS.minLng &&
        location.coords.longitude <= NORTH_CYPRUS_BOUNDS.maxLng;

      if (isInNorthCyprus) {
        setRegion(userLocation);
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setSelectedLocation(locationData);

        // Manuel kullanımda haritayı animate et
        if (isManual && mapRef.current) {
          mapRef.current.animateToRegion(userLocation, 1000);
        }
        
        // GPS konumu için hizmet alanı kontrolü - harita hazır olduktan sonra
        const checkDeliveryArea = () => {
          if (isMapReady && !isInitialLoadRef.current) {
            const inDeliveryArea = isInDeliveryArea(locationData);
            setIsLocationInDeliveryArea(inDeliveryArea);
          } else {
            // Harita henüz hazır değilse tekrar dene
            setTimeout(checkDeliveryArea, 200);
          }
        };
        setTimeout(checkDeliveryArea, isManual ? 1100 : 500);
        
        // Debug log silindi - production'da gereksiz
      } else {
        // Kuzey Kıbrıs dışındaysa merkez konumu göster
        if (isManual) {
          Alert.alert(
            'Konum Bilgisi',
            'Şu anda Kuzey Kıbrıs dışındasınız. Harita Kuzey Kıbrıs merkezinde açılacak.',
            [{text: 'Tamam'}]
          );
        } else {
          // Debug log silindi - production'da gereksiz
        }
      }
    } catch (error) {
      console.error('Konum alınamadı:', error);
      if (isManual) {
        Alert.alert('Hata', 'Konumunuz alınamadı. Lütfen tekrar deneyin.');
      } else {
        // Debug log silindi - production'da gereksiz
      }
    } finally {
      setLoading(false);
      setGettingLocation(false);
    }
  };

  // Harita hazır olduğunda
  const handleMapReady = () => {
    setIsMapReady(true);
    // Harita hazır olduktan sonra kısa bir gecikme ile ilk kontrolü yap
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 500);
  };

  // Harita hareket ettiğinde merkez konumu güncelle
  const handleRegionChangeComplete = (newRegion: Region) => {
    // İlk yükleme sırasında veya harita hazır değilse kontrolü atla
    if (isInitialLoadRef.current || !isMapReady) {
      setRegion(newRegion);
      return;
    }

    setRegion(newRegion);
    const newLocation = {
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    };
    
    // Teslimat alanı kontrolü - debounce ile gecikme ekle
    setTimeout(() => {
      const inDeliveryArea = isInDeliveryArea(newLocation);
      // Debug log silindi - production'da gereksiz
      setIsLocationInDeliveryArea(inDeliveryArea);
    }, 300); // 300ms gecikme ile kontrol et
    
    setSelectedLocation(newLocation);
  };

  // Adres seçildiğinde
  const handleLocationSelect = (location: LocationData) => {
    // Debug log silindi - production'da gereksiz
    
    const newRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setSelectedLocation(location);
    setSearchQuery(location.address || '');

    // Haritayı seçilen konuma taşı
    mapRef.current?.animateToRegion(newRegion, 500);
    
    // Teslimat alanı kontrolü - harita animasyonu bittikten sonra
    const checkDeliveryArea = () => {
      if (isMapReady && !isInitialLoadRef.current) {
        const inDeliveryArea = isInDeliveryArea(location);
        setIsLocationInDeliveryArea(inDeliveryArea);
      } else {
        // Harita henüz hazır değilse tekrar dene
        setTimeout(checkDeliveryArea, 200);
      }
    };
    setTimeout(checkDeliveryArea, 600); // Animasyon süresi + 100ms
  };

  // Konum onaylama
  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert(t('checkout.error'), 'Lütfen bir konum seçin.');
      return;
    }
    setLocationConfirmed(true);
  };

  // Konumu kaydet
  const handleSaveLocation = async () => {
    if (!selectedLocation || !user) {
      Alert.alert(t('checkout.error'), 'Lütfen bir konum seçin.');
      return;
    }

    // Telefon kontrolü - her zaman zorunlu
    if (!phoneNumber.trim()) {
      Alert.alert(t('checkout.error'), t('checkout.phoneRequired'));
      return;
    }

    setSaving(true);
    try {
      // Reverse geocoding ile adres al
      let address = selectedLocation.address;
      if (!address) {
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const addr = reverseGeocode[0];
            // Null check'ler ekleyerek güvenli adres oluştur
            const addressParts = [
              addr.street,
              addr.district,
              addr.city,
              addr.country,
            ].filter(Boolean);
            
            if (addressParts.length > 0) {
              address = addressParts.join(', ');
            } else {
              // Eğer hiç adres bilgisi yoksa koordinat kullan
              address = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
            }
          } else {
            // Reverse geocoding sonuç vermezse koordinat kullan
            address = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
          }
        } catch (reverseGeocodeError: any) {
          // Reverse geocoding hatası durumunda koordinat kullan
          console.warn('Reverse geocoding hatası:', reverseGeocodeError);
          address = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
        }
      }

      // Supabase'e kaydet
      const updateData: any = {
        location_lat: selectedLocation.latitude,
        location_lng: selectedLocation.longitude,
        address: address || 'Konum seçildi',
        address_details: addressDetails.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Telefon bilgisini her zaman güncelle (eğer değişmişse)
      if (phoneNumber.trim()) {
        // Telefon numarasını temizle - sadece rakamları al
        const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
        updateData.phone = cleanPhone;
        updateData.country_code = countryCode;
        
        // Debug log silindi - production'da gereksiz
      }

      const {error} = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Debug log silindi - production'da gereksiz

      // AuthStore'u güncelle
      try {
        const updatedProfile = await profileService.getProfile(user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
          // Debug log silindi - production'da gereksiz
        }
      } catch (error) {
        console.error('❌ Error refreshing profile in auth store:', error);
      }

      Alert.alert(
        '✅ Başarılı',
        t('checkout.locationSaved'),
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Profile sayfasına geri dön
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Konum kaydetme hatası:', error);
      Alert.alert(
        t('checkout.error'), 
        error.message || t('checkout.locationSaveError'),
        [
          {text: 'Tamam'}
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konum Seç</Text>
        <View style={styles.backButton} />
      </View>

      {/* Giriş Yapmamış Kullanıcı İçin Uyarı */}
      {!isAuthenticated && (
        <View style={styles.authRequiredContainer}>
          <View style={styles.authRequiredCard}>
            <Text style={styles.authRequiredIcon}>🔐</Text>
            <Text style={styles.authRequiredTitle}>Giriş Gerekli</Text>
            <Text style={styles.authRequiredText}>
              Adres seçmek ve kaydetmek için giriş yapmanız gerekmektedir.
            </Text>
            <TouchableOpacity
              style={styles.authRequiredButton}
              onPress={() => {
                // Auth sayfasına yönlendir ve geri döndüğünde checkout'a git
                navigation.navigate('Auth' as never, {
                  screen: 'Login',
                  params: { returnTo: 'Checkout' }
                } as never);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.authRequiredButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isAuthenticated && (
        <>
        {!locationConfirmed ? (
          <>
            {/* Search Bar - Google Places Autocomplete */}
            <View style={styles.searchContainer}>
              <AddressSearchInput
                onLocationSelect={handleLocationSelect}
                placeholder="Adres ara (örn: Lefkoşa, Girne, Gazimağusa...)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              
              {/* Konumumu Bul Butonu */}
              <TouchableOpacity
                style={styles.myLocationButton}
                onPress={() => getCurrentLocation(true)}
                disabled={gettingLocation}
                activeOpacity={0.7}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <NavArrowDown
                    width={20}
                    height={20}
                    color={colors.primary}
                    style={styles.locationIcon}
                  />
                )}
                <Text style={styles.myLocationText}>
                  {gettingLocation ? 'Konum alınıyor...' : 'Konumumu Bul'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Konum alınıyor...</Text>
                </View>
              ) : (
                <>
                  <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={region}
                    onMapReady={handleMapReady}
                    onRegionChangeComplete={handleRegionChangeComplete}
                    mapType="standard"
                    showsUserLocation
                    showsMyLocationButton
                    showsCompass
                    toolbarEnabled={false}
                    loadingEnabled={true}
                    loadingIndicatorColor={colors.primary}
                    loadingBackgroundColor={colors.background}
                  >
                    {/* Teslimat Alanı Polygon */}
                    <Polygon
                      coordinates={DELIVERY_AREA_POLYGON}
                      fillColor="rgba(0, 122, 255, 0.15)"
                      strokeColor="rgba(0, 122, 255, 0.8)"
                      strokeWidth={2}
                    />
                  </MapView>
                  
                  {/* Fixed Center Pin - Google Maps Tarzı */}
                  <View style={styles.centerMarker} pointerEvents="none">
                    <View style={styles.googlePin}>
                      <View style={styles.googlePinHead}>
                        <View style={styles.googlePinDot} />
                      </View>
                      <View style={styles.googlePinTail} />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Address Display */}
            {selectedLocation && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Seçili Konum:</Text>
                <Text style={styles.addressText}>
                  {selectedLocation.address || 
                    `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                </Text>
              </View>
            )}

            {/* Teslimat Alanı Uyarısı - sadece kontrol tamamlandığında göster */}
            {isAuthenticated && selectedLocation && isLocationInDeliveryArea === false && (
              <View style={styles.deliveryWarningContainer}>
                <Text style={styles.deliveryWarningTitle}>⚠️ Teslimat Alanı Dışında</Text>
                <Text style={styles.deliveryWarningText}>
                  Seçtiğiniz konum teslimat alanımız dışında kalmaktadır. Lütfen mavi alan içerisinden bir konum seçiniz.
                </Text>
              </View>
            )}

            {/* Confirm Location Button */}
            {isAuthenticated && (
              <View style={styles.bottomContainer}>
                <Button
                  title={t('checkout.confirmLocation')}
                  onPress={handleConfirmLocation}
                  disabled={!selectedLocation || isLocationInDeliveryArea === false}
                  fullWidth
                  rounded
                  size="lg"
                />
              </View>
            )}
          </>
        ) : (
          <>
            {/* Location Details Form */}
            <KeyboardAvoidingView 
              style={styles.detailsContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView 
                style={styles.detailsScroll}
                contentContainerStyle={styles.detailsContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Selected Location Display */}
                <View style={styles.selectedLocationCard}>
                  <Text style={styles.selectedLocationLabel}>📍 {t('checkout.selectedLocation')}</Text>
                  <Text style={styles.selectedLocationText}>
                    {selectedLocation?.address || 
                      `${selectedLocation?.latitude.toFixed(6)}, ${selectedLocation?.longitude.toFixed(6)}`}
                  </Text>
                </View>

                {/* Address Details TextArea */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('checkout.addressDetails')}</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder={t('checkout.addressDetailsPlaceholder')}
                    placeholderTextColor={colors.text.secondary}
                    value={addressDetails}
                    onChangeText={setAddressDetails}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Phone Number Input - Always show, prefilled if user has phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('checkout.phoneNumber')} <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.phoneInputContainer}>
                    <CountryCodePicker
                      selectedCode={countryCode}
                      onSelect={(code) => {
                        // Debug log silindi - production'da gereksiz
                        setCountryCode(code);
                      }}
                      disabled={saving}
                    />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder={t('checkout.phoneNumberPlaceholder')}
                      placeholderTextColor={colors.text.secondary}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Text style={styles.helperText}>
                    {userHasPhone ? t('checkout.phoneCanUpdate') : t('checkout.phoneRequired')}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.backToMapButton}
                    onPress={() => setLocationConfirmed(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backToMapButtonText}>← Konumu Değiştir</Text>
                  </TouchableOpacity>

                  <Button
                    title="Kaydet"
                    onPress={handleSaveLocation}
                    disabled={saving || !phoneNumber.trim()}
                    loading={saving}
                    fullWidth
                    rounded
                    size="lg"
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </>
        )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2, // Modal için ekstra alan bırak
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1000, // Modal'ın görünmesi için z-index ekle
  },
  myLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  locationIcon: {
    marginRight: spacing.xs,
  },
  myLocationText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchLoader: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg + 12,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -25, // Pin'i merkeze hizala
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Yuvarlak Pin Styles
  googlePin: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 50,
  },
  googlePinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  googlePinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  googlePinTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -3,
  },
  addressContainer: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  bottomContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  authRequiredCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl * 2,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  authRequiredIcon: {
    fontSize: 72,
    marginBottom: spacing.lg,
  },
  authRequiredTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  authRequiredText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  authRequiredButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2.5,
    paddingVertical: spacing.md + 4,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  authRequiredButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  selectedLocationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedLocationLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  selectedLocationText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 100,
    maxHeight: 150,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.text.primary,
    height: 48,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  backToMapButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backToMapButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  deliveryWarningContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  deliveryWarningTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#856404',
    marginBottom: spacing.xs,
  },
  deliveryWarningText: {
    fontSize: fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
});

