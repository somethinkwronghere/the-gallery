/**
 * SimpleErrorHandler - Basit hata yönetimi utility'si
 * 
 * Mevcut karmaşık ErrorRecoveryManager sistemini basitleştiren
 * kullanıcı dostu bir arayüz sağlar.
 */

import { errorRecoveryManager } from '../systems/error/ErrorRecoveryManager';
import { 
  ErrorType, 
  ErrorSeverity, 
  ErrorInfo, 
  RecoveryStrategy,
  RecoveryResult 
} from '../types/error';

export type SimpleErrorType = 
  | 'loading' 
  | 'network' 
  | 'memory' 
  | 'graphics' 
  | 'performance' 
  | 'unknown';

export type SimpleErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export interface SimpleErrorOptions {
  showToUser?: boolean;
  autoRecover?: boolean;
  fallbackMessage?: string;
  retryCount?: number;
}

export interface SimpleErrorResult {
  success: boolean;
  message: string;
  recovered: boolean;
}

/**
 * Basit hata yönetimi sınıfı
 * Karmaşık error recovery sistemini basit bir API ile sarmallar
 */
export class SimpleErrorHandler {
  private static instance: SimpleErrorHandler;
  private toastContainer: HTMLElement | null = null;

  private constructor() {
    this.setupToastContainer();
  }

  public static getInstance(): SimpleErrorHandler {
    if (!SimpleErrorHandler.instance) {
      SimpleErrorHandler.instance = new SimpleErrorHandler();
    }
    return SimpleErrorHandler.instance;
  }

  /**
   * Ana hata yakalama metodu - basit kullanım için
   */
  public async handleError(
    error: Error | string,
    type: SimpleErrorType = 'unknown',
    options: SimpleErrorOptions = {}
  ): Promise<SimpleErrorResult> {
    const {
      showToUser = true,
      autoRecover = true,
      fallbackMessage = 'Bir sorun oluştu, düzeltmeye çalışıyoruz...',
      retryCount = 0
    } = options;

    try {
      // Error'u string'e çevir
      const errorMessage = error instanceof Error ? error.message : error;
      
      // Basit error type'ı karmaşık error type'a çevir
      const complexErrorType = this.mapSimpleToComplexType(type);
      const severity = this.determineSeverity(type, retryCount);
      
      // Error info oluştur
      const errorInfo: ErrorInfo = {
        type: complexErrorType,
        severity,
        message: errorMessage,
        timestamp: new Date(),
        context: { 
          simpleType: type, 
          retryCount,
          userFriendly: true 
        },
        recoveryStrategies: this.getRecoveryStrategies(type, severity)
      };

      // Kullanıcıya göster
      if (showToUser) {
        this.showUserMessage(errorMessage, this.mapSeverityToLevel(severity));
      }

      // Otomatik kurtarma dene
      if (autoRecover) {
        try {
          const recoveryResult = await errorRecoveryManager.executeRecoveryStrategy(
            errorInfo.recoveryStrategies[0],
            errorInfo.context
          );

          return {
            success: recoveryResult.success,
            message: recoveryResult.success ? 
              'Sorun çözüldü!' : 
              fallbackMessage,
            recovered: recoveryResult.success
          };
        } catch (recoveryError) {
          console.warn('Recovery strategy failed:', recoveryError);
          // Fallback to logging only
        }
      }

      // Sadece log'la
      errorRecoveryManager.logError(errorInfo);
      
      return {
        success: false,
        message: fallbackMessage,
        recovered: false
      };

    } catch (handlingError) {
      console.error('SimpleErrorHandler: Hata işlenirken sorun oluştu:', handlingError);
      
      if (showToUser) {
        this.showUserMessage(fallbackMessage, 'error');
      }

      return {
        success: false,
        message: fallbackMessage,
        recovered: false
      };
    }
  }

