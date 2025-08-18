import React from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  visible?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ visible = false }) => {
  const { metrics, config, level, isOptimizing } = usePerformance();

  if (!visible) return null;

  return (
    <div className="performance-monitor">
      <div className="performance-monitor__header">
        <h3>Performance Monitor</h3>
        <span className={`performance-level performance-level--${level}`}>
          {level.toUpperCase()}
        </span>
      </div>
      
      <div className="performance-monitor__content">
        <div className="performance-section">
          <h4>Metrics</h4>
          <div className="metric">
            <span className="metric__label">FPS:</span>
            <span className={`metric__value ${metrics.fps < 30 ? 'metric__value--warning' : ''}`}>
              {metrics.fps}
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">Memory:</span>
            <span className="metric__value">
              {metrics.memoryUsage.toFixed(1)} MB
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">Draw Calls:</span>
            <span className="metric__value">{metrics.drawCalls}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Triangles:</span>
            <span className="metric__value">{metrics.triangleCount.toLocaleString()}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Render Time:</span>
            <span className="metric__value">{metrics.renderTime.toFixed(2)}ms</span>
          </div>
        </div>

        <div className="performance-section">
          <h4>Configuration</h4>
          <div className="metric">
            <span className="metric__label">Quality:</span>
            <span className="metric__value">{config.quality}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Target FPS:</span>
            <span className="metric__value">{config.targetFPS}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Shadows:</span>
            <span className="metric__value">{config.shadowQuality}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Antialiasing:</span>
            <span className="metric__value">{config.antialiasing ? 'ON' : 'OFF'}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Auto Optimize:</span>
            <span className={`metric__value ${isOptimizing ? 'metric__value--active' : ''}`}>
              {isOptimizing ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;