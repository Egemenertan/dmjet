/**
 * Legal Screen
 * Gizlilik Politikası ve Kullanım Şartları
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { useTranslation } from '@localization';

export const LegalScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');
  const currentLanguage = i18n.language;

  const openExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('common.error'),
          t('legal.linkError', 'Bu bağlantı açılamıyor')
        );
      }
    } catch (error) {
      console.error('Link açma hatası:', error);
      Alert.alert(
        t('common.error'),
        t('legal.linkError', 'Bu bağlantı açılamıyor')
      );
    }
  };

  const getPrivacyPolicyContent = () => {
    if (currentLanguage === 'en') {
      return `# Privacy Policy

Last updated: December 23, 2025

At DMARJET, the security of your personal information is extremely important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.

## 1. Information We Collect

### Personal Information
• Full name
• Email address
• Phone number
• Delivery address

### Usage Data
• IP address
• Device information
• Application usage statistics
• Error reports

### Location Information
We collect your location information with your permission to provide delivery services.

## 2. Use of Information

• Process and deliver your orders
• Manage and secure your account
• Provide customer support
• Improve our services
• Fulfill legal obligations

## 3. Data Security

To protect your personal information:
• SSL encryption technology
• Secure data storage
• Regular security audits
• Limited access controls

## 4. Your Rights

Under GDPR/Data Protection Laws:
• Know if your data is being processed
• Request correction
• Request deletion
• Object to processing

## Contact
Email: info@dmarjet.com
Phone: +90 (533) 844 45 25`;
    } else if (currentLanguage === 'ru') {
      return `# Политика конфиденциальности

Последнее обновление: 23 декабря 2025 г.

В DMARJET безопасность вашей личной информации чрезвычайно важна для нас. Эта Политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию при использовании наших услуг.

## 1. Информация, которую мы собираем

### Личная информация
• Полное имя
• Адрес электронной почты
• Номер телефона
• Адрес доставки

### Данные об использовании
• IP-адрес
• Информация об устройстве
• Статистика использования приложения
• Отчеты об ошибках

### Информация о местоположении
Мы собираем информацию о вашем местоположении с вашего разрешения для предоставления услуг доставки.

## 2. Использование информации

• Обработка и доставка ваших заказов
• Управление и защита вашей учетной записи
• Предоставление поддержки клиентов
• Улучшение наших услуг
• Выполнение юридических обязательств

## 3. Безопасность данных

Для защиты вашей личной информации:
• Технология шифрования SSL
• Безопасное хранение данных
• Регулярные проверки безопасности
• Ограниченный контроль доступа

## 4. Ваши права

В соответствии с законами о защите данных:
• Узнать, обрабатываются ли ваши данные
• Запросить исправление
• Запросить удаление
• Возразить против обработки

## Контакты
Email: info@dmarjet.com
Телефон: +90 (533) 844 45 25`;
    } else {
      // Turkish (default)
      return `# Gizlilik Politikası

Son güncelleme: 23.12.2025

DMARJET olarak, kişisel bilgilerinizin güvenliği bizim için son derece önemlidir. Bu Gizlilik Politikası, hizmetlerimizi kullanırken kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.

## 1. Topladığımız Bilgiler

### Kişisel Bilgiler
• Ad ve soyad
• E-posta adresi
• Telefon numarası
• Teslimat adresi

### Kullanım Verileri
• IP adresi
• Cihaz bilgileri
• Uygulama kullanım istatistikleri
• Hata raporları

### Konum Bilgileri
Teslimat hizmeti sunabilmek için izninizle konum bilgilerinizi topluyoruz.

## 2. Bilgilerin Kullanımı

• Siparişlerinizi işleme almak ve teslimat yapmak
• Hesabınızı yönetmek ve güvenliğini sağlamak
• Müşteri desteği sağlamak
• Hizmetlerimizi geliştirmek
• Yasal yükümlülükleri yerine getirmek

## 3. Veri Güvenliği

Kişisel bilgilerinizi korumak için:
• SSL şifreleme teknolojisi
• Güvenli veri depolama
• Düzenli güvenlik denetimleri
• Sınırlı erişim kontrolleri

## 4. Haklarınız

KVKK kapsamında:
• Verilerinizin işlenip işlenmediğini öğrenme
• Düzeltilmesini isteme
• Silinmesini isteme
• İşleme itiraz etme

## İletişim
E-posta: info@dmarjet.com
Telefon: +90 (533) 844 45 25`;
    }
  };

  const getTermsOfServiceContent = () => {
    if (currentLanguage === 'en') {
      return `# Terms of Service

Last Update: December 23, 2025

## 1. Service Description

DMARJET provides online grocery delivery service in the Trikomo (İskele) region of Northern Cyprus.

## 2. User Eligibility

• You must be at least 18 years old
• You must provide accurate and current information
• You must be within our service area

## 3. Orders and Payment

• All prices are displayed in local currency
• Payment can be made by cash or credit card
• Minimum order amount may apply
• Prices may change without prior notice

## 4. Delivery Policy

• Delivery hours: 08:00 - 22:00
• Estimated delivery time: 15-25 minutes
• Delivery address must be within İskele/Trikomo region

## 5. Cancellation and Return Policy

• Full refund for incorrect or damaged products
• Return requests must be made within 24 hours after delivery

## 6. User Responsibilities

• Ensure the security of your account information
• Provide accurate and current information
• Treat delivery personnel respectfully

## 7. Limitation of Liability

• We are not responsible for service interruptions or errors
• Liability is limited to the order amount
• No liability accepted in force majeure situations

## Contact
Email: info@dmarjet.com
Phone: +90 (533) 844 45 25`;
    } else if (currentLanguage === 'ru') {
      return `# Условия использования

Последнее обновление: 23 декабря 2025 г.

## 1. Описание услуги

DMARJET предоставляет услуги онлайн-доставки продуктов в регионе Трикомо (Искеле) Северного Кипра.

## 2. Право на использование

• Вам должно быть не менее 18 лет
• Вы должны предоставить точную и актуальную информацию
• Вы должны находиться в зоне нашего обслуживания

## 3. Заказы и оплата

• Все цены указаны в местной валюте
• Оплата может быть произведена наличными или кредитной картой
• Может применяться минимальная сумма заказа
• Цены могут измениться без предварительного уведомления

## 4. Политика доставки

• Часы доставки: 08:00 - 22:00
• Ориентировочное время доставки: 15-25 минут
• Адрес доставки должен находиться в регионе Искеле/Трикомо

## 5. Политика отмены и возврата

• Полный возврат средств за неправильные или поврежденные товары
• Запросы на возврат должны быть сделаны в течение 24 часов после доставки

## 6. Обязанности пользователя

• Обеспечить безопасность информации вашей учетной записи
• Предоставлять точную и актуальную информацию
• Уважительно относиться к персоналу доставки

## 7. Ограничение ответственности

• Мы не несем ответственности за перебои в обслуживании или ошибки
• Ответственность ограничена суммой заказа
• Ответственность не принимается в случае форс-мажорных обстоятельств

## Контакты
Email: info@dmarjet.com
Телефон: +90 (533) 844 45 25`;
    } else {
      // Turkish (default)
      return `# Kullanım Şartları

Son Güncelleme: 23.12.2025

## 1. Hizmet Açıklaması

DMARJET, Kuzey Kıbrıs İskele (Trikomo) bölgesinde online market teslimat hizmeti sunar.

## 2. Kullanıcı Uygunluğu

• En az 18 yaşında olmalısınız
• Doğru ve güncel bilgiler sağlamalısınız
• Hizmet bölgemiz içinde bulunmalısınız

## 3. Sipariş ve Ödeme

• Tüm fiyatlar yerel para biriminde gösterilir
• Nakit veya kredi kartı ile ödeme yapılabilir
• Minimum sipariş tutarı uygulanabilir
• Fiyatlar önceden haber verilmeksizin değiştirilebilir

## 4. Teslimat Politikası

• Teslimat saatleri: 08:00 - 22:00 arası
• Tahmini teslimat süresi: 15-25 dakika
• Teslimat adresi İskele/Trikomo bölgesi içinde olmalıdır

## 5. İptal ve İade Politikası

• Hatalı veya hasarlı ürünler için tam iade yapılır
• İade talepleri teslimat sonrası 24 saat içinde yapılmalıdır

## 6. Kullanıcı Sorumlulukları

• Hesap bilgilerinizin güvenliğini sağlamak
• Doğru ve güncel bilgiler sağlamak
• Teslimat personeline saygılı davranmak

## 7. Sorumluluk Sınırlaması

• Hizmet kesintileri veya hatalardan sorumlu değiliz
• Sorumluluk sipariş tutarı ile sınırlıdır
• Mücbir sebep durumlarında sorumluluk kabul edilmez

## İletişim
E-posta: info@dmarjet.com
Telefon: +90 (533) 844 45 25`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('legal.title', 'Yasal Belgeler')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'privacy' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'privacy' && styles.activeTabButtonText,
            ]}
          >
            {t('legal.privacyPolicy', 'Gizlilik Politikası')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'terms' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('terms')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'terms' && styles.activeTabButtonText,
            ]}
          >
            {t('legal.termsOfService', 'Kullanım Şartları')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.contentText}>
          {activeTab === 'privacy' ? getPrivacyPolicyContent() : getTermsOfServiceContent()}
        </Text>

        {/* External Link Button */}
        <TouchableOpacity
          style={styles.externalLinkButton}
          onPress={() =>
            openExternalLink(
              activeTab === 'privacy'
                ? 'https://www.dmarjet.com/privacy-policy'
                : 'https://www.dmarjet.com/terms-of-service'
            )
          }
        >
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.externalLinkText}>
            {t('legal.viewOnWebsite', 'Web sitesinde görüntüle')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#111827',
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  contentText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: spacing.lg,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  externalLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
});


