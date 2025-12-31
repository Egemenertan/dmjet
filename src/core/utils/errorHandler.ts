/**
 * Error Handler Utility
 * Provides centralized error handling and user-friendly messages
 */

import {logger} from './logger';

/**
 * Get user-friendly error message
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  // Production'da detaylı hata mesajları gösterme
  if (!__DEV__) {
    // Supabase specific errors
    if (error?.code === 'PGRST116') {
      return 'Kayıt bulunamadı.';
    }
    if (error?.code === '23505') {
      return 'Bu kayıt zaten mevcut.';
    }
    if (error?.code === '23503') {
      return 'İlişkili kayıtlar nedeniyle işlem yapılamadı.';
    }

    // Auth errors
    if (error?.message?.includes('Invalid login credentials')) {
      return 'Email veya şifre hatalı.';
    }
    if (error?.message?.includes('Email not confirmed')) {
      return 'Lütfen email adresinizi doğrulayın.';
    }
    if (error?.message?.includes('User already registered')) {
      return 'Bu email adresi zaten kayıtlı.';
    }

    // Network errors
    if (error?.message?.includes('Network request failed')) {
      return 'İnternet bağlantınızı kontrol edin.';
    }
    if (error?.message?.includes('timeout')) {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }

    // Generic error
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  // Development'ta detaylı mesaj
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Bilinmeyen bir hata oluştu';
};

/**
 * Handle and log error
 * @param error - Error to handle
 * @param context - Additional context for logging
 * @returns User-friendly error message
 */
export const handleError = (error: any, context?: string): string => {
  // Log error with context
  if (context) {
    logger.error(`Error in ${context}:`, error);
  } else {
    logger.error('Error:', error);
  }

  // Return user-friendly message
  return getErrorMessage(error);
};

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Categorize error type
 * @param error - Error to categorize
 * @returns Error type
 */
export const categorizeError = (error: any): ErrorType => {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('timeout')) {
    return ErrorType.NETWORK;
  }
  if (
    message.includes('auth') ||
    message.includes('login') ||
    message.includes('credential')
  ) {
    return ErrorType.AUTH;
  }
  if (message.includes('invalid') || message.includes('required')) {
    return ErrorType.VALIDATION;
  }
  if (error?.code?.startsWith('PG') || error?.code?.startsWith('23')) {
    return ErrorType.DATABASE;
  }
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return ErrorType.PERMISSION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Create custom error
 * @param message - Error message
 * @param type - Error type
 * @param code - Error code
 * @returns Custom error object
 */
export const createError = (
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  code?: string,
) => {
  const error = new Error(message) as any;
  error.type = type;
  if (code) error.code = code;
  return error;
};

/**
 * Retry function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in ms
 * @returns Result of function
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);

      if (i < maxRetries - 1) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};






