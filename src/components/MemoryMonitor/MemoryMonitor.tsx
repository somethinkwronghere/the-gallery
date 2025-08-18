import React from 'react'
import { useMemoryManager } from '../../hooks/useMemoryManager'

interface MemoryMonitorProps {
  showDetails?: boolean
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ showDetails = false }) => {
  const {
    memoryUsage,
    warnings,
    isMonitoring,
    leakAnalysis,
    cleanupUnusedResources,
    forceGarbageCollection,
    getMemoryStats,
    getCleanupSuggestions
  } = useMemoryManager({
    enableAutoCleanup: true,
    enableLeakDetection: true,
    monitoringInterval: 10000, // 10 seconds
    memoryThreshold: 256 // 256 MB
  })

  const handleCleanup = () => {
    const disposed = cleanupUnusedResources()
    console.log(`Cleaned up ${disposed} unused resources`)
  }

  const handleForceGC = () => {
    const success = forceGarbageCollection()
    console.log(`Garbage collection ${success ? 'successful' : 'failed'}`)
  }

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ff4444'
      case 'high': return '#ff8800'
      case 'medium': return '#ffaa00'
      default: return '#44aa44'
    }
  }

  if (!showDetails) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        Memory: {memoryUsage.total}MB
        {warnings.length > 0 && (
          <span style={{ color: getWarningColor(warnings[0].level), marginLeft: '8px' }}>
            ⚠ {warnings.length}
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      minWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Memory Monitor</h3>
      
      {/* Memory Usage */}
      <div style={{ marginBottom: '12px' }}>
        <div><strong>Memory Usage:</strong></div>
        <div>Geometries: {memoryUsage.geometries}MB</div>
        <div>Materials: {memoryUsage.materials}MB</div>
        <div>Textures: {memoryUsage.textures}MB</div>
        <div>Total: {memoryUsage.total}MB</div>
        <div>JS Heap: {memoryUsage.jsHeap}MB / {memoryUsage.jsHeapLimit}MB</div>
      </div>

      {/* Monitoring Status */}
      <div style={{ marginBottom: '12px' }}>
        <div><strong>Status:</strong></div>
        <div>Monitoring: {isMonitoring ? '✅' : '❌'}</div>
        <div>Memory Leak: {leakAnalysis.isLeaking ? '⚠️' : '✅'}</div>
        {leakAnalysis.isLeaking && (
          <div style={{ fontSize: '10px', color: '#ffaa00' }}>
            Growth: {leakAnalysis.memoryGrowthRate.toFixed(2)}MB/min
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div><strong>Warnings:</strong></div>
          {warnings.slice(0, 3).map((warning, index) => (
            <div key={index} style={{ 
              color: getWarningColor(warning.level),
              fontSize: '10px',
              marginBottom: '4px'
            }}>
              [{warning.level.toUpperCase()}] {warning.message}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {leakAnalysis.recommendations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div><strong>Recommendations:</strong></div>
          {leakAnalysis.recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} style={{ fontSize: '10px', color: '#aaaaaa' }}>
              • {rec}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleCleanup}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Cleanup
        </button>
        <button
          onClick={handleForceGC}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Force GC
        </button>
        <button
          onClick={() => console.log(getMemoryStats())}
          style={{
            background: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Log Stats
        </button>
      </div>
    </div>
  )
}

export default MemoryMonitor