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
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPredictions([]);
      setShowModal(false);
      return;
    }

    setIsLoading(true);

    try {
      const apiKey = env.googleMaps.apiKey;
      
      // Kuzey Kıbrıs merkezi ve sınırları ile arama
      const location = `${NORTH_CYPRUS_CENTER.latitude},${NORTH_CYPRUS_CENTER.longitude}`;
      const radius = 60000; // 60km radius (daha geniş)
      
      // Gazimağusa ve İskele için özel arama terimleri
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
      
      const autocompleteUrl =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(enhancedQuery)}&` +
        `key=${apiKey}&` +
        `location=${location}&` +
        `radius=${radius}&` +
        `components=country:cy&` +
        `language=tr`;

      console.log('🔍 Enhanced search for:', enhancedQuery);

      const response = await fetch(autocompleteUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        // Daha geniş filtreleme - Kuzey Kıbrıs'taki her şeyi dahil et
        const filtered = data.predictions.filter((pred: PlaceResult) => {
          const text = pred.description.toLowerCase();
          // Güney Kıbrıs şehirlerini hariç tut
          const isSouthCyprus = 
            text.includes('limassol') ||
            text.includes('larnaca') ||
            text.includes('paphos') ||
            text.includes('ayia napa') ||
            text.includes('protaras');
            
          if (isSouthCyprus) return false;
          
          // Kuzey Kıbrıs şehirleri ve genel Cyprus içeren her şey
          return (
            text.includes('cyprus') ||
            text.includes('kıbrıs') ||
            text.includes('lefkoşa') ||
            text.includes('nicosia') ||
            text.includes('girne') ||
            text.includes('kyrenia') ||
            text.includes('gazimağusa') ||
            text.includes('famagusta') ||
            text.includes('magosa') ||
            text.includes('güzelyurt') ||
            text.includes('morphou') ||
            text.includes('iskele') ||
            text.includes('İskele') ||
            text.includes('trikomo') ||
            text.includes('dipkarpaz') ||
            text.includes('karpaz') ||
            text.includes('yeni erenköy') ||
            text.includes('bafra') ||
            text.includes('lapta') ||
            text.includes('alsancak') ||
            text.includes('çatalköy') ||
            text.includes('karaoğlanoğlu')
          );
        });

        // Daha fazla sonuç göster (10 yerine 8)
        setPredictions(filtered.slice(0, 10));
        setShowModal(filtered.length > 0);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
        setShowModal(false);
      } else {
        console.error('Places API error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Place Details API
  const getPlaceDetails = async (placeId: string, description: string) => {
    try {
      setIsLoading(true);
      const apiKey = env.googleMaps.apiKey;

      const detailsUrl =
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&` +
        `key=${apiKey}&` +
        `fields=geometry,formatted_address,address_components&` +
        `language=tr`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

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

        console.log('📍 Selected location:', locationData);
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
    marginBottom: spacing.md,
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
    top: 58, // Just below the input (50px height + 8px margin)
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 300,
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

