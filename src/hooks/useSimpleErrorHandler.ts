/**
 * useSimpleErrorHandler - React hook for simple error handling
 * 
 * Basit hata yönetimi için React hook'u
 */

import { useCallback, useEffect, useState } from 'react';
import { 
  simpleErrorHandler, 
  SimpleErrorType, 
  SimpleErrorLevel, 
  SimpleErrorOptions,
  SimpleErrorResult 
} from '../utils/SimpleErrorHandler';

export interface UseSimpleErrorHandlerReturn {
  // Ana hata yakalama fonksiyonları
  handleError: (error: Error | string, type?: SimpleErrorType, options?: SimpleErrorOptions) => Promise<SimpleErrorResult>;
  handleAssetError: (assetId: string, url: string, error: Error, options?: SimpleErrorOptions) => Promise<SimpleErrorResult>;
  handleNetworkError: (url: string, error: Error, options?: SimpleErrorOptions) => Promise<SimpleErrorResult>;
  handleMemoryError: (currentUsage: number, options?: SimpleErrorOptions) => Promise<SimpleErrorResult>;
  handlePerformanceError: (fps: number, options?: SimpleErrorOptions) => Promise<SimpleErrorResult>;
  
  // Güvenli çalıştırma
  safeExecute: <T>(operation: () => Promise<T> | T, fallback?: T, errorType?: SimpleErrorType) => Promise<T | undefined>;
  
  // Kullanıcı mesajları
  showMessage: (message: string, level?: SimpleErrorLevel, duration?: number) => void;
  
  // Sistem durumu
  systemHealth: {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  };
  
  // Try-catch wrapper'ları
  wrapAsync: <T extends any[], R>(fn: (...args: T) => Promise<R>, errorType?: SimpleErrorType) => (...args: T) => Promise<R | undefined>;
  wrapSync: <T extends any[], R>(fn: (...args: T) => R, errorType?: SimpleErrorType) => (...args: T) => R | undefined;
  
  // Loading state'leri
  isHandlingError: boolean;
  lastError: SimpleErrorResult | null;
}

/**
 * Basit hata yönetimi hook'u
 */
