/**
 * Address Search Input Component
 * Google Places Autocomplete for North Cyprus
 * Professional dropdown search with enhanced Gazimağusa & İskele support
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import {Search, Xmark, Pin, Building} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {env} from '@core/config/env';
import {isInDeliveryArea} from '@core/utils/polygon';
import {supabase} from '@core/services/supabase';

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  district?: string;
}

interface AddressSearchInputProps {
  onLocationSelect: (location: LocationData) => void;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

// Kuzey Kıbrıs sınırları
const NORTH_CYPRUS_BOUNDS = {
  minLat: 35.0,
  maxLat: 35.7,
  minLng: 32.5,
  maxLng: 34.6,
};

const NORTH_CYPRUS_CENTER = {
  latitude: 35.185566,
  longitude: 33.382276,
};

export const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  onLocationSelect,
  placeholder = 'Adres ara...',
  value,
  onChangeText,
}) => {
  const [searchText, setSearchText] = useState(value || '');
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSearchText(value);
    }
  }, [value]);

  // Enhanced Google Places Autocomplete API with better Gazimağusa & İskele support
  // Supabase Edge Function üzerinden güvenli API çağrısı
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPredictions([]);
      setShowModal(false);
      return;
    }

    setIsLoading(true);

    try {
      // Kuzey Kıbrıs merkezi ve sınırları ile arama
      const location = `${NORTH_CYPRUS_CENTER.latitude},${NORTH_CYPRUS_CENTER.longitude}`;
      const radius = 80000; // 80km radius - tüm Kuzey Kıbrıs'ı kapsayacak şekilde genişletildi
      
      // Sadece özel şehir isimleri için alternatif ekle, genel aramalar için hiçbir şey ekleme
      let enhancedQuery = query;
      const lowerQuery = query.toLowerCase();
      
      // Gazimağusa alternatifleri
      if (lowerQuery.includes('gazi') || lowerQuery.includes('mağusa') || lowerQuery.includes('magosa')) {
        enhancedQuery = query + ' Famagusta Cyprus';
      }
      // İskele alternatifleri
      else if (lowerQuery.includes('iskele') || lowerQuery.includes('İskele') || lowerQuery.includes('trikomo')) {
        enhancedQuery = query + ' Trikomo Cyprus';
      }
      // Girne alternatifleri
      else if (lowerQuery.includes('girne') || lowerQuery.includes('kyrenia')) {
        enhancedQuery = query + ' Kyrenia Cyprus';
      }
      // Lefkoşa alternatifleri
      else if (lowerQuery.includes('lefkoşa') || lowerQuery.includes('nicosia')) {
        enhancedQuery = query + ' Nicosia Cyprus';
      }
      // Güzelyurt alternatifleri
      else if (lowerQuery.includes('güzelyurt') || lowerQuery.includes('morphou')) {
        enhancedQuery = query + ' Morphou Cyprus';
      }
      // Genel aramalar için hiçbir şey ekleme - kullanıcının yazdığı gibi ara

      console.log('🔍 Arama yapılıyor (Edge Function):', enhancedQuery);
      
      // Supabase Edge Function üzerinden Google Places API'yi çağır
      const { data, error } = await supabase.functions.invoke('google-places-proxy', {
        body: {
          input: enhancedQuery,
          location,
          radius,
          language: 'tr',
        },
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        setPredictions([]);
        setShowModal(false);
        return;
      }

      console.log('📍 API Yanıtı (Edge Function):', data.status, 'Sonuç sayısı:', data.predictions?.length || 0);

      if (data.status === 'OK' && data.predictions) {
        // Sadece Güney Kıbrıs şehirlerini hariç tut, diğer her şeyi göster
        const filtered = data.predictions.filter((pred: PlaceResult) => {
          const text = pred.description.toLowerCase();
          
          // Güney Kıbrıs şehirlerini hariç tut
          const isSouthCyprus = 
            text.includes('limassol') ||
            text.includes('larnaca') ||
            text.includes('larnaka') ||
            text.includes('paphos') ||
            text.includes('pafos') ||
            text.includes('ayia napa') ||
            text.includes('protaras') ||
            text.includes('polis') ||
            text.includes('paralimni');
            
          if (isSouthCyprus) {
            console.log('❌ Güney Kıbrıs hariç tutuldu:', pred.description);
            return false;
          }
          
          // Güney Kıbrıs değilse, tüm sonuçları göster (Cyprus kelimesi olmasa bile)
          console.log('✅ Sonuç dahil edildi:', pred.description);
          return true;
        });

        console.log('📋 Filtrelenmiş sonuç sayısı:', filtered.length);
        
        // Daha fazla sonuç göster (15'e kadar)
        setPredictions(filtered.slice(0, 15));
        setShowModal(filtered.length > 0);
        
        if (filtered.length === 0) {
          console.warn('⚠️ Filtreleme sonrası sonuç kalmadı');
        }
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('⚠️ Sonuç bulunamadı');
        setPredictions([]);
        setShowModal(false);
      } else {
        console.error('❌ Places API error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Place Details API - Supabase Edge Function üzerinden
  const getPlaceDetails = async (placeId: string, description: string) => {
    try {
      setIsLoading(true);

      console.log('🔍 Place Details alınıyor (Edge Function):', placeId);

      // Supabase Edge Function üzerinden Google Place Details API'yi çağır
      const { data, error } = await supabase.functions.invoke('google-places-proxy', {
        body: {
          placeId,
          language: 'tr',
        },
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const location = result.geometry.location;

        // Kuzey Kıbrıs sınırları içinde mi kontrol et
        if (
          location.lat < NORTH_CYPRUS_BOUNDS.minLat ||
          location.lat > NORTH_CYPRUS_BOUNDS.maxLat ||
          location.lng < NORTH_CYPRUS_BOUNDS.minLng ||
          location.lng > NORTH_CYPRUS_BOUNDS.maxLng
        ) {
          console.warn('Location outside North Cyprus bounds');
          return;
        }

        // Teslimat alanı kontrolü
        const coordinate = { latitude: location.lat, longitude: location.lng };
        if (!isInDeliveryArea(coordinate)) {
          console.warn('Location outside delivery area');
          // Teslimat alanı dışında olsa bile sonucu göster, ama uyarı ile
          // return; // Bu satırı kaldırıyoruz ki kullanıcı görebilsin
        }

        // Şehir ve ilçe bilgilerini parse et
        let city = '';
        let district = '';

        if (result.address_components) {
          result.address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
              if (!city) city = component.long_name;
            }
            if (component.types.includes('sublocality')) {
              district = component.long_name;
            }
          });
        }

        // Koordinatlara göre şehir tespiti (fallback)
        if (!city || city === 'Cyprus') {
          if (location.lat >= 35.3 && location.lng >= 33.1 && location.lng <= 33.5) {
            city = 'Girne';
          } else if (location.lat >= 35.25 && location.lng >= 33.5 && location.lng <= 33.9) {
            city = 'İskele';
          } else if (location.lat >= 35.0 && location.lng >= 33.8 && location.lng <= 34.1) {
            city = 'Gazimağusa';
          } else if (location.lat >= 35.15 && location.lng >= 32.9 && location.lng <= 33.2) {
            city = 'Güzelyurt';
          } else {
            city = 'Lefkoşa';
          }
        }

        const locationData: LocationData = {
          latitude: location.lat,
          longitude: location.lng,
          address: result.formatted_address || description,
          city,
          district,
        };

        onLocationSelect(locationData);
        setShowModal(false);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Place details error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    onChangeText?.(text);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handleSuggestionPress = (prediction: PlaceResult) => {
    setSearchText(prediction.description);
    onChangeText?.(prediction.description);
    getPlaceDetails(prediction.place_id, prediction.description);
  };

  const clearSearch = () => {
    setSearchText('');
    onChangeText?.('');
    setPredictions([]);
    setShowModal(false);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Search
          width={20}
          height={20}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowModal(true);
            }
          }}
        />
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : searchText.length > 0 ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Xmark
              width={18}
              height={18}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dropdown Suggestions - Below Search Bar */}
      {showModal && predictions.length > 0 && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {predictions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                style={[
                  styles.suggestionItem,
                  index === predictions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIconContainer}>
                  {item.structured_formatting.main_text.length < 20 ? (
                    <Pin
                      width={20}
                      height={20}
                      color={colors.primary}
                    />
                  ) : (
                    <Building
                      width={20}
                      height={20}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  {item.structured_formatting.secondary_text && (
                    <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 0, // Modal için alan bırakmak üzere margin kaldırıldı
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  loader: {
    marginLeft: spacing.sm,
  },
  // Dropdown Styles (below search bar)
  dropdownContainer: {
    position: 'absolute',
    top: 56, // Input'un hemen altında (50px height + 6px gap)
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 320, // Daha fazla sonuç için yükseklik artırıldı
    zIndex: 9999, // Çok yüksek z-index ile her şeyin üstünde görünmesini sağla
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 16, // Android'de daha yüksek elevation
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 320,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    backgroundColor: '#fff',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

