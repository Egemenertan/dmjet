/**
 * Input Sanitization Utilities
 * Provides functions to sanitize and validate user inputs
 */

/**
 * Türkçe karakterleri normalize et (ı->i, ğ->g, ü->u, ş->s, ö->o, ç->c)
 * @param text - Normalize edilecek metin
 * @returns Normalize edilmiş metin
 */
export const normalizeTurkishChars = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const turkishChars: Record<string, string> = {
    'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
    'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
  };

  return text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, (char) => turkishChars[char] || char);
};

/**
 * Sanitize search query to prevent SQL injection
 * @param query - User input search query
 * @returns Sanitized query string
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Maksimum uzunluk kontrolü
  const maxLength = 100;
  let sanitized = query.slice(0, maxLength);

  // Special characters escape for LIKE queries
  // % and _ are wildcards in SQL LIKE, escape them
  sanitized = sanitized.replace(/[%_]/g, '\\$&');

  // XSS koruması - HTML tags kaldır
  sanitized = sanitized.replace(/[<>]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Türkçe karakterlere duyarsız arama için query normalize et
 * @param query - Arama terimi
 * @returns Normalize edilmiş ve sanitize edilmiş query
 */
export const normalizeSearchQuery = (query: string): string => {
  const sanitized = sanitizeSearchQuery(query);
  return normalizeTurkishChars(sanitized.toLowerCase());
};

/**
 * Sanitize email input
 * @param email - User input email
 * @returns Sanitized email string
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Lowercase ve trim
  let sanitized = email.toLowerCase().trim();

  // Sadece valid email karakterleri
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');

  return sanitized;
};

/**
 * Sanitize phone number
 * @param phone - User input phone number
 * @returns Sanitized phone number (only digits)
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Sadece rakamlar
  return phone.replace(/\D/g, '');
};

/**
 * Sanitize general text input
 * @param text - User input text
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export const sanitizeText = (text: string, maxLength: number = 500): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text.slice(0, maxLength);

  // XSS koruması
  sanitized = sanitized.replace(/[<>]/g, '');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Validate and sanitize URL
 * @param url - User input URL
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsedUrl = new URL(url);
    
    // Sadece http ve https protokollerine izin ver
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }

    return parsedUrl.toString();
  } catch {
    return '';
  }
};

/**
 * Escape HTML to prevent XSS
 * @param text - Text to escape
 * @returns HTML escaped text
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
};

/**
 * Kelime bazlı akıllı eşleştirme yapar
 * Örnek: "bakım" -> "Kişisel Bakım" eşleşir
 * @param searchTerm - Arama terimi
 * @param targetText - Hedef metin (kategori adı, ürün adı vb.)
 * @returns Eşleşme skoru (0-100 arası, yüksek = daha iyi eşleşme)
 */
export const calculateMatchScore = (searchTerm: string, targetText: string): number => {
  if (!searchTerm || !targetText) return 0;
  
  const normalizedSearch = normalizeTurkishChars(searchTerm.toLowerCase().trim());
  const normalizedTarget = normalizeTurkishChars(targetText.toLowerCase().trim());
  
  // Tam eşleşme - en yüksek skor
  if (normalizedSearch === normalizedTarget) return 100;
  
  // Hedef metin arama terimiyle başlıyorsa - çok yüksek skor
  if (normalizedTarget.startsWith(normalizedSearch)) return 90;
  
  // Hedef metni kelimelere ayır
  const targetWords = normalizedTarget.split(/\s+/);
  
  // Arama terimi kelimelerden biriyle tam eşleşiyorsa - yüksek skor
  if (targetWords.some(word => word === normalizedSearch)) return 85;
  
  // Arama terimi kelimelerden biriyle başlıyorsa - iyi skor
  if (targetWords.some(word => word.startsWith(normalizedSearch))) return 75;
  
  // Arama terimi kelimelerden birinin içinde geçiyorsa - orta skor
  if (targetWords.some(word => word.includes(normalizedSearch))) return 60;
  
  // Hedef metin arama terimini içeriyorsa - düşük skor
  if (normalizedTarget.includes(normalizedSearch)) return 50;
  
  // Eşleşme yok
  return 0;
};

/**
 * Metinleri eşleşme skoruna göre filtreler ve sıralar
 * @param searchTerm - Arama terimi
 * @param items - Aranacak öğeler
 * @param getTextFn - Öğeden metin çıkaran fonksiyon
 * @param minScore - Minimum eşleşme skoru (varsayılan: 50)
 * @returns Skorlanmış ve sıralanmış öğeler
 */
