/**
 * Profile Screen
 * User profile and settings with location management
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, TextInput, Image, ImageBackground, ScrollView, Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {
  NavArrowLeft,
  User,
  Mail,
  Phone,
  Pin,
  Settings,
  LogOut,
  Edit,
  CreditCard,
  Camera,
  Language,
} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button, Input} from '@shared/ui';
import {authService} from '@features/auth/services/authService';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation, i18n, saveLanguage} from '@localization';
import {supabase} from '@core/services/supabase';
import {profileService} from '../services/profileService';
import {useTabNavigation} from '@core/navigation/TabContext';
import {EditProfileModal} from '../components/EditProfileModal';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  addressDetails?: string;
}

export const ProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, isAuthenticated, profile, setProfile} = useAuthStore();
  const {setActiveTab} = useTabNavigation();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [aileKarti, setAileKarti] = useState<string>('');
  const [isEditingFamilyCard, setIsEditingFamilyCard] = useState(false);
  const [savingFamilyCard, setSavingFamilyCard] = useState(false);
  // Profile data artık AuthStore'dan geliyor
  const profileData = {
    full_name: profile?.full_name || null,
    phone: profile?.phone || null,
    country_code: profile?.country_code || '+90',
    avatar_url: profile?.avatar_url || null,
  };
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Modal state tracking removed - not needed in production

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserLocation();
    } else if (!isAuthenticated) {
      // Kullanıcı giriş yapmamışsa loading'i kapat
      setLoadingLocation(false);
    }
  }, [isAuthenticated, user?.id]);

  // Sadece profil güncellendiğinde yeniden yükle (focus değil)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Sadece 30 saniyeden eski veriler için yeniden yükle
      const now = Date.now();
      if (isAuthenticated && user?.id && (now - lastUpdateTime > 30000)) {
        fetchUserLocation();
      }
    });

    return unsubscribe;
  }, [navigation, isAuthenticated, user?.id, lastUpdateTime]);

  const fetchUserLocation = async () => {
    // User kontrolü - user yoksa veya id yoksa işlemi durdur
    if (!user?.id) {
      console.warn('⚠️ fetchUserLocation: User ID bulunamadı');
      setLoadingLocation(false);
      return;
    }

    // Eğer profile zaten varsa ve güncel ise, cache'den kullan
    if (profile && (Date.now() - lastUpdateTime < 30000)) {
      console.log('📋 Cache\'den profil bilgileri kullanılıyor');
      setUserLocation(profile.location_lat && profile.location_lng ? {
        latitude: profile.location_lat,
        longitude: profile.location_lng,
        address: profile.address || undefined,
        addressDetails: profile.address_details || undefined,
      } : null);
      
      setProfileData({
        full_name: profile.full_name,
        phone: profile.phone,
        country_code: profile.country_code || '+90',
        avatar_url: profile.avatar_url,
      });
      
      if (profile.aile_karti) {
        setAileKarti(String(profile.aile_karti));
      }
      
      setLoadingLocation(false);
      return;
    }

    try {
      setLoadingLocation(true);
      console.log('📍 Profil bilgileri yükleniyor...', user.id);
      
      // Önce aile_karti ile dene, yoksa aile_karti olmadan dene
      let data, error;
      
      const result = await supabase
        .from('profiles')
        .select('location_lat, location_lng, address, address_details, aile_karti, full_name, phone, country_code, avatar_url, push_token, push_token_updated_at')
        .eq('id', user.id)
        .single() as { data: any; error: any };
      
      // Eğer aile_karti kolonu yoksa, onsuz dene
      if (result.error?.code === '42703') {
        console.log('ℹ️ aile_karti column not found, trying without it...');
        const fallbackResult = await supabase
          .from('profiles')
          .select('location_lat, location_lng, address, address_details, full_name, phone, country_code, avatar_url')
          .eq('id', user?.id)
          .single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      } else {
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Profil yükleme hatası:', error);
        // Hata olsa bile loading'i kapat
        setLoadingLocation(false);
        return;
      }

      // Konum bilgisi varsa yükle (lat/lng veya sadece adres)
      if (data) {
        if (data.location_lat && data.location_lng) {
          setUserLocation({
            latitude: data.location_lat,
            longitude: data.location_lng,
            address: data.address || undefined,
            addressDetails: data.address_details || undefined,
          });
        } else if (data.address) {
          // Sadece adres varsa, koordinat olmadan da göster
          setUserLocation({
            latitude: 0,
            longitude: 0,
            address: data.address,
            addressDetails: data.address_details || undefined,
          });
        } else {
          // Konum bilgisi yoksa null olarak bırak
          setUserLocation(null);
        }

        // Aile kartı bilgisini yükle (varsa)
        if ('aile_karti' in data && data.aile_karti) {
          setAileKarti(String(data.aile_karti));
        }

        // Profil bilgileri artık AuthStore'dan geliyor

        // AuthStore'u da güncelle (cache için)
        setProfile({
          id: user.id,
          email: user.email,
          full_name: data.full_name,
          phone: data.phone,
          country_code: data.country_code,
          address: data.address,
          address_details: data.address_details,
          aile_karti: data.aile_karti,
          location_lat: data.location_lat,
          location_lng: data.location_lng,
          avatar_url: data.avatar_url,
          is_admin: profile?.is_admin || false,
          is_active: profile?.is_active || true,
          role: profile?.role || 'user',
          created_at: profile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        // Push token durumunu logla
        if ('push_token' in data) {
          if (data.push_token && typeof data.push_token === 'string') {
            console.log('✅ Push token mevcut:', data.push_token.substring(0, 30) + '...');
            if ('push_token_updated_at' in data) {
              console.log('   Son güncelleme:', data.push_token_updated_at);
            }
          } else {
            console.log('⚠️ Push token YOK - bildirimler çalışmayacak!');
          }
        }
      }
    } catch (error) {
      console.error('Konum yüklenemedi:', error);
    } finally {
      // Her durumda loading'i kapat
      setLoadingLocation(false);
      // Son güncelleme zamanını kaydet
      setLastUpdateTime(Date.now());
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleSelectLocation = () => {
    (navigation as any).navigate('MapSelection');
  };

  const handleSaveFamilyCard = async () => {
    if (!user?.id) return;

    try {
      setSavingFamilyCard(true);
      await profileService.updateFamilyCard(user.id, aileKarti);
      setIsEditingFamilyCard(false);
      
      // Auth store'daki profili güncelle
      try {
        const updatedProfile = await profileService.getProfile(user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      } catch (error) {
        console.error('❌ Error refreshing profile in auth store:', error);
      }
      
      Alert.alert(t('common.done'), t('profile.familyCardSaved'));
    } catch (error: any) {
      console.error('Aile kartı kaydedilemedi:', error);
      Alert.alert(t('common.error'), t('profile.familyCardError'));
    } finally {
      setSavingFamilyCard(false);
    }
  };

  const handleCancelFamilyCard = () => {
    // Önceki değere geri dön
    fetchUserLocation();
    setIsEditingFamilyCard(false);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await saveLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setIsLanguageModalVisible(false);
      Alert.alert(t('common.done'), t('profile.languageChanged'));
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), 'Dil değiştirilemedi');
    }
  };

  const getLanguageName = (code: string): string => {
    switch (code) {
      case 'tr':
        return t('profile.turkish');
      case 'en':
        return t('profile.english');
      case 'ru':
        return t('profile.russian');
      default:
        return code;
    }
  };

  // Kullanıcı giriş yapmamışsa login ekranına yönlendir
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        <View style={styles.notLoggedInWrapper}>
          <View style={styles.notLoggedInContainer}>
            {/* Icon */}
            <View style={styles.notLoggedInIcon}>
              <User
                width={64}
                height={64}
                color={colors.primary}
                strokeWidth={2}
              />
            </View>

            {/* Title */}
            <Text style={styles.notLoggedInTitle}>
              {t('profile.loginToViewProfile')}
            </Text>

            {/* Description */}
            <Text style={styles.notLoggedInText}>
              {t('profile.loginToViewProfileText')}
            </Text>

            {/* Buttons Container */}
            <View style={styles.notLoggedInButtons}>
              <Button
                title={t('auth.login')}
                onPress={() => (navigation as any).navigate('Auth', {
                  screen: 'Login',
                  params: { returnTo: 'MainTabs' }
                })}
                fullWidth
                size="md"
                rounded={true}
              />
              <Button
                title={t('auth.register')}
                variant="outline"
                onPress={() => (navigation as any).navigate('Auth', {
                  screen: 'Register',
                  params: { returnTo: 'MainTabs' }
                })}
                fullWidth
                rounded={true}
                size="md"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Sola dayalı */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab('Home')}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
          
          <View style={styles.personalInfoCard}>
            {/* Profile Picture - Sola dayalı */}
            <View style={styles.profilePictureSection}>
              <View style={styles.profilePictureContainer}>
                {profileData.avatar_url ? (
                  <Image
                    source={{uri: profileData.avatar_url}}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <User
                      width={40}
                      height={40}
                      color="#fff"
                      strokeWidth={2}
                    />
                  </View>
                )}
                {/* Camera Icon Overlay - Temporarily Hidden */}
                {/* <TouchableOpacity style={styles.cameraIconButton}>
                  <Camera
                    width={16}
                    height={16}
                    color="#fff"
                    strokeWidth={2}
                  />
                </TouchableOpacity> */}
              </View>
              <View style={styles.profileTextSection}>
                <Text style={styles.profileName}>
                  {profileData.full_name || t('profile.user')}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>

            {/* User Details - Sola dayalı */}
            <View style={styles.userDetailsSection}>
              {/* Full Name */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <User
                    width={20}
                    height={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('profile.fullName')}</Text>
                  <Text style={styles.infoValue}>
                    {profileData.full_name || t('profile.notSpecified')}
                  </Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Mail
                    width={20}
                    height={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('profile.email')}</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Phone
                    width={20}
                    height={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
                  <Text style={styles.infoValue}>
                    {profileData.phone 
                      ? (() => {
                          // Telefon numarasını temizle ve formatla
                          const cleanPhone = profileData.phone.replace(/\D/g, '');
                          const countryCode = profileData.country_code || '+90';
                          return `${countryCode} ${cleanPhone}`;
                        })()
                      : t('profile.notSpecified')}
                  </Text>
                </View>
              </View>

              {/* Edit Button - Rounded Full */}
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => {
                  console.log('✅ Edit button clicked!');
                  setIsEditModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Edit
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
                <Text style={styles.editProfileButtonText}>{t('profile.editProfile')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Family Card Section - Temporarily Hidden */}
        {/* <View style={styles.section}>
          <View style={styles.familyCardHeader}>
            <Text style={styles.sectionTitle}>{t('profile.familyCard')}</Text>
            {!isEditingFamilyCard && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingFamilyCard(true)}
              >
                <Edit
                  width={16}
                  height={16}
                  color="#fff"
                  strokeWidth={2}
                />
                <Text style={styles.editButtonText}>
                  {aileKarti ? t('common.edit') : t('profile.addLocation')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.familyCardContentWrapper}>
            {isEditingFamilyCard ? (
            <View style={styles.familyCardEditContainer}>
              <ImageBackground
                source={require('../../../../assets/ailecard.png')}
                style={styles.cardImage}
                resizeMode="contain"
              >
                <View style={styles.cardNumberOverlay}>
                  <Text style={styles.cardNumberText}>
                    {aileKarti || '---- ---- ---- ----'}
                  </Text>
                </View>
              </ImageBackground>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t('profile.familyCardNumber')}</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder={t('profile.familyCardPlaceholder')}
                  value={aileKarti}
                  onChangeText={setAileKarti}
                  autoCapitalize="characters"
                  maxLength={20}
                  keyboardType="default"
                  placeholderTextColor={colors.text.secondary + '80'}
                />
              </View>

              <View style={styles.familyCardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelFamilyCard}
                  disabled={savingFamilyCard}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveFamilyCard}
                  disabled={savingFamilyCard}
                >
                  {savingFamilyCard ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.familyCardDisplayContainer}
              onPress={() => setIsEditingFamilyCard(true)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('../../../../assets/ailecard.png')}
                style={styles.cardImageDisplay}
                resizeMode="contain"
              >
                <View style={styles.cardNumberOverlayDisplay}>
                  <Text style={styles.cardNumberTextDisplay}>
                    {aileKarti || '---- ---- ---- ----'}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )}
          </View>
        </View> */}

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionTitle}>{t('profile.deliveryLocation')}</Text>
            <TouchableOpacity
              style={styles.editLocationButton}
              onPress={handleSelectLocation}
            >
              <Pin
                width={16}
                height={16}
                color="#fff"
                strokeWidth={2}
              />
              <Text style={styles.editLocationText}>
                {userLocation ? t('common.edit') : t('profile.addLocation')}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingLocation ? (
            <View style={styles.locationLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : userLocation ? (
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={handleSelectLocation}
              activeOpacity={0.8}
            >
              {/* Mini Map Preview - Sadece koordinatlar varsa göster */}
              {userLocation.latitude !== 0 && userLocation.longitude !== 0 && (
                <View style={styles.mapPreviewContainer}>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.mapPreview}
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
                    loadingBackgroundColor={colors.background}
                    onMapReady={() => console.log('📍 Map yüklendi')}
                  >
                    <Marker
                      coordinate={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                      }}
                      pinColor={colors.primary}
                    />
                  </MapView>
                  {/* Tap to Edit Overlay */}
                  
                </View>
              )}

              {/* Address Info */}
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{t('profile.address')}:</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {userLocation.address || 
                    `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`}
                </Text>
                
                {/* Address Details */}
                {userLocation.addressDetails && (
                  <View style={styles.addressDetailsContainer}>
                    <Text style={styles.addressDetailsLabel}>{t('profile.addressDescription')}:</Text>
                    <Text style={styles.addressDetailsText} numberOfLines={3}>
                      {userLocation.addressDetails}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addLocationCard}
              onPress={handleSelectLocation}
            >
              <Text style={styles.addLocationIcon}>📍</Text>
              <Text style={styles.addLocationTitle}>{t('profile.addDeliveryLocation')}</Text>
              <Text style={styles.addLocationText}>
                {t('profile.addDeliveryLocationText')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <TouchableOpacity 
            style={styles.languageButton} 
            onPress={() => setIsLanguageModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.languageButtonContent}>
              <View style={styles.languageIconContainer}>
                <Language
                  width={20}
                  height={20}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.languageTextContainer}>
                <Text style={styles.languageLabel}>{t('profile.selectLanguage')}</Text>
                <Text style={styles.languageValue}>{getLanguageName(currentLanguage)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Section - Temporarily Hidden */}
        {/* <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <View style={styles.actionButtonContent}>
              <Settings
                width={20}
                height={20}
                color={colors.text.primary}
                strokeWidth={2}
              />
              <Text style={styles.actionButtonText}>{t('profile.settings')}</Text>
            </View>
          </TouchableOpacity>
        </View> */}

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.actionButtonContent}>
              <LogOut
                width={20}
                height={20}
                color="#ef4444"
                strokeWidth={2}
              />
              <Text style={[styles.actionButtonText, styles.logoutText]}>{t('auth.logout')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => {
          console.log('❌ Closing modal');
          setIsEditModalVisible(false);
        }}
        userId={user?.id || ''}
        currentProfile={{
          full_name: profileData.full_name,
          phone: profileData.phone,
          country_code: profileData.country_code,
        }}
        onSuccess={async () => {
          console.log('✅ Profile updated successfully');
          // Cache'i temizle ve profil verilerini yeniden yükle
          setLastUpdateTime(0);
          await fetchUserLocation();
          // Auth store'daki profili de güncelle
          if (user?.id) {
            try {
              const updatedProfile = await profileService.getProfile(user.id);
              if (updatedProfile) {
                setProfile(updatedProfile);
                console.log('✅ Auth store profile updated:', updatedProfile.role);
              }
            } catch (error) {
              console.error('❌ Error refreshing profile in auth store:', error);
            }
          }
        }}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>{t('profile.selectLanguage')}</Text>
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptions}>
              {/* Turkish */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'tr' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('tr')}
              >
                <Text style={styles.languageFlag}>🇹🇷</Text>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === 'tr' && styles.languageOptionTextActive,
                ]}>
                  Türkçe
                </Text>
                {currentLanguage === 'tr' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* English */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === 'en' && styles.languageOptionTextActive,
                ]}>
                  English
                </Text>
                {currentLanguage === 'en' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Russian */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'ru' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('ru')}
              >
                <Text style={styles.languageFlag}>🇷🇺</Text>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === 'ru' && styles.languageOptionTextActive,
                ]}>
                  Русский
                </Text>
                {currentLanguage === 'ru' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120, // Bottom bar için alan
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  personalInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  profilePictureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  profilePictureContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'visible',
    position: 'relative',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  profilePicturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileTextSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  userDetailsSection: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  editProfileButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  editProfileButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  notLoggedInWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notLoggedInContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xs,
  },
  notLoggedInIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  notLoggedInTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  notLoggedInText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  notLoggedInButtons: {
    width: '100%',
    gap: spacing.md,
    
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editLocationButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editLocationText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  locationLoadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  locationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPreviewContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  mapPreview: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  addressInfo: {
    padding: spacing.md,
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
  addressDetailsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressDetailsLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  addressDetailsText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  addLocationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addLocationIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  addLocationTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  addLocationText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  familyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  familyCardContentWrapper: {
    marginHorizontal: -spacing.lg, // Parent padding'i iptal et
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  familyCardEditContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1.586, // Standart kredi kartı oranı (85.6mm x 54mm)
    justifyContent: 'flex-end',
    paddingBottom: '15%',
    paddingLeft: '50%',
    marginBottom: spacing.lg,
  },
  cardNumberOverlay: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cardNumberText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#2c3e50',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  inputWrapper: {
    marginBottom: spacing.md,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardInput: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    fontWeight: fontWeight.medium,
    letterSpacing: 1,
  },
  familyCardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  familyCardDisplayContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardImageDisplay: {
    width: '100%',
    aspectRatio: 1.586,
    justifyContent: 'flex-end',
    paddingBottom: '15%',
    paddingLeft: '8%',
  },
  cardNumberOverlayDisplay: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cardNumberTextDisplay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#2c3e50',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  noFamilyCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  noFamilyCardText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  logoutButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#ef4444',
  },
  languageButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  languageValue: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  languageModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: fontSize.xl,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  languageOptions: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  languageOptionText: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  languageOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  languageCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageCheckmarkText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});

