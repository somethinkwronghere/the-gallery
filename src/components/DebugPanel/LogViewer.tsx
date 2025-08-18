import React, { useState, useMemo } from 'react'
import { useDebug } from '../../systems/debug/DebugContext'
import { LogLevel, DebugLogEntry } from '../../types/debug'

export function LogViewer() {
  const { logs, actions, config } = useDebug()
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const logLevels: Array<{ value: LogLevel | 'all'; label: string; icon: string; color: string }> = [
    { value: 'all', label: 'All', icon: '📋', color: '#ffffff' },
    { value: 'debug', label: 'Debug', icon: '🐛', color: '#888888' },
    { value: 'info', label: 'Info', icon: 'ℹ️', color: '#007acc' },
    { value: 'warn', label: 'Warning', icon: '⚠️', color: '#ffa500' },
    { value: 'error', label: 'Error', icon: '❌', color: '#ff4444' }
  ]

  const categories = useMemo(() => {
    const cats = new Set(logs.map(log => log.category))
    return ['all', ...Array.from(cats).sort()]
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const levelMatch = selectedLevel === 'all' || log.level === selectedLevel
      const categoryMatch = selectedCategory === 'all' || log.category === selectedCategory
      const searchMatch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      return levelMatch && categoryMatch && searchMatch
    }).reverse() // Show newest first
  }, [logs, selectedLevel, selectedCategory, searchTerm])

  const logCounts = useMemo(() => {
    const counts = { debug: 0, info: 0, warn: 0, error: 0 }
    logs.forEach(log => {
      counts[log.level]++
    })
    return counts
  }, [logs])

  const handleToggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const handleClearLogs = () => {
    actions.clearLogs()
    setExpandedLogs(new Set())
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatData = (data: any) => {
    if (data === null || data === undefined) return ''
    if (typeof data === 'string') return data
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const getLevelColor = (level: LogLevel) => {
    const levelInfo = logLevels.find(l => l.value === level)
    return levelInfo?.color || '#ffffff'
  }

  const getLevelIcon = (level: LogLevel) => {
    const levelInfo = logLevels.find(l => l.value === level)
    return levelInfo?.icon || '📝'
  }

  return (
    <div className="log-viewer">
      <div className="debug-metric-group">
        <h3>Log Statistics</h3>
        <div className="log-stats">
          {logLevels.slice(1).map(level => (
            <div key={level.value} className="log-stat">
              <span className="log-stat-icon" style={{ color: level.color }}>
                {level.icon}
              </span>
              <span className="log-stat-label">{level.label}</span>
              <span className="log-stat-count">
                {logCounts[level.value as LogLevel]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Filters</h3>
        <div className="log-filters">
          <div className="filter-row">
            <label className="filter-label">Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
              className="debug-select"
            >
              {logLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} ({level.value === 'all' ? logs.length : logCounts[level.value as LogLevel] || 0})
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-row">
            <label className="filter-label">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="debug-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-row">
            <label className="filter-label">Search:</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="debug-input"
            />
          </div>
        </div>
        
        <div className="log-actions">
          <button
            onClick={handleClearLogs}
            className="debug-btn danger"
            disabled={logs.length === 0}
          >
            Clear All Logs
          </button>
          <span className="log-count">
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Log Entries</h3>
        <div className="log-list">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <p>No logs match the current filters.</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className={`log-entry log-${log.level}`}>
                <div className="log-header" onClick={() => handleToggleExpanded(log.id)}>
                  <div className="log-meta">
                    <span className="log-time">{formatTime(log.timestamp)}</span>
                    <span 
                      className="log-level"
                      style={{ color: getLevelColor(log.level) }}
                    >
                      {getLevelIcon(log.level)} {log.level.toUpperCase()}
                    </span>
                    <span className="log-category">[{log.category}]</span>
                  </div>
                  <div className="log-expand">
                    {(log.data || log.stack) && (
                      <span className="expand-icon">
                        {expandedLogs.has(log.id) ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="log-message">{log.message}</div>
                
                {expandedLogs.has(log.id) && (
                  <div className="log-details">
                    {log.data && (
                      <div className="log-data">
                        <div className="log-data-label">Data:</div>
                        <pre className="log-data-content">{formatData(log.data)}</pre>
                      </div>
                    )}
                    {log.stack && (
                      <div className="log-stack">
                        <div className="log-stack-label">Stack Trace:</div>
                        <pre className="log-stack-content">{log.stack}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Log Settings</h3>
        <div className="log-settings">
          <div className="setting-row">
            <span className="setting-label">Max Log Entries:</span>
            <span className="setting-value">{config.maxLogEntries}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">Current Log Level:</span>
            <span className="setting-value">{config.logLevel.toUpperCase()}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">Auto-scroll:</span>
            <span className="setting-value">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  )
}