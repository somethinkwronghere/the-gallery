import React, { useState } from 'react'
import { useDebug } from '../../systems/debug/DebugContext'
import { ProfilingResult } from '../../types/debug'

export function ProfilingResults() {
  const { profilingResults, config, actions } = useDebug()
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'callCount' | 'averageDuration'>('averageDuration')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedResults = [...profilingResults].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleClearResults = () => {
    // This would call a method on debugManager to clear profiling results
    actions.log('info', 'profiling', 'Profiling results cleared')
  }

  const formatDuration = (ms: number) => {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(1)}μs`
    } else if (ms < 1000) {
      return `${ms.toFixed(2)}ms`
    } else {
      return `${(ms / 1000).toFixed(2)}s`
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getDurationStatus = (duration: number) => {
    if (duration < 1) return 'good'
    if (duration < 10) return 'warning'
    return 'error'
  }

  const getCallCountStatus = (count: number) => {
    if (count < 10) return 'good'
    if (count < 100) return 'warning'
    return 'error'
  }

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const totalDuration = profilingResults.reduce((sum, result) => sum + result.duration, 0)
  const totalCalls = profilingResults.reduce((sum, result) => sum + result.callCount, 0)
  const averageDuration = profilingResults.length > 0 ? totalDuration / profilingResults.length : 0

  return (
    <div className="profiling-results">
      <div className="debug-metric-group">
        <h3>Profiling Status</h3>
        <div className="profiling-status">
          <div className="debug-metric-row">
            <span className="debug-metric-label">Profiling Enabled</span>
            <span className={`debug-metric-value ${config.enableProfiling ? 'good' : 'warning'}`}>
              {config.enableProfiling ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Active Profiles</span>
            <span className="debug-metric-value">{profilingResults.length}</span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Total Duration</span>
            <span className="debug-metric-value">{formatDuration(totalDuration)}</span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Total Calls</span>
            <span className="debug-metric-value">{totalCalls}</span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Average Duration</span>
            <span className="debug-metric-value">{formatDuration(averageDuration)}</span>
          </div>
        </div>
      </div>

      {!config.enableProfiling && (
        <div className="debug-metric-group">
          <h3>Enable Profiling</h3>
          <div className="profiling-notice">
            <p>Profiling is currently disabled.</p>
            <p>Enable it in the debug configuration to start collecting performance data.</p>
            <button
              onClick={() => actions.updateConfig({ enableProfiling: true })}
              className="debug-btn"
            >
              Enable Profiling
            </button>
          </div>
        </div>
      )}

      {config.enableProfiling && (
        <>
          <div className="debug-metric-group">
            <h3>Profiling Controls</h3>
            <div className="profiling-controls">
              <button
                onClick={handleClearResults}
                className="debug-btn danger"
                disabled={profilingResults.length === 0}
              >
                Clear Results
              </button>
              <button
                onClick={() => actions.updateConfig({ enableProfiling: false })}
                className="debug-btn secondary"
              >
                Disable Profiling
              </button>
            </div>
          </div>

          <div className="debug-metric-group">
            <h3>Profiling Results ({profilingResults.length})</h3>
            {profilingResults.length === 0 ? (
              <div className="empty-state">
                <p>No profiling data available.</p>
                <p>Use the profiling hooks in your code to collect performance data.</p>
              </div>
            ) : (
              <div className="profiling-table">
                <div className="table-header">
                  <div 
                    className="table-cell header-cell"
                    onClick={() => handleSort('name')}
                  >
                    Name {getSortIcon('name')}
                  </div>
                  <div 
                    className="table-cell header-cell"
                    onClick={() => handleSort('callCount')}
                  >
                    Calls {getSortIcon('callCount')}
                  </div>
                  <div 
                    className="table-cell header-cell"
                    onClick={() => handleSort('duration')}
                  >
                    Total {getSortIcon('duration')}
                  </div>
                  <div 
                    className="table-cell header-cell"
                    onClick={() => handleSort('averageDuration')}
                  >
                    Average {getSortIcon('averageDuration')}
                  </div>
                </div>
                
                <div className="table-body">
                  {sortedResults.map((result, index) => (
                    <div key={`${result.name}-${index}`} className="table-row">
                      <div className="table-cell name-cell">
                        <div className="profile-name">{result.name}</div>
                        <div className="profile-time">
                          {formatTime(result.startTime)} - {formatTime(result.endTime)}
                        </div>
                      </div>
                      <div className={`table-cell ${getCallCountStatus(result.callCount)}`}>
                        {result.callCount}
                      </div>
                      <div className={`table-cell ${getDurationStatus(result.duration)}`}>
                        {formatDuration(result.duration)}
                      </div>
                      <div className={`table-cell ${getDurationStatus(result.averageDuration)}`}>
                        {formatDuration(result.averageDuration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {profilingResults.length > 0 && (
            <div className="debug-metric-group">
              <h3>Performance Analysis</h3>
              <div className="performance-analysis">
                {sortedResults.slice(0, 3).map((result, index) => (
                  <div key={result.name} className="analysis-item">
                    <div className="analysis-rank">#{index + 1}</div>
                    <div className="analysis-info">
                      <div className="analysis-name">{result.name}</div>
                      <div className="analysis-details">
                        {formatDuration(result.averageDuration)} avg, {result.callCount} calls
                      </div>
                    </div>
                    <div className="analysis-impact">
                      {result.averageDuration > 10 ? '🔴' : result.averageDuration > 1 ? '🟡' : '🟢'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="debug-metric-group">
            <h3>Profiling Tips</h3>
            <div className="profiling-tips">
              <div className="tip">
                💡 Use useDebugProfiling hook to profile React components
              </div>
              <div className="tip">
                ⏱️ Profile expensive operations to identify bottlenecks
              </div>
              <div className="tip">
                📊 Sort by average duration to find the slowest operations
              </div>
              <div className="tip">
                🎯 Focus on operations with high call counts and durations
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}