export const filterAndSortByMatch = <T>(
  searchTerm: string,
  items: T[],
  getTextFn: (item: T) => string,
  minScore: number = 50
): Array<T & { matchScore: number }> => {
  return items
    .map(item => ({
      ...item,
      matchScore: calculateMatchScore(searchTerm, getTextFn(item))
    }))
    .filter(item => item.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Çoklu kelime araması için gelişmiş eşleştirme yapar
 * Türkçe karakterlere duyarsız, birden fazla kelime ile arama yapabilir
 * Örnek: "pinar labne" -> "PINAR LABNE" eşleşir
 * @param searchTerm - Arama terimi (birden fazla kelime olabilir)
 * @param targetText - Hedef metin (ürün adı vb.)
 * @returns Eşleşme skoru (0-100 arası, yüksek = daha iyi eşleşme)
 */
export const calculateMultiWordMatchScore = (searchTerm: string, targetText: string): number => {
  if (!searchTerm || !targetText) return 0;
  
  const normalizedSearch = normalizeTurkishChars(searchTerm.toLowerCase().trim());
  const normalizedTarget = normalizeTurkishChars(targetText.toLowerCase().trim());
  
  // Tam eşleşme - en yüksek skor
  if (normalizedSearch === normalizedTarget) return 100;
  
  // Hedef metin arama terimiyle başlıyorsa - çok yüksek skor
  if (normalizedTarget.startsWith(normalizedSearch)) return 95;
  
  // Arama terimini kelimelere ayır
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);
  const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0);
  
  // Tek kelime araması için eski mantığı kullan
  if (searchWords.length === 1) {
    const searchWord = searchWords[0];
    
    // Hedef metin kelimelerden biriyle tam eşleşiyorsa
    if (targetWords.some(word => word === searchWord)) return 90;
    
    // Hedef metin kelimelerden biriyle başlıyorsa
    if (targetWords.some(word => word.startsWith(searchWord))) return 80;
    
    // Hedef metin kelimelerden birinin içinde geçiyorsa
    if (targetWords.some(word => word.includes(searchWord))) return 70;
    
    // Hedef metin arama terimini içeriyorsa
    if (normalizedTarget.includes(searchWord)) return 60;
    
    return 0;
  }
  
  // Çoklu kelime araması
  let matchedWords = 0;
  let totalScore = 0;
  
  for (const searchWord of searchWords) {
    let bestWordScore = 0;
    
    for (const targetWord of targetWords) {
      let wordScore = 0;
      
      // Tam eşleşme
      if (targetWord === searchWord) {
        wordScore = 100;
      }
      // Başlangıç eşleşmesi
      else if (targetWord.startsWith(searchWord)) {
        wordScore = 85;
      }
      // İçerik eşleşmesi
      else if (targetWord.includes(searchWord)) {
        wordScore = 70;
      }
      // Kısmi eşleşme (minimum 2 karakter)
      else if (searchWord.length >= 2 && targetWord.includes(searchWord.substring(0, 2))) {
        wordScore = 40;
      }
      
      bestWordScore = Math.max(bestWordScore, wordScore);
    }
    
    // Hedef metinde hiç geçmese bile kısmi puan ver
    if (bestWordScore === 0 && normalizedTarget.includes(searchWord)) {
      bestWordScore = 50;
    }
    
    if (bestWordScore > 0) {
      matchedWords++;
      totalScore += bestWordScore;
    }
  }
  
  // Tüm kelimeler eşleşmeli
  if (matchedWords === 0) return 0;
  
  // Ortalama skor hesapla
  const averageScore = totalScore / searchWords.length;
  
  // Eşleşen kelime oranına göre bonus/ceza
  const matchRatio = matchedWords / searchWords.length;
  
  // Tüm kelimeler eşleşiyorsa bonus ver
  if (matchRatio === 1.0) {
    return Math.min(100, averageScore * 1.1);
  }
  
  // Kısmi eşleşme için ceza
  return averageScore * matchRatio;
};

/**
 * Çoklu kelime araması için metinleri filtreler ve sıralar
 * @param searchTerm - Arama terimi (birden fazla kelime olabilir)
 * @param items - Aranacak öğeler
 * @param getTextFn - Öğeden metin çıkaran fonksiyon
 * @param minScore - Minimum eşleşme skoru (varsayılan: 40)
 * @returns Skorlanmış ve sıralanmış öğeler
 */
export const filterAndSortByMultiWordMatch = <T>(
  searchTerm: string,
  items: T[],
  getTextFn: (item: T) => string,
  minScore: number = 40
): Array<T & { matchScore: number }> => {
  return items
    .map(item => ({
      ...item,
      matchScore: calculateMultiWordMatchScore(searchTerm, getTextFn(item))
    }))
    .filter(item => item.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
};










