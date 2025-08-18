import React from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import './FPSCounter.css';

interface FPSCounterProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const FPSCounter: React.FC<FPSCounterProps> = ({ 
  visible = true, 
  position = 'top-left' 
}) => {
  const { metrics, level } = usePerformance();

  if (!visible) return null;

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return '#10b981'; // emerald green
    if (fps >= 45) return '#22c55e'; // green
    if (fps >= 35) return '#eab308'; // yellow
    if (fps >= 25) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'high': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'low': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <div className={`fps-counter fps-counter--${position}`}>
      <div className="fps-counter__main">
        <span 
          className="fps-counter__fps"
          style={{ color: getFPSColor(metrics.fps) }}
        >
          {metrics.fps}
        </span>
        <span className="fps-counter__label">FPS</span>
      </div>
      
      <div className="fps-counter__details">
        <div className="fps-counter__memory">
          {metrics.memoryUsage.toFixed(0)}MB
        </div>
        <div 
          className="fps-counter__level"
          style={{ color: getLevelColor(level) }}
        >
          {level.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default FPSCounter;