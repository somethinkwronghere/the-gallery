import React, { memo } from 'react'
import { useSimpleMemoryManager } from '../../hooks/useSimpleMemoryManager'
import './SimpleMemoryMonitor.css'

export interface SimpleMemoryMonitorProps {
  visible?: boolean
  mode?: 'minimal' | 'detailed'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showWarnings?: boolean
  autoCleanup?: boolean
}

const SimpleMemoryMonitor: React.FC<SimpleMemoryMonitorProps> = memo(({
  visible = true,
  mode = 'minimal',
  position = 'top-right',
  showWarnings = true,
  autoCleanup = true
}) => {
  const {
    memoryStats,
    warnings,
    performCleanup,
    performEmergencyCleanup,
    updateConfig
  } = useSimpleMemoryManager({
    trackMemoryStats: true,
    enableAutoCleanup: autoCleanup,
    memoryStatsInterval: 3000 // Update every 3 seconds
  })

  if (!visible || !memoryStats) return null

  const getMemoryColor = (memoryMB: number, isMemoryPressure: boolean): string => {
    if (isMemoryPressure) return '#ef4444' // red
    if (memoryMB > 300) return '#f59e0b' // amber
    if (memoryMB > 200) return '#eab308' // yellow
    return '#10b981' // green
  }

  const getWarningColor = (level: string): string => {
    switch (level) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#65a30d'
      default: return '#6b7280'
    }
  }

  const memoryColor = getMemoryColor(memoryStats.totalMemoryMB, memoryStats.isMemoryPressure)
  const hasWarnings = warnings.length > 0
  const criticalWarnings = warnings.filter(w => w.level === 'critical' || w.level === 'high')

  if (mode === 'minimal') {
    return (
      <div className={`simple-memory-monitor simple-memory-monitor--minimal simple-memory-monitor--${position}`}>
        <div className="simple-memory-monitor__memory">
          <span 
            className="simple-memory-monitor__memory-value"
            style={{ color: memoryColor }}
          >
            {memoryStats.totalMemoryMB.toFixed(0)}
          </span>
          <span className="simple-memory-monitor__memory-label">MB</span>
        </div>
        
        {hasWarnings && (
          <div 
            className="simple-memory-monitor__warning-indicator"
            style={{ backgroundColor: getWarningColor(warnings[0].level) }}
            title={`${warnings.length} memory warning(s)`}
          >
            !
          </div>
        )}
        
        {memoryStats.isMemoryPressure && (
          <button
            className="simple-memory-monitor__cleanup-btn"
            onClick={performCleanup}
            title="Perform memory cleanup"
          >
            🧹
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="simple-memory-monitor simple-memory-monitor--detailed">
      <div className="simple-memory-monitor__header">
        <h3>Memory Monitor</h3>
        <div className="simple-memory-monitor__actions">
          <button
            className="simple-memory-monitor__action-btn"
            onClick={performCleanup}
            title="Perform cleanup"
          >
            🧹
          </button>
          {criticalWarnings.length > 0 && (
            <button
              className="simple-memory-monitor__action-btn simple-memory-monitor__action-btn--emergency"
              onClick={performEmergencyCleanup}
              title="Emergency cleanup"
            >
              🚨
            </button>
          )}
        </div>
      </div>

      <div className="simple-memory-monitor__stats">
        <div className="simple-memory-monitor__stat">
          <div className="simple-memory-monitor__stat-label">Total Memory</div>
          <div 
            className="simple-memory-monitor__stat-value"
            style={{ color: memoryColor }}
          >
            {memoryStats.totalMemoryMB.toFixed(1)} MB
          </div>
        </div>

        <div className="simple-memory-monitor__stat">
          <div className="simple-memory-monitor__stat-label">JS Heap</div>
          <div className="simple-memory-monitor__stat-value">
            {memoryStats.jsHeapMB.toFixed(1)} MB
          </div>
        </div>

        <div className="simple-memory-monitor__stat">
          <div className="simple-memory-monitor__stat-label">Textures</div>
          <div className="simple-memory-monitor__stat-value">
            {memoryStats.textureMemoryMB.toFixed(1)} MB
          </div>
        </div>

        <div className="simple-memory-monitor__stat">
          <div className="simple-memory-monitor__stat-label">Geometries</div>
          <div className="simple-memory-monitor__stat-value">
            {memoryStats.geometryMemoryMB.toFixed(1)} MB
          </div>
        </div>

        <div className="simple-memory-monitor__stat">
          <div className="simple-memory-monitor__stat-label">Resources</div>
          <div className="simple-memory-monitor__stat-value">
            {memoryStats.resourceCount}
          </div>
        </div>
      </div>

      {showWarnings && warnings.length > 0 && (
        <div className="simple-memory-monitor__warnings">
          <div className="simple-memory-monitor__warnings-header">
            Memory Warnings ({warnings.length})
          </div>
          {warnings.slice(0, 3).map((warning, index) => (
            <div 
              key={index}
              className="simple-memory-monitor__warning"
              style={{ borderLeftColor: getWarningColor(warning.level) }}
            >
              <div className="simple-memory-monitor__warning-level">
                {warning.level.toUpperCase()}
              </div>
              <div className="simple-memory-monitor__warning-message">
                {warning.message}
              </div>
              {warning.recommendations.length > 0 && (
                <div className="simple-memory-monitor__warning-recommendations">
                  {warning.recommendations.slice(0, 2).map((rec, recIndex) => (
                    <div key={recIndex} className="simple-memory-monitor__recommendation">
                      • {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="simple-memory-monitor__config">
        <label className="simple-memory-monitor__config-item">
          <input
            type="checkbox"
            checked={autoCleanup}
            onChange={(e) => updateConfig({ autoCleanupEnabled: e.target.checked })}
          />
          Auto Cleanup
        </label>
      </div>
    </div>
  )
})

SimpleMemoryMonitor.displayName = 'SimpleMemoryMonitor'

export default SimpleMemoryMonitor