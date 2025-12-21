/**
 * i18next Configuration
 * Multi-language support setup
 */

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import tr from './translations/tr.json';
import en from './translations/en.json';
import ru from './translations/ru.json';

const LANGUAGE_KEY = '@app_language';

const resources = {
  tr: {translation: tr},
  en: {translation: en},
  ru: {translation: ru},
};

// Get device language
const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales.length > 0) {
    const languageCode = locales[0].languageCode;
    // Check if we support this language
    if (['tr', 'en', 'ru'].includes(languageCode)) {
      return languageCode;
    }
  }
  return 'tr'; // Default fallback
};

// Get saved language or device language
const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && ['tr', 'en', 'ru'].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  return getDeviceLanguage();
};

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'tr',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });
};

// Initialize immediately
initI18n();

export default i18n;

