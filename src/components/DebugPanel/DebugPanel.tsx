import React, { useState, useCallback, memo, useMemo } from 'react'
import { useDebug } from '../../systems/debug/DebugContext'
import { PerformanceMetrics } from './PerformanceMetrics'
import { MemoryMetrics } from './MemoryMetrics'
import { RenderMetrics } from './RenderMetrics'
import { VisualizationControls } from './VisualizationControls'
import { BookmarkManager } from './BookmarkManager'
import { LogViewer } from './LogViewer'
import { ProfilingResults } from './ProfilingResults'
import './DebugPanel.css'

interface DebugPanelProps {
  className?: string
}

export const DebugPanel = memo<DebugPanelProps>(({ className = '' }) => {
  const { panelVisible, actions, stats, config, mode } = useDebug()
  const [activeTab, setActiveTab] = useState<string>('performance')
  const [collapsed, setCollapsed] = useState(false)

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
  // Only re-render if className changes
  return prevProps.className === nextProps.className
})

DebugPanel.displayName = 'DebugPanel'

export default DebugPanel