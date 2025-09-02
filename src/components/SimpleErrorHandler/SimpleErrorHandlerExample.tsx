/**
 * SimpleErrorHandler Example Component
 * 
 * Bu bileşen SimpleErrorHandler'ın nasıl kullanılacağını gösterir
 */

import React, { useState } from 'react';
import { useSimpleErrorHandler } from '../../hooks/useSimpleErrorHandler';

export function SimpleErrorHandlerExample() {
  const {
    handleError,
    handleAssetError,
    handleNetworkError,
    handleMemoryError,
    safeExecute,
    showMessage,
    systemHealth,
    wrapAsync,
    wrapSync,
    isHandlingError
  } = useSimpleErrorHandler();

  const [result, setResult] = useState<string>('');

  // Basit hata yakalama örneği
  const handleBasicError = async () => {
    const result = await handleError(
      'Bu bir test hatasıdır',
      'unknown',
      { showToUser: true, autoRecover: true }
    );
    setResult(`Basit hata: ${result.message}`);
  };

  // Asset yükleme hatası örneği
  const handleAssetLoadError = async () => {
    const result = await handleAssetError(
      'test-model',
      '/models/nonexistent.glb',
      new Error('Model bulunamadı'),
      { showToUser: true }
    );
    setResult(`Asset hatası: ${result.message}`);
  };

  // Network hatası örneği
  const handleNetworkErrorExample = async () => {
    const result = await handleNetworkError(
      'https://nonexistent-api.com/data',
      new Error('Network timeout'),
      { showToUser: true }
    );
    setResult(`Network hatası: ${result.message}`);
  };

  // Memory hatası örneği
  const handleMemoryErrorExample = async () => {
    const result = await handleMemoryError(
      1024, // 1GB kullanım
      { showToUser: true }
    );
    setResult(`Memory hatası: ${result.message}`);
  };

  // Safe execute örneği
  const handleSafeExecute = async () => {
    const result = await safeExecute(
      async () => {
        // Başarısız olacak bir işlem simüle et
        if (Math.random() > 0.5) {
          throw new Error('Rastgele hata oluştu');
        }
        return 'İşlem başarılı!';
      },
      'Fallback sonucu',
      'unknown'
    );
    setResult(`Safe execute: ${result}`);
  };

  // Wrapped function örneği
  const riskyAsyncOperation = async (value: string) => {
    if (value === 'error') {
      throw new Error('Kasıtlı hata');
    }
    return `İşlem tamamlandı: ${value}`;
  };

  const safeAsyncOperation = wrapAsync(riskyAsyncOperation, 'unknown');

  const handleWrappedAsync = async () => {
    const result = await safeAsyncOperation('error');
    setResult(`Wrapped async: ${result || 'Hata yakalandı'}`);
  };

  // Sync function wrapper örneği
  const riskySyncOperation = (value: string) => {
    if (value === 'error') {
      throw new Error('Sync hata');
    }
    return `Sync işlem: ${value}`;
  };

  const safeSyncOperation = wrapSync(riskySyncOperation, 'unknown');

  const handleWrappedSync = () => {
    const result = safeSyncOperation('error');
    setResult(`Wrapped sync: ${result || 'Hata yakalandı'}`);
  };

  // Mesaj gösterme örnekleri
  const showInfoMessage = () => {
    showMessage('Bu bir bilgi mesajıdır', 'info', 3000);
  };

  const showWarningMessage = () => {
    showMessage('Bu bir uyarı mesajıdır', 'warning', 3000);
  };

  const showErrorMessage = () => {
    showMessage('Bu bir hata mesajıdır', 'error', 3000);
  };

  const showCriticalMessage = () => {
    showMessage('Bu kritik bir mesajdır', 'critical', 5000);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>SimpleErrorHandler Örnek Kullanımları</h1>
      
      {/* Sistem Durumu */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: systemHealth.healthy ? '#e8f5e8' : '#ffe8e8',
        borderRadius: '8px',
        border: `2px solid ${systemHealth.healthy ? '#4caf50' : '#f44336'}`
      }}>
        <h3>Sistem Durumu: {systemHealth.healthy ? '✅ Sağlıklı' : '⚠️ Sorunlu'}</h3>
        {systemHealth.issues.length > 0 && (
          <div>
            <strong>Sorunlar:</strong>
            <ul>
              {systemHealth.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {systemHealth.recommendations.length > 0 && (
          <div>
            <strong>Öneriler:</strong>
            <ul>
              {systemHealth.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Loading Durumu */}
      {isHandlingError && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          🔄 Hata işleniyor...
        </div>
      )}

      {/* Sonuç Gösterimi */}
      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          marginBottom: '20px',
          fontFamily: 'monospace'
        }}>
          <strong>Son Sonuç:</strong> {result}
        </div>
      )}

      {/* Hata Yakalama Örnekleri */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Hata Yakalama Örnekleri</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button onClick={handleBasicError} style={buttonStyle}>
            Basit Hata
          </button>
          <button onClick={handleAssetLoadError} style={buttonStyle}>
            Asset Hatası
          </button>
          <button onClick={handleNetworkErrorExample} style={buttonStyle}>
            Network Hatası
          </button>
          <button onClick={handleMemoryErrorExample} style={buttonStyle}>
            Memory Hatası
          </button>
        </div>
      </div>

      {/* Güvenli Çalıştırma Örnekleri */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Güvenli Çalıştırma Örnekleri</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button onClick={handleSafeExecute} style={buttonStyle}>
            Safe Execute
          </button>
          <button onClick={handleWrappedAsync} style={buttonStyle}>
            Wrapped Async
          </button>
          <button onClick={handleWrappedSync} style={buttonStyle}>
            Wrapped Sync
          </button>
        </div>
      </div>

      {/* Mesaj Gösterme Örnekleri */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Mesaj Gösterme Örnekleri</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <button onClick={showInfoMessage} style={{...buttonStyle, backgroundColor: '#2196f3'}}>
            Info Mesajı
          </button>
          <button onClick={showWarningMessage} style={{...buttonStyle, backgroundColor: '#ff9800'}}>
            Uyarı Mesajı
          </button>
          <button onClick={showErrorMessage} style={{...buttonStyle, backgroundColor: '#f44336'}}>
            Hata Mesajı
          </button>
          <button onClick={showCriticalMessage} style={{...buttonStyle, backgroundColor: '#d32f2f'}}>
            Kritik Mesaj
          </button>
        </div>
      </div>

      {/* Kullanım Kılavuzu */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>Kullanım Kılavuzu</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <h3>1. Basit Hata Yakalama:</h3>
          <pre style={codeStyle}>
{`const { handleError } = useSimpleErrorHandler();
await handleError('Hata mesajı', 'loading', { 
  showToUser: true, 
  autoRecover: true 
});`}
          </pre>

          <h3>2. Güvenli Fonksiyon Çalıştırma:</h3>
          <pre style={codeStyle}>
{`const { safeExecute } = useSimpleErrorHandler();
const result = await safeExecute(
  () => riskyOperation(),
  'fallback değeri',
  'network'
);`}
          </pre>

          <h3>3. Fonksiyon Sarmalama:</h3>
          <pre style={codeStyle}>
{`const { wrapAsync } = useSimpleErrorHandler();
const safeFunction = wrapAsync(riskyAsyncFunction, 'loading');
const result = await safeFunction(params);`}
          </pre>

          <h3>4. Kullanıcı Mesajları:</h3>
          <pre style={codeStyle}>
{`const { showMessage } = useSimpleErrorHandler();
showMessage('İşlem tamamlandı!', 'info', 3000);`}
          </pre>
        </div>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 15px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s'
};

const codeStyle: React.CSSProperties = {
  backgroundColor: '#f1f3f4',
  padding: '10px',
  borderRadius: '4px',
  fontSize: '12px',
  overflow: 'auto',
  border: '1px solid #e1e5e9'
};