/**
 * Sentry Error Tracking Service
 * 
 * Centralized error tracking and monitoring
 * 
 * Features:
 * - Automatic error capture
 * - User context tracking
 * - Breadcrumbs for debugging
 * - Performance monitoring
 * - Release tracking
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry DSN - Production'da environment variable'dan alınmalı
const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Development mode check
const isDevelopment = __DEV__;

/**
 * Initialize Sentry
 * Call this once at app startup
 */
export const initSentry = () => {
  // Only initialize if DSN is provided and not in development
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Enable in production only
    enabled: !isDevelopment,
    
    // Environment
    environment: isDevelopment ? 'development' : 'production',
    
    // Release tracking
    release: `dmarjetmobile@${Constants.expoConfig?.version || '1.0.0'}`,
    dist: Constants.expoConfig?.android?.versionCode?.toString() || 
          Constants.expoConfig?.ios?.buildNumber || '1',
    
    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.2, // 20% in production
    
    // Enable automatic session tracking
    enableAutoSessionTracking: true,
    
    // Session timeout (30 minutes)
    sessionTrackingIntervalMillis: 30000,
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Routing instrumentation for React Navigation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Enable automatic performance monitoring
        tracingOrigins: ['localhost', /^\//],
      }),
    ],
    
    // Before send hook - filter sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      
      // Log in development
      if (isDevelopment) {
        console.log('Sentry Event:', event);
      }
      
      return event;
    },
    
    // Before breadcrumb hook
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out console logs in production
      if (!isDevelopment && breadcrumb.category === 'console') {
        return null;
      }
      
      return breadcrumb;
    },
  });
};

/**
 * Set user context
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser(user);
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Capture exception manually
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext('additional_info', context);
  }
  
  Sentry.captureException(error);
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext('additional_info', context);
  }
  
  Sentry.captureMessage(message, level);
};

/**
 * Set custom tags
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * Start a performance transaction
 */
export const startTransaction = (
  name: string,
  op: string = 'custom'
): Sentry.Transaction => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Wrap component with Sentry error boundary
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Export Sentry for advanced usage
 */
export { Sentry };

