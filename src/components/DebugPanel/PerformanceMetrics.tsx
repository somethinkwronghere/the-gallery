import React from 'react'
import { PerformanceDebugInfo, DebugConfig } from '../../types/debug'

interface PerformanceMetricsProps {
  metrics: PerformanceDebugInfo
  config: DebugConfig
}

export function PerformanceMetrics({ metrics, config }: PerformanceMetricsProps) {
  const getFPSStatus = (fps: number) => {
    if (fps >= 55) return 'good'
    if (fps >= 30) return 'warning'
    return 'error'
  }

  const getMemoryStatus = (memory: number) => {
    if (memory < 100) return 'good'
    if (memory < 200) return 'warning'
    return 'error'
  }

  const formatNumber = (num: number, decimals = 0) => {
    return num.toFixed(decimals)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="performance-metrics">
      <div className="debug-metric-group">
        <h3>Frame Rate</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">FPS</span>
          <span className={`debug-metric-value ${getFPSStatus(metrics.fps)}`}>
            {formatNumber(metrics.fps)}
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${getFPSStatus(metrics.fps)}`}
            style={{ width: `${Math.min(100, (metrics.fps / 60) * 100)}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Frame Time</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.frameTime, 2)} ms
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Render Time</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.renderTime, 2)} ms
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Memory Usage</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">JS Heap</span>
          <span className={`debug-metric-value ${getMemoryStatus(metrics.memoryUsage)}`}>
            {formatNumber(metrics.memoryUsage, 1)} MB
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${getMemoryStatus(metrics.memoryUsage)}`}
            style={{ width: `${Math.min(100, (metrics.memoryUsage / 500) * 100)}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">GPU Memory</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.gpuMemory, 1)} MB
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Texture Memory</span>
          <span className="debug-metric-value">
            {formatBytes(metrics.textureMemory)}
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Rendering</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Draw Calls</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.drawCalls)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Triangles</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.triangleCount)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Render Calls</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.renderCalls)}
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>System</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">CPU Usage</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.cpuUsage)}%
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${metrics.cpuUsage > 80 ? 'error' : metrics.cpuUsage > 60 ? 'warning' : 'good'}`}
            style={{ width: `${metrics.cpuUsage}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Shader Compilations</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.shaderCompilations)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Texture Uploads</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.textureUploads)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Buffer Uploads</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.bufferUploads)}
          </span>
        </div>
      </div>

      {config.showFPS && (
        <div className="debug-metric-group">
          <h3>Performance Target</h3>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Target FPS</span>
            <span className="debug-metric-value">60</span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Performance Level</span>
            <span className="debug-metric-value">
              {metrics.fps >= 55 ? 'Excellent' : 
               metrics.fps >= 45 ? 'Good' : 
               metrics.fps >= 30 ? 'Fair' : 'Poor'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}