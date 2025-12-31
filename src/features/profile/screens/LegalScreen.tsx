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

Last updated: December 31, 2025
Version: 2.0.0

At DMARJET, the security of your personal information is extremely important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.

## 1. Information We Collect

### 1.1 Personal Information
• Full name
• Email address
• Phone number
• Delivery address

### 1.2 Device and Technical Information
• Device ID (Android ID or iOS fingerprint)
• IP address (via ipify.org API)
• Device model and OS version
• User Agent (app version and device info)
• Last login information (device, IP, timestamp)

### 1.3 Location Data
• GPS coordinates (with your permission)
• Delivery address details
• Used for delivery area verification

### 1.4 Usage Data
• Order history
• Shopping cart information
• Search history
• Application usage statistics
• Error reports (via Sentry)

## 2. Use of Information

### 2.1 Service Provision
• Process and deliver your orders
• Manage and secure your account
• Provide customer support

### 2.2 Security and Fraud Prevention
• Multi-account detection (max 3 accounts per device)
• Rate limiting (IP and Device ID based)
• Device and IP banning (temporary or permanent)
• Order validation and stock verification

### 2.3 Improvement
• Improve our services
• Debug and troubleshoot
• Fulfill legal obligations

## 3. Data Retention

• Active accounts: Until deletion
• Order records: 10 years (legal requirement)
• Security logs: 90 days
• IP addresses: 90 days
• Device ID: While account is active
• Location data: Until deletion (can be deleted earlier)
• Deleted accounts: 30 days (complete removal)

## 4. Data Sharing

Your data is NEVER shared for marketing purposes.

Shared only with:
• Delivery company (name, address, phone)
• Payment provider (payment processing only)
• Service providers: Supabase, ipify.org, Google Maps, Sentry
• Legal authorities (when required by law)

Note: All third-party services are GDPR compliant.

## 5. Data Security

• SSL/TLS encryption
• Row Level Security (RLS)
• Password hashing (bcrypt)
• Rate limiting
• Device banning system
• Audit logging

## 6. Your Rights (GDPR)

• Right to access your data
• Right to correction
• Right to erasure
• Right to object
• Data portability

To exercise your rights:
Email: privacy@dmarjet.com
App: Profile > Settings > Delete Account

## Contact
Email: privacy@dmarjet.com
Support: support@dmarjet.com
Phone: +90 (533) 844 45 25`;
    } else if (currentLanguage === 'ru') {
      return `# Политика конфиденциальности

Последнее обновление: 31 декабря 2025 г.
Версия: 2.0.0

В DMARJET безопасность вашей личной информации чрезвычайно важна для нас. Эта Политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию при использовании наших услуг.

## 1. Информация, которую мы собираем

### 1.1 Личная информация
• Полное имя
• Адрес электронной почты
• Номер телефона
• Адрес доставки

### 1.2 Информация об устройстве и технические данные
• ID устройства (Android ID или отпечаток iOS)
• IP-адрес (через API ipify.org)
• Модель устройства и версия ОС
• User Agent (версия приложения и информация об устройстве)
• Информация о последнем входе (устройство, IP, время)

### 1.3 Данные о местоположении
• GPS-координаты (с вашего разрешения)
• Детали адреса доставки
• Используется для проверки зоны доставки

### 1.4 Данные об использовании
• История заказов
• Информация о корзине
• История поиска
• Статистика использования приложения
• Отчеты об ошибках (через Sentry)

## 2. Использование информации

### 2.1 Предоставление услуг
• Обработка и доставка заказов
• Управление и защита учетной записи
• Поддержка клиентов

### 2.2 Безопасность и предотвращение мошенничества
• Обнаружение нескольких учетных записей (макс. 3 на устройство)
• Ограничение частоты запросов (на основе IP и ID устройства)
• Блокировка устройств и IP (временная или постоянная)
• Проверка заказов и наличия товаров

### 2.3 Улучшение
• Улучшение услуг
• Отладка и устранение неполадок
• Выполнение юридических обязательств

## 3. Хранение данных

• Активные аккаунты: До удаления
• Записи заказов: 10 лет (требование закона)
• Журналы безопасности: 90 дней
• IP-адреса: 90 дней
• ID устройства: Пока аккаунт активен
• Данные о местоположении: До удаления (можно удалить раньше)
• Удаленные аккаунты: 30 дней (полное удаление)

## 4. Обмен данными

Ваши данные НИКОГДА не передаются в маркетинговых целях.

