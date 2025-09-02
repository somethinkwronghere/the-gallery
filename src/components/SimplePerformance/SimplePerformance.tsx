import React, { memo, useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import { useSimpleMemoryManager } from '../../hooks/useSimpleMemoryManager';
import './SimplePerformance.css';

interface SimplePerformanceProps {
  visible?: boolean;
  mode?: 'minimal' | 'dashboard';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showMemoryDetails?: boolean;
  enableAutoCleanup?: boolean;
}

const SimplePerformance: React.FC<SimplePerformanceProps> = memo(({ 
  visible = true,
  mode = 'minimal',
  position = 'top-left',
  showMemoryDetails = false,
  enableAutoCleanup = true
}) => {
  const { metrics, level, isOptimizing } = usePerformance();
  const { 
    memoryStats, 
    warnings, 
    performCleanup 
  } = useSimpleMemoryManager({
    trackMemoryStats: true,
    enableAutoCleanup,
    memoryStatsInterval: 2000
  });

  // Memoize expensive calculations
  const performanceData = useMemo(() => {
    const getFPSColor = (fps: number): string => {
      if (fps >= 55) return '#10b981'; // emerald green
      if (fps >= 45) return '#22c55e'; // green
      if (fps >= 35) return '#eab308'; // yellow
      if (fps >= 25) return '#f59e0b'; // amber
      return '#ef4444'; // red
    };

    const getMemoryColor = (memoryMB: number, isMemoryPressure: boolean = false): string => {
      if (isMemoryPressure) return '#ef4444'; // red for memory pressure
      if (memoryMB < 200) return '#10b981'; // green
      if (memoryMB < 400) return '#eab308'; // yellow
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

    const getLevelText = (level: string): string => {
      switch (level) {
        case 'high': return 'YÜKSEK';
        case 'medium': return 'ORTA';
        case 'low': return 'DÜŞÜK';
        default: return 'AUTO';
      }
    };

    // Use memory stats from SimpleMemoryManager if available, fallback to performance metrics
    const memoryUsage = memoryStats?.totalMemoryMB ?? metrics.memoryUsage;
    const isMemoryPressure = memoryStats?.isMemoryPressure ?? false;

    return {
      fps: metrics.fps,
      memory: memoryUsage.toFixed(mode === 'minimal' ? 0 : 1),
      renderTime: metrics.renderTime.toFixed(1),
      fpsColor: getFPSColor(metrics.fps),
      memoryColor: getMemoryColor(memoryUsage, isMemoryPressure),
      levelColor: getLevelColor(level),
      levelText: getLevelText(level),
      hasMemoryWarnings: warnings.length > 0,
      isMemoryPressure
    };
  }, [metrics.fps, metrics.memoryUsage, metrics.renderTime, level, mode, memoryStats, warnings]);

  if (!visible) return null;

  if (mode === 'minimal') {
    return (
      <div className={`simple-performance simple-performance--minimal simple-performance--${position}`}>
        <div className="simple-performance__fps">
          <span 
            className="simple-performance__fps-value"
            style={{ color: performanceData.fpsColor }}
          >
            {performanceData.fps}
          </span>
          <span className="simple-performance__fps-label">FPS</span>
        </div>
        
        <div className="simple-performance__memory">
          <span 
            className="simple-performance__memory-value"
            style={{ color: performanceData.memoryColor }}
          >
            {performanceData.memory}
          </span>
          <span className="simple-performance__memory-label">MB</span>
        </div>
        
        <div 
          className="simple-performance__level"
          style={{ color: performanceData.levelColor }}
        >
          {performanceData.levelText}
        </div>
        
        {performanceData.hasMemoryWarnings && (
          <div 
            className="simple-performance__warning-indicator"
            title={`${warnings.length} memory warning(s)`}
          >
            ⚠️
          </div>
        )}
        
        {performanceData.isMemoryPressure && (
          <button
            className="simple-performance__cleanup-btn"
            onClick={performCleanup}
            title="Perform memory cleanup"
          >
            🧹
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="simple-performance simple-performance--dashboard">
      <div className="simple-performance__header">
        <h3>Performance</h3>
        <div className="simple-performance__status">
          <span 
            className={`simple-performance__level-badge simple-performance__level-badge--${level}`}
            style={{ backgroundColor: performanceData.levelColor }}
          >
            {performanceData.levelText}
          </span>
          {isOptimizing && (
            <span className="simple-performance__optimizing">
              AUTO
            </span>
          )}
          {performanceData.hasMemoryWarnings && (
            <span className="simple-performance__warning-badge" title="Memory warnings">
              ⚠️
            </span>
          )}
        </div>
      </div>
      
      <div className="simple-performance__metrics">
        <div className="simple-performance__metric">
          <div className="simple-performance__metric-label">Frame Rate</div>
          <div 
            className="simple-performance__metric-value"
            style={{ color: performanceData.fpsColor }}
          >
            {performanceData.fps} FPS
          </div>
        </div>
        
        <div className="simple-performance__metric">
          <div className="simple-performance__metric-label">Memory Usage</div>
          <div 
            className="simple-performance__metric-value"
            style={{ color: performanceData.memoryColor }}
          >
            {performanceData.memory} MB
          </div>
        </div>
        
        <div className="simple-performance__metric">
          <div className="simple-performance__metric-label">Render Time</div>
          <div className="simple-performance__metric-value">
            {performanceData.renderTime}ms
          </div>
        </div>
        
        {showMemoryDetails && memoryStats && (
          <>
            <div className="simple-performance__metric">
              <div className="simple-performance__metric-label">Resources</div>
              <div className="simple-performance__metric-value">
                {memoryStats.resourceCount}
              </div>
            </div>
            
            <div className="simple-performance__metric">
              <div className="simple-performance__metric-label">JS Heap</div>
              <div className="simple-performance__metric-value">
                {memoryStats.jsHeapMB.toFixed(1)} MB
              </div>
            </div>
          </>
        )}
      </div>
      
      {performanceData.hasMemoryWarnings && (
        <div className="simple-performance__memory-warnings">
          <div className="simple-performance__warnings-header">
            Memory Warnings ({warnings.length})
          </div>
          {warnings.slice(0, 2).map((warning, index) => (
            <div key={index} className="simple-performance__warning">
              <span className="simple-performance__warning-level">
                {warning.level.toUpperCase()}:
              </span>
              <span className="simple-performance__warning-message">
                {warning.message}
              </span>
            </div>
          ))}
          {performanceData.isMemoryPressure && (
            <button
              className="simple-performance__cleanup-btn simple-performance__cleanup-btn--dashboard"
              onClick={performCleanup}
            >
              🧹 Clean Memory
            </button>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.mode === nextProps.mode &&
    prevProps.position === nextProps.position &&
    prevProps.showMemoryDetails === nextProps.showMemoryDetails &&
    prevProps.enableAutoCleanup === nextProps.enableAutoCleanup
  );
});

SimplePerformance.displayName = 'SimplePerformance';

export default SimplePerformance;