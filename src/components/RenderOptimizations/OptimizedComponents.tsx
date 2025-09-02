import React, { memo, useMemo, useCallback, useState } from 'react'
import { usePerformance } from '../../hooks/usePerformance'
import { useDebug } from '../../systems/debug/DebugContext'
import { PerformanceMetrics } from '../DebugPanel/PerformanceMetrics'
import { MemoryMetrics } from '../DebugPanel/MemoryMetrics'
import { RenderMetrics } from '../DebugPanel/RenderMetrics'
import { VisualizationControls } from '../DebugPanel/VisualizationControls'
import { BookmarkManager } from '../DebugPanel/BookmarkManager'
import { LogViewer } from '../DebugPanel/LogViewer'
import { ProfilingResults } from '../DebugPanel/ProfilingResults'

interface PerformanceMonitorProps {
  visible?: boolean
}

interface DebugPanelProps {
  className?: string
}

interface SimplePerformanceProps {
  visible?: boolean
  mode?: 'minimal' | 'dashboard'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

/**
 * Optimized PerformanceMonitor with React.memo to prevent unnecessary re-renders
 * Only re-renders when metrics or visibility actually change
 */
export const OptimizedPerformanceMonitor = memo<PerformanceMonitorProps>(({ visible = false }) => {
  const { metrics, config, level, isOptimizing } = usePerformance()

  // Memoize expensive calculations
  const performanceStatus = useMemo(() => ({
    fpsStatus: metrics.fps < 30 ? 'warning' : metrics.fps < 45 ? 'caution' : 'good',
    memoryStatus: metrics.memoryUsage > 500 ? 'warning' : metrics.memoryUsage > 300 ? 'caution' : 'good',
    renderStatus: metrics.renderTime > 16 ? 'warning' : metrics.renderTime > 10 ? 'caution' : 'good'
  }), [metrics.fps, metrics.memoryUsage, metrics.renderTime])

  // Memoize formatted values to prevent string recreation
  const formattedMetrics = useMemo(() => ({
    memory: metrics.memoryUsage.toFixed(1),
    renderTime: metrics.renderTime.toFixed(2),
    triangles: metrics.triangleCount.toLocaleString()
  }), [metrics.memoryUsage, metrics.renderTime, metrics.triangleCount])

  if (!visible) return null

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
            <span className={`metric__value ${performanceStatus.fpsStatus === 'warning' ? 'metric__value--warning' : ''}`}>
              {metrics.fps}
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">Memory:</span>
            <span className={`metric__value ${performanceStatus.memoryStatus === 'warning' ? 'metric__value--warning' : ''}`}>
              {formattedMetrics.memory} MB
            </span>
          </div>
          <div className="metric">
            <span className="metric__label">Draw Calls:</span>
            <span className="metric__value">{metrics.drawCalls}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Triangles:</span>
            <span className="metric__value">{formattedMetrics.triangles}</span>
          </div>
          <div className="metric">
            <span className="metric__label">Render Time:</span>
            <span className={`metric__value ${performanceStatus.renderStatus === 'warning' ? 'metric__value--warning' : ''}`}>
              {formattedMetrics.renderTime}ms
            </span>
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
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better control over re-renders
  return prevProps.visible === nextProps.visible
})

/**
 * Optimized DebugPanel with React.memo and memoized callbacks
 */
export const OptimizedDebugPanel = memo<DebugPanelProps>(({ className = '' }) => {
  const { panelVisible, actions, stats, config, mode } = useDebug()
  const [activeTab, setActiveTab] = useState<string>('performance')
  const [collapsed, setCollapsed] = useState(false)

  // Memoize callbacks to prevent child re-renders
  const handleTogglePanel = useCallback(() => {
    actions.toggleDebugPanel()
  }, [actions])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed])

