/**
 * Input Sanitization Utilities
 * Provides functions to sanitize and validate user inputs
 */

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