  /**
   * Asset yükleme hatalarını yakala
   */
  public async handleAssetError(
    assetId: string,
    url: string,
    error: Error,
    options: SimpleErrorOptions = {}
  ): Promise<SimpleErrorResult> {
    const retryCount = options.retryCount || 0;
    
    try {
      const result = await errorRecoveryManager.handleAssetLoadError({
        assetId,
        url,
        type: this.getAssetTypeFromUrl(url),
        error,
        retryCount,
        timestamp: new Date()
      });

      const userMessage = result.success ? 
        'Dosya yüklendi' : 
        `${assetId} yüklenemedi, alternatif gösteriliyor`;

      if (options.showToUser !== false) {
        this.showUserMessage(userMessage, result.success ? 'info' : 'warning');
      }

      return {
        success: result.success,
        message: userMessage,
        recovered: result.success
      };

    } catch (error) {
      return this.handleError(
        `Asset yükleme hatası: ${assetId}`,
        'loading',
        options
      );
    }
  }

  /**
   * Network hatalarını yakala
   */
  public async handleNetworkError(
    url: string,
    error: Error,
    options: SimpleErrorOptions = {}
  ): Promise<SimpleErrorResult> {
    const message = `Bağlantı sorunu: ${url}`;
    
    if (options.showToUser !== false) {
      this.showUserMessage(
        'İnternet bağlantınızı kontrol edin',
        'warning'
      );
    }

    return this.handleError(message, 'network', {
      ...options,
      showToUser: false // Zaten gösterdik
    });
  }

  /**
   * Memory hatalarını yakala
   */
  public async handleMemoryError(
    currentUsage: number,
    options: SimpleErrorOptions = {}
  ): Promise<SimpleErrorResult> {
    const message = `Bellek kullanımı yüksek: ${currentUsage.toFixed(2)}MB`;
    
    if (options.showToUser !== false) {
      this.showUserMessage(
        'Performans için kalite düşürülüyor...',
        'info'
      );
    }

    try {
      const result = await errorRecoveryManager.handleOutOfMemory({
        currentUsage,
        maxUsage: currentUsage * 1.2,
        threshold: 512,
        timestamp: new Date(),
        criticalAssets: []
      });

      return {
        success: result.success,
        message: result.success ? 'Bellek temizlendi' : 'Bellek sorunu devam ediyor',
        recovered: result.success
      };

    } catch (error) {
      return this.handleError(message, 'memory', {
        ...options,
        showToUser: false
      });
    }
  }

  /**
   * Performance hatalarını yakala
   */
  public async handlePerformanceError(
    fps: number,
    options: SimpleErrorOptions = {}
  ): Promise<SimpleErrorResult> {
    const message = `Düşük performans: ${fps} FPS`;
    
    if (options.showToUser !== false && fps < 15) {
      this.showUserMessage(
        'Performans iyileştiriliyor...',
        'info'
      );
    }

    return this.handleError(message, 'performance', {
      ...options,
      showToUser: false,
      autoRecover: true
    });
  }