export function useSimpleErrorHandler(): UseSimpleErrorHandlerReturn {
  const [isHandlingError, setIsHandlingError] = useState(false);
  const [lastError, setLastError] = useState<SimpleErrorResult | null>(null);
  const [systemHealth, setSystemHealth] = useState(() => simpleErrorHandler.getSystemHealth());

  // Ana hata yakalama fonksiyonu
  const handleError = useCallback(async (
    error: Error | string,
    type?: SimpleErrorType,
    options?: SimpleErrorOptions
  ): Promise<SimpleErrorResult> => {
    setIsHandlingError(true);
    try {
      const result = await simpleErrorHandler.handleError(error, type, options);
      setLastError(result);
      return result;
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Asset hata yakalama
  const handleAssetError = useCallback(async (
    assetId: string,
    url: string,
    error: Error,
    options?: SimpleErrorOptions
  ): Promise<SimpleErrorResult> => {
    setIsHandlingError(true);
    try {
      const result = await simpleErrorHandler.handleAssetError(assetId, url, error, options);
      setLastError(result);
      return result;
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Network hata yakalama
  const handleNetworkError = useCallback(async (
    url: string,
    error: Error,
    options?: SimpleErrorOptions
  ): Promise<SimpleErrorResult> => {
    setIsHandlingError(true);
    try {
      const result = await simpleErrorHandler.handleNetworkError(url, error, options);
      setLastError(result);
      return result;
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Memory hata yakalama
  const handleMemoryError = useCallback(async (
    currentUsage: number,
    options?: SimpleErrorOptions
  ): Promise<SimpleErrorResult> => {
    setIsHandlingError(true);
    try {
      const result = await simpleErrorHandler.handleMemoryError(currentUsage, options);
      setLastError(result);
      return result;
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Performance hata yakalama
  const handlePerformanceError = useCallback(async (
    fps: number,
    options?: SimpleErrorOptions
  ): Promise<SimpleErrorResult> => {
    setIsHandlingError(true);
    try {
      const result = await simpleErrorHandler.handlePerformanceError(fps, options);
      setLastError(result);
      return result;
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Güvenli çalıştırma
  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T> | T,
    fallback?: T,
    errorType?: SimpleErrorType
  ): Promise<T | undefined> => {
    setIsHandlingError(true);
    try {
      return await simpleErrorHandler.safeExecute(operation, fallback, errorType);
    } finally {
      setIsHandlingError(false);
    }
  }, []);

  // Mesaj gösterme
  const showMessage = useCallback((
    message: string,
    level?: SimpleErrorLevel,
    duration?: number
  ) => {
    simpleErrorHandler.showUserMessage(message, level, duration);
  }, []);

  // Async fonksiyon wrapper'ı
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorType: SimpleErrorType = 'unknown'
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      return safeExecute(() => fn(...args), undefined, errorType);
    };
  }, [safeExecute]);

  // Sync fonksiyon wrapper'ı
  const wrapSync = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    errorType: SimpleErrorType = 'unknown'
  ) => {
    return (...args: T): R | undefined => {
      try {
        return fn(...args);
      } catch (error) {
        handleError(error as Error, errorType, { showToUser: true });
        return undefined;
      }
    };
  }, [handleError]);

  // Sistem sağlığını periyodik olarak güncelle
  useEffect(() => {
    const updateSystemHealth = () => {
      setSystemHealth(simpleErrorHandler.getSystemHealth());
    };

    // İlk güncelleme
    updateSystemHealth();

    // Her 30 saniyede bir güncelle
    const interval = setInterval(updateSystemHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    handleError,
    handleAssetError,
    handleNetworkError,
    handleMemoryError,
    handlePerformanceError,
    safeExecute,
    showMessage,
    systemHealth,
    wrapAsync,
    wrapSync,
    isHandlingError,
    lastError
  };
}

/**
 * Component-level error boundary hook
 * Bileşen seviyesinde hata yakalama için
 */
export function useErrorBoundary() {
  const { handleError } = useSimpleErrorHandler();

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(
        event.error || event.message,
        'unknown',
        { showToUser: true, autoRecover: false }
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        `Promise rejection: ${event.reason}`,
        'unknown',
        { showToUser: true, autoRecover: false }
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  return { handleError };
}

/**
 * Asset loading hook with error handling
 * Asset yükleme için hata yakalama ile birlikte hook
 */
export function useAssetWithErrorHandling() {
  const { handleAssetError, safeExecute } = useSimpleErrorHandler();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAsset = useCallback(async (
    assetId: string,
    url: string,
    loader: (url: string) => Promise<any>
  ) => {
    setLoading(true);
    setError(null);

    const result = await safeExecute(
      async () => {
        const asset = await loader(url);
        return asset;
      },
      null,
      'loading'
    );

    setLoading(false);

    if (!result) {
      const errorMsg = `${assetId} yüklenemedi`;
      setError(errorMsg);
      await handleAssetError(assetId, url, new Error(errorMsg));
    }

    return result;
  }, [handleAssetError, safeExecute]);

  return {
    loadAsset,
    loading,
    error
  };
}

/**
 * Network request hook with error handling
 * Network istekleri için hata yakalama ile birlikte hook
 */
export function useNetworkWithErrorHandling() {
  const { handleNetworkError, safeExecute } = useSimpleErrorHandler();
  const [loading, setLoading] = useState(false);

  const request = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T | undefined> => {
    setLoading(true);

    const result = await safeExecute(
      async () => {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
      undefined,
      'network'
    );

    setLoading(false);
    return result;
  }, [safeExecute]);

  return {
    request,
    loading
  };
}