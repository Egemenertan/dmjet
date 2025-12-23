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
 * 
 * NOTE: Currently disabled for build compatibility
 * Will be enabled in future updates
 */

/**
 * Initialize Sentry
 * Call this once at app startup
 */
export const initSentry = () => {
  // Sentry temporarily disabled for build compatibility
  console.log('Sentry: Disabled for build compatibility');
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
  // Stub function
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  // Stub function
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: any = 'info',
  data?: Record<string, any>
) => {
  // Stub function
};

/**
 * Capture exception manually
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>
) => {
  // Log to console in development
  if (__DEV__) {
    console.error('Error:', error, context);
  }
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: any = 'info',
  context?: Record<string, any>
) => {
  // Log to console in development
  if (__DEV__) {
    console.log('Message:', message, level, context);
  }
};

/**
 * Set custom tags
 */
export const setTag = (key: string, value: string) => {
  // Stub function
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, any>) => {
  // Stub function
};

/**
 * Start a performance transaction
 */
export const startTransaction = (
  name: string,
  op: string = 'custom'
): any => {
  return {
    finish: () => {},
  };
};