Передаются только:
• Компании доставки (имя, адрес, телефон)
• Платежному провайдеру (только для обработки платежей)
• Поставщикам услуг: Supabase, ipify.org, Google Maps, Sentry
• Органам власти (при требовании закона)

Примечание: Все сторонние сервисы соответствуют GDPR.

## 5. Безопасность данных

• Шифрование SSL/TLS
• Безопасность на уровне строк (RLS)
• Хеширование паролей (bcrypt)
• Ограничение частоты запросов
• Система блокировки устройств
• Журналирование аудита

## 6. Ваши права (GDPR)

• Право доступа к данным
• Право на исправление
• Право на удаление
• Право на возражение
• Переносимость данных

Для реализации прав:
Email: privacy@dmarjet.com
Приложение: Профиль > Настройки > Удалить аккаунт

## Контакты
Email: privacy@dmarjet.com
Поддержка: support@dmarjet.com
Телефон: +90 (533) 844 45 25`;
    } else {
      // Turkish (default)
      return `# Gizlilik Politikası

Son güncelleme: 31.12.2025
Versiyon: 2.0.0

DMARJET olarak, kişisel bilgilerinizin güvenliği bizim için son derece önemlidir. Bu Gizlilik Politikası, hizmetlerimizi kullanırken kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.

## 1. Topladığımız Bilgiler

### 1.1 Kişisel Bilgiler
• Ad ve soyad
• E-posta adresi
• Telefon numarası
• Teslimat adresi

### 1.2 Cihaz ve Teknik Bilgiler
• Cihaz ID (Android ID veya iOS parmak izi)
• IP adresi (ipify.org API üzerinden)
• Cihaz modeli ve işletim sistemi versiyonu
• Kullanıcı Ajanı (uygulama versiyonu ve cihaz bilgisi)
• Son giriş bilgileri (cihaz, IP, zaman)

### 1.3 Konum Verileri
• GPS koordinatları (izninizle)
• Teslimat adresi detayları
• Teslimat alanı kontrolü için kullanılır

### 1.4 Kullanım Verileri
• Sipariş geçmişi
• Sepet bilgileri
• Arama geçmişi
• Uygulama kullanım istatistikleri
• Hata raporları (Sentry üzerinden)

## 2. Bilgilerin Kullanımı

### 2.1 Hizmet Sağlama
• Siparişlerinizi işleme almak ve teslimat yapmak
• Hesabınızı yönetmek ve güvenliğini sağlamak
• Müşteri desteği sağlamak

### 2.2 Güvenlik ve Dolandırıcılık Önleme
• Çoklu hesap tespiti (cihaz başına maks. 3 hesap)
• Rate limiting (IP ve Cihaz ID bazlı)
• Cihaz ve IP banlama (geçici veya kalıcı)
• Sipariş doğrulama ve stok kontrolü

### 2.3 İyileştirme
• Hizmetlerimizi geliştirmek
• Hata ayıklama ve sorun giderme
• Yasal yükümlülükleri yerine getirmek

## 3. Veri Saklama Süresi

• Aktif hesaplar: Silinene kadar
• Sipariş kayıtları: 10 yıl (yasal zorunluluk)
• Güvenlik logları: 90 gün
• IP adresleri: 90 gün
• Cihaz ID: Hesap aktif olduğu sürece
• Konum verileri: Silinene kadar (daha önce silinebilir)
• Silinen hesaplar: 30 gün (tamamen silinir)

## 4. Veri Paylaşımı

Verileriniz ASLA pazarlama amacıyla paylaşılmaz.

Sadece şunlarla paylaşılır:
• Teslimat şirketi (ad, adres, telefon)
• Ödeme sağlayıcısı (sadece ödeme işlemi için)
• Hizmet sağlayıcılar: Supabase, ipify.org, Google Maps, Sentry
• Yasal makamlar (yasal zorunluluk durumunda)

Not: Tüm üçüncü taraf servisler GDPR uyumludur.

## 5. Veri Güvenliği

• SSL/TLS şifreleme
• Row Level Security (RLS)
• Şifre hashleme (bcrypt)
• Rate limiting
• Cihaz banlama sistemi
• Audit logging

## 6. Haklarınız (KVKK & GDPR)

• Verilerinize erişim hakkı
• Düzeltme hakkı
• Silme hakkı
• İtiraz hakkı
• Veri taşınabilirliği

