import React from 'react'
import { MemoryDebugInfo, DebugConfig } from '../../types/debug'

interface MemoryMetricsProps {
  metrics: MemoryDebugInfo
  config: DebugConfig
}

export function MemoryMetrics({ metrics, config }: MemoryMetricsProps) {
  const getMemoryStatus = (used: number, total: number) => {
    const percentage = (used / total) * 100
    if (percentage < 60) return 'good'
    if (percentage < 80) return 'warning'
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

  const totalThreeJSMemory = metrics.geometries + metrics.textures + metrics.materials
  const heapUsagePercentage = metrics.heapTotal > 0 ? (metrics.heapUsed / metrics.heapTotal) * 100 : 0

  return (
    <div className="memory-metrics">
      <div className="debug-metric-group">
        <h3>JavaScript Heap</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Used</span>
          <span className={`debug-metric-value ${getMemoryStatus(metrics.heapUsed, metrics.heapTotal)}`}>
            {formatNumber(metrics.heapUsed)} MB
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Total</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.heapTotal)} MB
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${getMemoryStatus(metrics.heapUsed, metrics.heapTotal)}`}
            style={{ width: `${Math.min(100, heapUsagePercentage)}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Usage</span>
          <span className="debug-metric-value">
            {formatNumber(heapUsagePercentage, 1)}%
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Three.js Resources</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Geometries</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.geometries)} MB
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Textures</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.textures)} MB
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Materials</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.materials)} MB
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Total 3D</span>
          <span className="debug-metric-value">
            {formatNumber(totalThreeJSMemory)} MB
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Object Count</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Total Objects</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.objects)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Array Buffers</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.arrayBuffers)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">External</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.external)} MB
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Memory Distribution</h3>
        <div className="memory-chart">
          <div className="memory-bar">
            <div 
              className="memory-segment geometries"
              style={{ width: `${(metrics.geometries / totalThreeJSMemory) * 100}%` }}
              title={`Geometries: ${metrics.geometries} MB`}
            />
            <div 
              className="memory-segment textures"
              style={{ width: `${(metrics.textures / totalThreeJSMemory) * 100}%` }}
              title={`Textures: ${metrics.textures} MB`}
            />
            <div 
              className="memory-segment materials"
              style={{ width: `${(metrics.materials / totalThreeJSMemory) * 100}%` }}
              title={`Materials: ${metrics.materials} MB`}
            />
          </div>
          <div className="memory-legend">
            <div className="legend-item">
              <div className="legend-color geometries"></div>
              <span>Geometries ({formatNumber((metrics.geometries / totalThreeJSMemory) * 100, 1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color textures"></div>
              <span>Textures ({formatNumber((metrics.textures / totalThreeJSMemory) * 100, 1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color materials"></div>
              <span>Materials ({formatNumber((metrics.materials / totalThreeJSMemory) * 100, 1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {config.showMemory && (
        <div className="debug-metric-group">
          <h3>Memory Status</h3>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Status</span>
            <span className={`debug-metric-value ${getMemoryStatus(metrics.heapUsed, metrics.heapTotal)}`}>
              {heapUsagePercentage < 60 ? 'Healthy' : 
               heapUsagePercentage < 80 ? 'Moderate' : 'High Usage'}
            </span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Available</span>
            <span className="debug-metric-value">
              {formatNumber(metrics.heapTotal - metrics.heapUsed)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  )
}