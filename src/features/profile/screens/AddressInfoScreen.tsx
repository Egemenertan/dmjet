/**
 * Address Info Screen
 * Kullanıcının adres bilgilerini yönettiği sayfa
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {NavArrowLeft, Pin, Edit} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useAuthStore} from '@store/slices/authStore';
import {supabase} from '@core/services/supabase';
import {useTranslation} from '@localization';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  addressDetails?: string;
}

export const AddressInfoScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, profile} = useAuthStore();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserLocation();
    }
  }, [user?.id]);

  const fetchUserLocation = async () => {
    if (!user?.id) {
      setLoadingLocation(false);
      return;
    }

    try {
      setLoadingLocation(true);

      const {data, error} = await supabase
        .from('profiles')
        .select('location_lat, location_lng, address, address_details')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Konum yüklenemedi:', error);
        setLoadingLocation(false);
        return;
      }

      if (data) {
        if (data.location_lat && data.location_lng) {
          setUserLocation({
            latitude: data.location_lat,
            longitude: data.location_lng,
            address: data.address || undefined,
            addressDetails: data.address_details || undefined,
          });
        } else if (data.address) {
          setUserLocation({
            latitude: 0,
            longitude: 0,
            address: data.address,
            addressDetails: data.address_details || undefined,
          });
        } else {
          setUserLocation(null);
        }
      }
    } catch (error) {
      console.error('Konum yüklenemedi:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectLocation = () => {
    (navigation as any).navigate('MapSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.addresses')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Delivery Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.deliveryLocation')}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleSelectLocation}>
              <Pin width={16} height={16} color="#fff" strokeWidth={2} />
              <Text style={styles.editButtonText}>
                {userLocation ? t('common.edit') : t('profile.addLocation')}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : userLocation ? (
            <TouchableOpacity
              style={styles.locationCard}
              onPress={handleSelectLocation}
              activeOpacity={0.8}>
              {/* Map Preview */}
              {userLocation.latitude !== 0 && userLocation.longitude !== 0 && (
                <View style={styles.mapContainer}>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    pointerEvents="none"
                    loadingEnabled={true}
                    loadingIndicatorColor={colors.primary}
                    loadingBackgroundColor={colors.background}>
                    <Marker
                      coordinate={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                      }}
                      pinColor={colors.primary}
                    />
                  </MapView>
                </View>
              )}

              {/* Address Info */}
              <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                  <Pin
                    width={20}
                    height={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.addressLabel}>{t('profile.address')}</Text>
                </View>
                <Text style={styles.addressText} numberOfLines={3}>
                  {userLocation.address ||
                    `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(
                      6
                    )}`}
                </Text>

                {/* Address Details */}
                {userLocation.addressDetails && (
                  <View style={styles.addressDetailsContainer}>
                    <Text style={styles.addressDetailsLabel}>
                      {t('profile.addressDescription')}:
                    </Text>
                    <Text style={styles.addressDetailsText} numberOfLines={4}>
                      {userLocation.addressDetails}
                    </Text>
                  </View>
                )}

                {/* Edit Indicator */}
                <View style={styles.editIndicator}>
                  <Edit
                    width={16}
                    height={16}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.editIndicatorText}>
                    Düzenlemek için dokunun
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={handleSelectLocation}>
              <View style={styles.emptyIconContainer}>
                <Pin width={48} height={48} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('profile.addDeliveryLocation')}
              </Text>
              <Text style={styles.emptyText}>
                {t('profile.addDeliveryLocationText')}
              </Text>
              <View style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Konum Ekle</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContainer: {
    height: 200,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  addressInfo: {
    padding: spacing.lg,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  addressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  addressText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
  },
  addressDetailsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressDetailsLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  addressDetailsText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editIndicatorText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
});