Haklarınızı kullanmak için:
E-posta: privacy@dmarjet.com
Uygulama: Profil > Ayarlar > Hesabı Sil

## İletişim
E-posta: privacy@dmarjet.com
Destek: support@dmarjet.com
Telefon: +90 (533) 844 45 25`;
    }
  };

  const getTermsOfServiceContent = () => {
    if (currentLanguage === 'en') {
      return `# Terms of Service

Last Update: December 31, 2025
Version: 2.0.0

## 1. Service Description

DMARJET provides online grocery delivery service in the Trikomo (İskele) region of Northern Cyprus.

## 2. User Eligibility

• You must be at least 18 years old
• You must provide accurate and current information
• You must be within our service area
• Maximum 3 accounts per device allowed

## 3. Orders and Payment

• All prices are displayed in local currency
• Payment can be made by cash or credit card
• Minimum order amount may apply
• Prices may change without prior notice
• Stock availability is verified at checkout

## 4. Delivery Policy

• Delivery hours: 08:00 - 22:00
• Estimated delivery time: 15-25 minutes
• Delivery address must be within İskele/Trikomo region
• GPS location required for delivery verification

## 5. Cancellation and Return Policy

• Full refund for incorrect or damaged products
• Return requests must be made within 24 hours after delivery
• Orders cannot be cancelled after preparation begins

## 6. User Responsibilities

• Ensure the security of your account information
• Provide accurate and current information
• Treat delivery personnel respectfully
• Do not create multiple accounts for abuse
• Do not place fraudulent orders

## 7. Security and Account Suspension

### Automatic Ban Conditions:
• Creating more than 3 accounts from same device
• Fraudulent order attempts
• Abusive behavior towards staff
• Violation of terms of service

### Ban Types:
• Temporary ban: 7-30 days
• Permanent ban: For serious violations
• Device ban: Prevents new account creation
• IP ban: Blocks access from specific IP addresses

### Appeal Process:
Contact support@dmarjet.com to appeal a ban

## 8. Data Collection and Privacy

• We collect device ID, IP address, and location data
• Data is used for security and fraud prevention
• See Privacy Policy for full details
• You can request data deletion at any time

## 9. Limitation of Liability

• We are not responsible for service interruptions or errors
• Liability is limited to the order amount
• No liability accepted in force majeure situations
• Not responsible for third-party service failures

## 10. Changes to Terms

We reserve the right to modify these terms at any time. Users will be notified of significant changes via email.

## Contact
Email: support@dmarjet.com
Privacy: privacy@dmarjet.com
Phone: +90 (533) 844 45 25`;
    } else if (currentLanguage === 'ru') {
      return `# Условия использования

Последнее обновление: 31 декабря 2025 г.
Версия: 2.0.0

## 1. Описание услуги

DMARJET предоставляет услуги онлайн-доставки продуктов в регионе Трикомо (Искеле) Северного Кипра.

## 2. Право на использование

• Вам должно быть не менее 18 лет
• Вы должны предоставить точную и актуальную информацию
• Вы должны находиться в зоне нашего обслуживания
• Разрешено максимум 3 учетные записи на устройство

## 3. Заказы и оплата

• Все цены указаны в местной валюте
• Оплата может быть произведена наличными или кредитной картой
• Может применяться минимальная сумма заказа
• Цены могут измениться без предварительного уведомления
• Наличие товара проверяется при оформлении заказа

## 4. Политика доставки

• Часы доставки: 08:00 - 22:00
• Ориентировочное время доставки: 15-25 минут
• Адрес доставки должен находиться в регионе Искеле/Трикомо
• Требуется GPS-местоположение для проверки доставки

## 5. Политика отмены и возврата

• Полный возврат средств за неправильные или поврежденные товары
• Запросы на возврат должны быть сделаны в течение 24 часов после доставки
• Заказы нельзя отменить после начала подготовки

## 6. Обязанности пользователя

• Обеспечить безопасность информации вашей учетной записи
• Предоставлять точную и актуальную информацию
• Уважительно относиться к персоналу доставки
• Не создавать несколько учетных записей для злоупотреблений
• Не размещать мошеннические заказы

## 7. Безопасность и приостановка учетной записи

### Условия автоматической блокировки:
• Создание более 3 учетных записей с одного устройства
• Попытки мошеннических заказов
• Оскорбительное поведение по отношению к персоналу
• Нарушение условий использования

### Типы блокировок:
• Временная блокировка: 7-30 дней
• Постоянная блокировка: За серьезные нарушения
• Блокировка устройства: Предотвращает создание новых учетных записей
• Блокировка IP: Блокирует доступ с определенных IP-адресов

