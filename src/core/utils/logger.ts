/**
 * Logger Utility
 * Development/Production için akıllı logging sistemi
 */

// React Native'de __DEV__ global olarak mevcut
declare const __DEV__: boolean;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
  maxLogLength: number;
}

const defaultConfig: LogConfig = {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR,
  enableInProduction: false,
  maxLogLength: 200,
};

class Logger {
  private config: LogConfig;

  constructor(config: LogConfig = defaultConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!__DEV__ && !this.config.enableInProduction) {
      return level >= LogLevel.ERROR;
    }
    return level >= this.config.level;
  }

  private formatMessage(message: string, data?: any): string {
    let formattedMessage = message;
    
    if (data) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
      formattedMessage += ` ${dataStr}`;
    }

    // Production'da log uzunluğunu sınırla
    if (!__DEV__ && formattedMessage.length > this.config.maxLogLength) {
      formattedMessage = formattedMessage.substring(0, this.config.maxLogLength) + '...';
    }

    return formattedMessage;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 ${this.formatMessage(message, data)}`);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️ ${this.formatMessage(message, data)}`);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ ${this.formatMessage(message, data)}`);
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${this.formatMessage(message, data)}`);
    }
  }

  // Özel kategoriler için logger'lar
  auth = {
    debug: (message: string, data?: any) => this.debug(`[AUTH] ${message}`, data),
    info: (message: string, data?: any) => this.info(`[AUTH] ${message}`, data),
    warn: (message: string, data?: any) => this.warn(`[AUTH] ${message}`, data),
    error: (message: string, data?: any) => this.error(`[AUTH] ${message}`, data),
  };

  api = {
    debug: (message: string, data?: any) => this.debug(`[API] ${message}`, data),
    info: (message: string, data?: any) => this.info(`[API] ${message}`, data),
    warn: (message: string, data?: any) => this.warn(`[API] ${message}`, data),
    error: (message: string, data?: any) => this.error(`[API] ${message}`, data),
  };

  storage = {
    debug: (message: string, data?: any) => this.debug(`[STORAGE] ${message}`, data),
    info: (message: string, data?: any) => this.info(`[STORAGE] ${message}`, data),
    warn: (message: string, data?: any) => this.warn(`[STORAGE] ${message}`, data),
    error: (message: string, data?: any) => this.error(`[STORAGE] ${message}`, data),
  };

  network = {
    debug: (message: string, data?: any) => this.debug(`[NETWORK] ${message}`, data),
    info: (message: string, data?: any) => this.info(`[NETWORK] ${message}`, data),
    warn: (message: string, data?: any) => this.warn(`[NETWORK] ${message}`, data),
    error: (message: string, data?: any) => this.error(`[NETWORK] ${message}`, data),
  };
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error } = logger;
export const { auth, api, storage, network } = logger;