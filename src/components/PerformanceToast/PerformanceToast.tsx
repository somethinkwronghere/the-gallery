import React, { useState, useEffect } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import './PerformanceToast.css';

interface PerformanceToastProps {
  enabled?: boolean;
}

const PerformanceToast: React.FC<PerformanceToastProps> = ({ enabled = true }) => {
  const { metrics, config, actions } = usePerformance();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'warning' | 'info' | 'success'>('info');
  const [lastFPSCheck, setLastFPSCheck] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const checkPerformance = () => {
      const currentTime = Date.now();
      
      // Check every 3 seconds
      if (currentTime - lastFPSCheck < 3000) return;
      
      setLastFPSCheck(currentTime);

      // Low FPS warning
      if (metrics.fps < 25 && config.quality !== 'low') {
        setToastMessage('Düşük FPS tespit edildi. Performans modu etkinleştiriliyor...');
        setToastType('warning');
        setShowToast(true);
        
        // Auto-adjust to low quality
        actions.updateConfig({ quality: 'low' });
        
        setTimeout(() => setShowToast(false), 4000);
      }
      // High memory usage warning
      else if (metrics.memoryUsage > 800) {
        setToastMessage('Yüksek bellek kullanımı tespit edildi.');
        setToastType('warning');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      // Performance improvement notification
      else if (metrics.fps > 50 && config.quality === 'low') {
        setToastMessage('Performans iyileşti. Kalite artırılabilir.');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    };

    const interval = setInterval(checkPerformance, 1000);
    return () => clearInterval(interval);
  }, [metrics.fps, metrics.memoryUsage, config.quality, actions, enabled, lastFPSCheck]);

  if (!showToast) return null;

  return (
    <div className={`performance-toast performance-toast--${toastType}`}>
      <div className="performance-toast__icon">
        {toastType === 'warning' && '⚠️'}
        {toastType === 'success' && '✅'}
        {toastType === 'info' && 'ℹ️'}
      </div>
      <div className="performance-toast__message">
        {toastMessage}
      </div>
      <button 
        className="performance-toast__close"
        onClick={() => setShowToast(false)}
      >
        ×
      </button>
    </div>
  );
};

export default PerformanceToast;