  /**
   * Try-catch blokları için basit wrapper
   */
  public async safeExecute<T>(
    operation: () => Promise<T> | T,
    fallback?: T,
    errorType: SimpleErrorType = 'unknown'
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error as Error, errorType, {
        showToUser: true,
        autoRecover: true
      });
      return fallback;
    }
  }

  /**
   * Kullanıcı dostu hata mesajı göster
   */
  public showUserMessage(
    message: string, 
    level: SimpleErrorLevel = 'info',
    duration: number = 4000
  ): void {
    if (!this.toastContainer) {
      this.setupToastContainer();
    }

    const toast = document.createElement('div');
    toast.className = `simple-error-toast simple-error-${level}`;
    toast.textContent = message;
    
    // Stil uygula
    this.applyToastStyles(toast, level);
    
    // Container'a ekle
    this.toastContainer?.appendChild(toast);
    
    // Animasyon
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Otomatik kaldır
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Sistem durumunu kontrol et
   */
  public getSystemHealth(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    try {
      const errorHistory = errorRecoveryManager.getErrorHistory ? 
        errorRecoveryManager.getErrorHistory() : [];
      
      const recentErrors = errorHistory.filter(
        error => error.timestamp > new Date(Date.now() - 5 * 60 * 1000)
      );

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (recentErrors.length > 5) {
        issues.push('Çok fazla hata oluşuyor');
        recommendations.push('Sayfayı yenileyin');
      }

      const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        issues.push('Kritik sistem hataları var');
        recommendations.push('Tarayıcınızı güncelleyin');
      }

      const memoryErrors = recentErrors.filter(e => e.type === 'out_of_memory');
      if (memoryErrors.length > 2) {
        issues.push('Bellek sorunları devam ediyor');
        recommendations.push('Diğer sekmeleri kapatın');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        healthy: false,
        issues: ['Sistem durumu kontrol edilemiyor'],
        recommendations: ['Sayfayı yenileyin']
      };
    }
  }

  // Private helper methods

  private setupToastContainer(): void {
    this.toastContainer = document.getElementById('simple-error-toasts');
    
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'simple-error-toasts';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        max-width: 350px;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  private applyToastStyles(toast: HTMLElement, level: SimpleErrorLevel): void {
    const colors = {
      info: '#2196f3',
      warning: '#ff9800', 
      error: '#f44336',
      critical: '#d32f2f'
    };

    toast.style.cssText = `
      background: ${colors[level]};
      color: white;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
      max-width: 100%;
      word-wrap: break-word;
    `;

    // Tıklayınca kapat
    toast.addEventListener('click', () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }

  private mapSimpleToComplexType(simpleType: SimpleErrorType): ErrorType {
    const mapping: Record<SimpleErrorType, ErrorType> = {
      loading: 'asset_load_failure',
      network: 'network_error',
      memory: 'out_of_memory',
      graphics: 'webgl_context_loss',
      performance: 'performance_critical',
      unknown: 'unknown_error'
    };
    return mapping[simpleType];
  }

  private determineSeverity(type: SimpleErrorType, retryCount: number): ErrorSeverity {
    if (type === 'graphics' || type === 'memory') return 'critical';
    if (type === 'performance' || retryCount >= 3) return 'high';
    if (type === 'network' || retryCount >= 1) return 'medium';
    return 'low';
  }

  private mapSeverityToLevel(severity: ErrorSeverity): SimpleErrorLevel {
    const mapping: Record<ErrorSeverity, SimpleErrorLevel> = {
      low: 'info',
      medium: 'warning', 
      high: 'error',
      critical: 'critical'
    };
    return mapping[severity];
  }

  private getRecoveryStrategies(type: SimpleErrorType, severity: ErrorSeverity): RecoveryStrategy[] {
    switch (type) {
      case 'loading':
        return severity === 'high' ? ['fallback'] : ['retry', 'fallback'];
      case 'network':
        return ['retry', 'notify_user'];
      case 'memory':
        return ['emergency_cleanup', 'degrade_quality'];
      case 'graphics':
        return ['context_restore', 'reload_page'];
      case 'performance':
        return ['degrade_quality', 'emergency_cleanup'];
      default:
        return ['notify_user'];
    }
  }

  private getAssetTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'glb':
      case 'gltf':
        return 'model';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return 'texture';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      default:
        return 'unknown';
    }
  }
}

// Singleton instance export
export const simpleErrorHandler = SimpleErrorHandler.getInstance();

// Convenience functions for common use cases
export const handleError = (
  error: Error | string, 
  type?: SimpleErrorType, 
  options?: SimpleErrorOptions
) => simpleErrorHandler.handleError(error, type, options);

export const safeExecute = <T>(
  operation: () => Promise<T> | T,
  fallback?: T,
  errorType?: SimpleErrorType
) => simpleErrorHandler.safeExecute(operation, fallback, errorType);

export const showMessage = (
  message: string,
  level?: SimpleErrorLevel,
  duration?: number
) => simpleErrorHandler.showUserMessage(message, level, duration);