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
import {env} from '@core/config/env';
import Constants from 'expo-constants';

/**
 * Initialize Sentry
 * Call this once at app startup
 */
export const initSentry = () => {
  // Only initialize if DSN is provided
  if (!env.sentry.dsn) {
    if (__DEV__) {
      console.warn('⚠️ Sentry DSN not configured. Error tracking is disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: env.sentry.dsn,
      // Enable automatic session tracking
      enableAutoSessionTracking: true,
      // Session timeout in milliseconds
      sessionTrackingIntervalMillis: 30000,
      // Enable automatic breadcrumbs
      enableAutoPerformanceTracing: true,
      // Trace sampling rate (0.0 to 1.0)
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      // Environment
      environment: __DEV__ ? 'development' : 'production',
      // Release version
      release: `${Constants.expoConfig?.slug}@${Constants.expoConfig?.version}`,
      // Distribution
      dist: Constants.expoConfig?.version,
      // Enable native crash reporting
      enableNative: true,
      // Enable native crash reporting for NDK
      enableNativeCrashHandling: true,
      // Attach stack trace to messages
      attachStacktrace: true,
      // Maximum number of breadcrumbs
      maxBreadcrumbs: 100,
      // Before send hook - filter sensitive data
      beforeSend(event) {
        // Remove sensitive data from event
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
        return event;
      },
      // Integrations
      integrations: [
        new Sentry.ReactNativeTracing({
          // Tracing options
          tracingOrigins: ['localhost', /^\//],
          // Enable automatic transaction tracking
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        }),
      ],
    });
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
};

/**
 * Set user context
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
  fullName?: string;
}) => {
  try {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.fullName,
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to set Sentry user:', error);
    }
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  try {
    Sentry.setUser(null);
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to clear Sentry user:', error);
    }
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>,
) => {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to add Sentry breadcrumb:', error);
    }
  }
};

/**
 * Capture exception manually
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>,
) => {
  try {
    if (context) {
      Sentry.captureException(error, {
        contexts: {custom: context},
      });
    } else {
      Sentry.captureException(error);
    }
  } catch (err) {
    // Fallback to console in case Sentry fails
    console.error('Error:', error, context);
  }
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>,
) => {
  try {
    if (context) {
      Sentry.captureMessage(message, {
        level,
        contexts: {custom: context},
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  } catch (error) {
    // Fallback to console in case Sentry fails
    if (__DEV__) {
      console.log('Message:', message, level, context);
    }
  }
};

/**
 * Set custom tags
 */
export const setTag = (key: string, value: string) => {
  try {
    Sentry.setTag(key, value);
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to set Sentry tag:', error);
    }
  }
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  try {
    Sentry.setContext(name, context);
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to set Sentry context:', error);
    }
  }
};

/**
 * Start a performance transaction
 */
export const startTransaction = (
  name: string,
  op: string = 'custom',
): Sentry.Transaction | null => {
  try {
    return Sentry.startTransaction({name, op});
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to start Sentry transaction:', error);
    }
    return null;
  }
};

/**
 * Wrap the root component with Sentry
 * This enables automatic error boundary and performance tracking
 * Note: Use Sentry.wrap directly in App.tsx
 */