### Процесс обжалования:
Свяжитесь с support@dmarjet.com для обжалования блокировки

## 8. Сбор данных и конфиденциальность

• Мы собираем ID устройства, IP-адрес и данные о местоположении
• Данные используются для безопасности и предотвращения мошенничества
• См. Политику конфиденциальности для полной информации
• Вы можете запросить удаление данных в любое время

## 9. Ограничение ответственности

• Мы не несем ответственности за перебои в обслуживании или ошибки
• Ответственность ограничена суммой заказа
• Ответственность не принимается в случае форс-мажорных обстоятельств
• Не несем ответственности за сбои сторонних сервисов

## 10. Изменения условий

Мы оставляем за собой право изменять эти условия в любое время. Пользователи будут уведомлены о значительных изменениях по электронной почте.

## Контакты
Email: support@dmarjet.com
Конфиденциальность: privacy@dmarjet.com
Телефон: +90 (533) 844 45 25`;
    } else {
      // Turkish (default)
      return `# Kullanım Şartları

Son Güncelleme: 31.12.2025
Versiyon: 2.0.0

## 1. Hizmet Açıklaması

DMARJET, Kuzey Kıbrıs İskele (Trikomo) bölgesinde online market teslimat hizmeti sunar.

## 2. Kullanıcı Uygunluğu

• En az 18 yaşında olmalısınız
• Doğru ve güncel bilgiler sağlamalısınız
• Hizmet bölgemiz içinde bulunmalısınız
• Cihaz başına maksimum 3 hesap açılabilir

## 3. Sipariş ve Ödeme

• Tüm fiyatlar yerel para biriminde gösterilir
• Nakit veya kredi kartı ile ödeme yapılabilir
• Minimum sipariş tutarı uygulanabilir
• Fiyatlar önceden haber verilmeksizin değiştirilebilir
• Stok durumu ödeme sırasında kontrol edilir

## 4. Teslimat Politikası

• Teslimat saatleri: 08:00 - 22:00 arası
• Tahmini teslimat süresi: 15-25 dakika
• Teslimat adresi İskele/Trikomo bölgesi içinde olmalıdır
• Teslimat doğrulaması için GPS konumu gereklidir

## 5. İptal ve İade Politikası

• Hatalı veya hasarlı ürünler için tam iade yapılır
• İade talepleri teslimat sonrası 24 saat içinde yapılmalıdır
• Hazırlık başladıktan sonra sipariş iptal edilemez

## 6. Kullanıcı Sorumlulukları

• Hesap bilgilerinizin güvenliğini sağlamak
• Doğru ve güncel bilgiler sağlamak
• Teslimat personeline saygılı davranmak
• Kötüye kullanım için birden fazla hesap açmamak
• Sahte sipariş vermemek

## 7. Güvenlik ve Hesap Askıya Alma

### Otomatik Ban Koşulları:
• Aynı cihazdan 3'ten fazla hesap oluşturma
• Sahte sipariş denemeleri
• Personele karşı kötü davranış
• Kullanım şartlarını ihlal etme

### Ban Türleri:
• Geçici ban: 7-30 gün
• Kalıcı ban: Ciddi ihlaller için
• Cihaz banı: Yeni hesap açılmasını engeller
• IP banı: Belirli IP adreslerinden erişimi engeller

### İtiraz Süreci:
Ban itirazı için support@dmarjet.com ile iletişime geçin

## 8. Veri Toplama ve Gizlilik

• Cihaz ID, IP adresi ve konum verisi topluyoruz
• Veriler güvenlik ve dolandırıcılık önleme için kullanılır
• Tam detaylar için Gizlilik Politikası'na bakın
• İstediğiniz zaman veri silme talebinde bulunabilirsiniz

## 9. Sorumluluk Sınırlaması

• Hizmet kesintileri veya hatalardan sorumlu değiliz
• Sorumluluk sipariş tutarı ile sınırlıdır
• Mücbir sebep durumlarında sorumluluk kabul edilmez
• Üçüncü taraf servis hatalarından sorumlu değiliz

## 10. Şartlarda Değişiklikler

Bu şartları istediğimiz zaman değiştirme hakkını saklı tutarız. Önemli değişiklikler e-posta ile bildirilecektir.

## İletişim
E-posta: support@dmarjet.com
Gizlilik: privacy@dmarjet.com
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


