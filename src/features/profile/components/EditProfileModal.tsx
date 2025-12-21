/**
 * Edit Profile Modal
 * Modal for editing user profile information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Xmark, User, Phone } from 'iconoir-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { CountryCodePicker } from '@shared/components/CountryCodePicker';
import { profileService, ProfileData } from '../services/profileService';
import { useTranslation } from '@localization';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentProfile: {
    full_name: string | null;
    phone: string | null;
    country_code: string | null;
  };
  onSuccess: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  userId,
  currentProfile,
  onSuccess,
}) => {
  const {t} = useTranslation();
  const [fullName, setFullName] = useState(currentProfile.full_name || '');
  const [phone, setPhone] = useState(currentProfile.phone || '');
  const [countryCode, setCountryCode] = useState(currentProfile.country_code || '+90');
  const [saving, setSaving] = useState(false);

  // Debug: Modal açıldığında logla
  useEffect(() => {
    console.log('🎭 EditProfileModal - Visible:', visible);
    console.log('👤 Current Profile:', currentProfile);
  }, [visible, currentProfile]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🔄 Resetting form with:', currentProfile);
      setFullName(currentProfile.full_name || '');
      setPhone(currentProfile.phone || '');
      setCountryCode(currentProfile.country_code || '+90');
    }
  }, [visible, currentProfile]);

  const handleSave = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('profile.enterFullName'));
      return;
    }

    if (!phone.trim()) {
      Alert.alert(t('common.error'), t('profile.enterPhone'));
      return;
    }

    // Phone number validation (basic)
    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert(t('common.error'), t('profile.invalidPhone'));
      return;
    }

    try {
      setSaving(true);
      await profileService.updateProfile(userId, {
        full_name: fullName.trim(),
        phone: cleanPhone,
        country_code: countryCode,
      });

      Alert.alert(t('common.done'), t('profile.profileUpdated'), [
        {
          text: t('common.ok'),
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Profil güncellenemedi:', error);
      Alert.alert(t('common.error'), t('profile.profileUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(currentProfile.full_name || '');
    setPhone(currentProfile.phone || '');
    setCountryCode(currentProfile.country_code || '+90');
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('profile.editProfile')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
                disabled={saving}
              >
                <Xmark
                  width={24}
                  height={24}
                  color={colors.text.primary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              nestedScrollEnabled={true}
            >
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('profile.fullName')} *</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <User
                      width={20}
                      height={20}
                      color={colors.text.secondary}
                      strokeWidth={2}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={t('profile.fullNamePlaceholder')}
                    placeholderTextColor={colors.text.secondary}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!saving}
                  />
                </View>
              </View>

              {/* Phone Input with Country Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('profile.phoneNumber')} *</Text>
                <View style={styles.phoneInputContainer}>
                  <CountryCodePicker
                    selectedCode={countryCode}
                    onSelect={setCountryCode}
                    disabled={saving}
                  />
                  <View style={styles.phoneInputWrapper}>
                    <View style={styles.inputIcon}>
                      <Phone
                        width={20}
                        height={20}
                        color={colors.text.secondary}
                        strokeWidth={2}
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder={t('profile.phonePlaceholder')}
                      placeholderTextColor={colors.text.secondary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      editable={!saving}
                      maxLength={15}
                    />
                  </View>
                </View>
                <Text style={styles.hint}>
                  {t('profile.phoneHint')}
                </Text>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {t('profile.requiredFields')}
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    maxHeight: '90%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: fontSize.md,
    color: colors.text.primary,
    padding: 0,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
});

