import React from 'react'
import { RenderDebugInfo, DebugConfig } from '../../types/debug'

interface RenderMetricsProps {
  metrics: RenderDebugInfo
  config: DebugConfig
}

export function RenderMetrics({ metrics, config }: RenderMetricsProps) {
  const getDrawCallStatus = (drawCalls: number) => {
    if (drawCalls < 100) return 'good'
    if (drawCalls < 500) return 'warning'
    return 'error'
  }

  const getTriangleStatus = (triangles: number) => {
    if (triangles < 50000) return 'good'
    if (triangles < 100000) return 'warning'
    return 'error'
  }

  const formatNumber = (num: number, decimals = 0) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K'
    }
    return num.toFixed(decimals)
  }

  return (
    <div className="render-metrics">
      <div className="debug-metric-group">
        <h3>Draw Calls</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Total Calls</span>
          <span className={`debug-metric-value ${getDrawCallStatus(metrics.drawCalls)}`}>
            {formatNumber(metrics.drawCalls)}
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${getDrawCallStatus(metrics.drawCalls)}`}
            style={{ width: `${Math.min(100, (metrics.drawCalls / 1000) * 100)}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Status</span>
          <span className={`debug-metric-value ${getDrawCallStatus(metrics.drawCalls)}`}>
            {metrics.drawCalls < 100 ? 'Optimal' : 
             metrics.drawCalls < 500 ? 'Moderate' : 'High'}
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Geometry</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Triangles</span>
          <span className={`debug-metric-value ${getTriangleStatus(metrics.triangles)}`}>
            {formatNumber(metrics.triangles)}
          </span>
        </div>
        <div className="debug-progress-bar">
          <div 
            className={`debug-progress-fill ${getTriangleStatus(metrics.triangles)}`}
            style={{ width: `${Math.min(100, (metrics.triangles / 200000) * 100)}%` }}
          />
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Points</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.points)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Lines</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.lines)}
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Resources</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Programs</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.programs)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Geometries</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.geometries)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Textures</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.textures)}
          </span>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Bindings</h3>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Framebuffer</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.framebufferBindings)}
          </span>
        </div>
        <div className="debug-metric-row">
          <span className="debug-metric-label">Texture</span>
          <span className="debug-metric-value">
            {formatNumber(metrics.textureBindings)}
          </span>
        </div>
      </div>

      {config.showRenderStats && (
        <div className="debug-metric-group">
          <h3>Performance Analysis</h3>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Draw Call Efficiency</span>
            <span className={`debug-metric-value ${getDrawCallStatus(metrics.drawCalls)}`}>
              {metrics.drawCalls < 100 ? 'Excellent' : 
               metrics.drawCalls < 300 ? 'Good' : 
               metrics.drawCalls < 500 ? 'Fair' : 'Poor'}
            </span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Geometry Complexity</span>
            <span className={`debug-metric-value ${getTriangleStatus(metrics.triangles)}`}>
              {metrics.triangles < 50000 ? 'Low' : 
               metrics.triangles < 100000 ? 'Medium' : 'High'}
            </span>
          </div>
          <div className="debug-metric-row">
            <span className="debug-metric-label">Triangles per Call</span>
            <span className="debug-metric-value">
              {metrics.drawCalls > 0 ? formatNumber(metrics.triangles / metrics.drawCalls) : '0'}
            </span>
          </div>
        </div>
      )}

      <div className="debug-metric-group">
        <h3>Optimization Suggestions</h3>
        <div className="optimization-suggestions">
          {metrics.drawCalls > 500 && (
            <div className="suggestion warning">
              ⚠️ High draw calls - Consider batching or instancing
            </div>
          )}
          {metrics.triangles > 100000 && (
            <div className="suggestion warning">
              ⚠️ High triangle count - Consider LOD system
            </div>
          )}
          {metrics.programs > 20 && (
            <div className="suggestion info">
              💡 Many shader programs - Consider material sharing
            </div>
          )}
          {metrics.drawCalls < 50 && metrics.triangles < 25000 && (
            <div className="suggestion good">
              ✅ Render performance is optimal
            </div>
          )}
        </div>
      </div>
    </div>
  )
}