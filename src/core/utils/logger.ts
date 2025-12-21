/**
 * Logger Utility
 * Provides safe logging that respects environment (dev/prod)
 * Integrated with Sentry for error tracking
 */

import { captureException, captureMessage, addBreadcrumb } from '@/core/services/sentry';

const isDev = __DEV__;

/**
 * Safe logger that only logs in development mode
 * In production, only errors and warnings are logged
 */
export const logger = {
  /**
   * Log general information (dev only)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged and sent to Sentry)
   */
  error: (...args: any[]) => {
    console.error(...args);
    
    // Send to Sentry in production
    if (!isDev) {
      const error = args[0];
      if (error instanceof Error) {
        captureException(error, { additionalData: args.slice(1) });
      } else {
        captureMessage(String(error), 'error', { additionalData: args });
      }
    }
  },

  /**
   * Log warnings (always logged and sent to Sentry)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
    
    // Send to Sentry as warning in production
    if (!isDev) {
      captureMessage(String(args[0]), 'warning', { additionalData: args.slice(1) });
    }
  },

  /**
   * Log debug information (dev only)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log info with context (dev only)
   */
  info: (message: string, context?: any) => {
    if (isDev) {
      console.info(`ℹ️ ${message}`, context || '');
    }
  },

  /**
   * Log success message (dev only)
   */
  success: (message: string, context?: any) => {
    if (isDev) {
      console.log(`✅ ${message}`, context || '');
    }
  },

  /**
   * Log API calls (dev only, breadcrumb in production)
   */
  api: (method: string, endpoint: string, data?: any) => {
    if (isDev) {
      console.log(`🌐 API ${method} ${endpoint}`, data || '');
    } else {
      // Add as breadcrumb for debugging in Sentry
      addBreadcrumb(`API ${method} ${endpoint}`, 'http', 'info', { data });
    }
  },

  /**
   * Log navigation events (dev only)
   */
  navigation: (screen: string, params?: any) => {
    if (isDev) {
      console.log(`📱 Navigation → ${screen}`, params || '');
    }
  },
};

/**
 * Performance logger for measuring execution time
 */
export class PerformanceLogger {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
    if (isDev) {
      console.time(label);
    }
  }

  /**
   * End performance measurement and log result
   */
  end() {
    if (isDev) {
      console.timeEnd(this.label);
      const duration = Date.now() - this.startTime;
      console.log(`⏱️ ${this.label} took ${duration}ms`);
    }
  }
}

/**
 * Create a performance logger
 * @param label - Label for the performance measurement
 * @returns PerformanceLogger instance
 */
export const performanceLog = (label: string): PerformanceLogger => {
  return new PerformanceLogger(label);
};