  const handleTakeScreenshot = useCallback(async () => {
    try {
      const filename = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.${config.screenshotFormat}`
      await actions.takeScreenshot(filename)
    } catch (error) {
      actions.log('error', 'debug', 'Screenshot failed', error)
    }
  }, [actions, config.screenshotFormat])

  // Memoize tabs array to prevent recreation
  const tabs = useMemo(() => [
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'memory', label: 'Memory', icon: '💾' },
    { id: 'render', label: 'Render', icon: '🎨' },
    { id: 'visualizations', label: 'Visualizations', icon: '👁️' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '📍' },
    { id: 'logs', label: 'Logs', icon: '📝' },
    { id: 'profiling', label: 'Profiling', icon: '⏱️' }
  ], [])

  if (!panelVisible) {
    return (
      <div className={`debug-panel-toggle ${className}`}>
        <button 
          onClick={handleTogglePanel}
          className="debug-toggle-btn"
          title="Show Debug Panel"
        >
          🐛
        </button>
      </div>
    )
  }

  return (
    <div className={`debug-panel ${collapsed ? 'collapsed' : ''} ${className}`}>
      <div className="debug-panel-header">
        <div className="debug-panel-title">
          <span className="debug-panel-icon">🐛</span>
          <span>Debug Panel</span>
          <span className="debug-mode-badge">{mode}</span>
        </div>
        <div className="debug-panel-controls">
          <button 
            onClick={handleTakeScreenshot}
            className="debug-control-btn"
            title="Take Screenshot"
          >
            📸
          </button>
          <button 
            onClick={handleToggleCollapse}
            className="debug-control-btn"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '📈' : '📉'}
          </button>
          <button 
            onClick={handleTogglePanel}
            className="debug-control-btn"
            title="Close Debug Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="debug-panel-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`debug-tab ${activeTab === tab.id ? 'active' : ''}`}
                title={tab.label}
              >
                <span className="debug-tab-icon">{tab.icon}</span>
                <span className="debug-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="debug-panel-content">
            {activeTab === 'performance' && (
              <PerformanceMetrics 
                metrics={stats.performance} 
                config={config}
              />
            )}
            
            {activeTab === 'memory' && (
              <MemoryMetrics 
                metrics={stats.memory}
                config={config}
              />
            )}
            
            {activeTab === 'render' && (
              <RenderMetrics 
                metrics={stats.render}
                config={config}
              />
            )}
            
            {activeTab === 'visualizations' && (
              <VisualizationControls />
            )}
            
            {activeTab === 'bookmarks' && (
              <BookmarkManager />
            )}
            
            {activeTab === 'logs' && (
              <LogViewer />
            )}
            
            {activeTab === 'profiling' && (
              <ProfilingResults />
            )}
          </div>
        </>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.className === nextProps.className
})

/**
 * Optimized SimplePerformance component with better memoization
 */
export const OptimizedSimplePerformance = memo<SimplePerformanceProps>(({
  visible = true,
  mode = 'minimal',
  position = 'top-right',
  className = ''
}) => {
  const { metrics, config, level } = usePerformance()

  // Memoize performance calculations
  const performanceData = useMemo(() => {
    const fpsColor = metrics.fps >= 50 ? '#4CAF50' : 
                    metrics.fps >= 30 ? '#FF9800' : '#F44336'
    
    const memoryColor = metrics.memoryUsage <= 200 ? '#4CAF50' :
                       metrics.memoryUsage <= 400 ? '#FF9800' : '#F44336'

    return {
      fps: Math.round(metrics.fps),
      memory: Math.round(metrics.memoryUsage),
      fpsColor,
      memoryColor,
      level: level.toUpperCase()
    }
  }, [metrics.fps, metrics.memoryUsage, level])

  if (!visible) return null

  const positionClass = `simple-performance--${position}`
  const modeClass = `simple-performance--${mode}`

  return (
    <div className={`simple-performance ${positionClass} ${modeClass} ${className}`}>
      {mode === 'minimal' ? (
        <div className="simple-performance__minimal">
          <span style={{ color: performanceData.fpsColor }}>
            {performanceData.fps} FPS
          </span>
          <span style={{ color: performanceData.memoryColor }}>
            {performanceData.memory}MB
          </span>
        </div>
      ) : (
        <div className="simple-performance__dashboard">
          <div className="simple-performance__header">
            <span>Performance</span>
            <span className={`simple-performance__level simple-performance__level--${level}`}>
              {performanceData.level}
            </span>
          </div>
          <div className="simple-performance__metrics">
            <div className="simple-performance__metric">
              <span>FPS:</span>
              <span style={{ color: performanceData.fpsColor }}>
                {performanceData.fps}
              </span>
            </div>
            <div className="simple-performance__metric">
              <span>Memory:</span>
              <span style={{ color: performanceData.memoryColor }}>
                {performanceData.memory}MB
              </span>
            </div>
            <div className="simple-performance__metric">
              <span>Draw Calls:</span>
              <span>{metrics.drawCalls}</span>
            </div>
            <div className="simple-performance__metric">
              <span>Quality:</span>
              <span>{config.quality}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.mode === nextProps.mode &&
    prevProps.position === nextProps.position &&
    prevProps.className === nextProps.className
  )
})

OptimizedPerformanceMonitor.displayName = 'OptimizedPerformanceMonitor'
OptimizedDebugPanel.displayName = 'OptimizedDebugPanel'
OptimizedSimplePerformance.displayName = 'OptimizedSimplePerformance'