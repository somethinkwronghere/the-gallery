import React from 'react'
import { useDebug } from '../../systems/debug/DebugContext'
import { VisualizationType } from '../../types/debug'

export function VisualizationControls() {
  const { visualizations, actions } = useDebug()

  const visualizationOptions: Array<{
    key: VisualizationType
    label: string
    description: string
    icon: string
  }> = [
    {
      key: 'boundingBoxes',
      label: 'Bounding Boxes',
      description: 'Show object bounding boxes',
      icon: '📦'
    },
    {
      key: 'wireframes',
      label: 'Wireframes',
      description: 'Show geometry wireframes',
      icon: '🔲'
    },
    {
      key: 'normals',
      label: 'Normals',
      description: 'Show vertex normals',
      icon: '📐'
    },
    {
      key: 'colliders',
      label: 'Colliders',
      description: 'Show collision areas',
      icon: '🎯'
    },
    {
      key: 'lightHelpers',
      label: 'Light Helpers',
      description: 'Show light visualization',
      icon: '💡'
    },
    {
      key: 'cameraHelpers',
      label: 'Camera Helpers',
      description: 'Show camera frustum',
      icon: '📷'
    },
    {
      key: 'gridHelper',
      label: 'Grid Helper',
      description: 'Show ground grid',
      icon: '⚏'
    },
    {
      key: 'axesHelper',
      label: 'Axes Helper',
      description: 'Show coordinate axes',
      icon: '🧭'
    },
    {
      key: 'frustumHelper',
      label: 'Frustum Helper',
      description: 'Show camera frustum',
      icon: '🔍'
    }
  ]

  const handleToggleVisualization = (type: VisualizationType) => {
    actions.toggleVisualization(type)
  }

  const handleToggleAll = (enable: boolean) => {
    visualizationOptions.forEach(option => {
      if (visualizations[option.key] !== enable) {
        actions.toggleVisualization(option.key)
      }
    })
  }

  const enabledCount = visualizationOptions.filter(option => 
    visualizations[option.key]
  ).length

  return (
    <div className="visualization-controls">
      <div className="debug-metric-group">
        <h3>Visualization Controls</h3>
        <div className="visualization-summary">
          <div className="debug-metric-row">
            <span className="debug-metric-label">Active Visualizations</span>
            <span className="debug-metric-value">
              {enabledCount} / {visualizationOptions.length}
            </span>
          </div>
          <div className="visualization-actions">
            <button 
              className="debug-btn secondary"
              onClick={() => handleToggleAll(true)}
              disabled={enabledCount === visualizationOptions.length}
            >
              Enable All
            </button>
            <button 
              className="debug-btn secondary"
              onClick={() => handleToggleAll(false)}
              disabled={enabledCount === 0}
            >
              Disable All
            </button>
          </div>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Available Visualizations</h3>
        <div className="visualization-list">
          {visualizationOptions.map(option => (
            <div key={option.key} className="visualization-item">
              <div className="debug-checkbox">
                <input
                  type="checkbox"
                  id={`viz-${option.key}`}
                  checked={visualizations[option.key]}
                  onChange={() => handleToggleVisualization(option.key)}
                />
                <label htmlFor={`viz-${option.key}`} className="visualization-label">
                  <span className="visualization-icon">{option.icon}</span>
                  <div className="visualization-info">
                    <div className="visualization-name">{option.label}</div>
                    <div className="visualization-description">{option.description}</div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Visualization Settings</h3>
        <div className="visualization-settings">
          <div className="setting-row">
            <label className="setting-label">Wireframe Opacity</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.1" 
              defaultValue="0.5"
              className="debug-slider"
            />
          </div>
          <div className="setting-row">
            <label className="setting-label">Helper Size</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1" 
              defaultValue="1"
              className="debug-slider"
            />
          </div>
          <div className="setting-row">
            <label className="setting-label">Normal Length</label>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.1" 
              defaultValue="0.5"
              className="debug-slider"
            />
          </div>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Performance Impact</h3>
        <div className="performance-warning">
          {enabledCount > 0 && (
            <div className="suggestion warning">
              ⚠️ Visualizations active - May impact performance
            </div>
          )}
          {enabledCount > 5 && (
            <div className="suggestion error">
              🚨 Many visualizations active - Significant performance impact
            </div>
          )}
          {enabledCount === 0 && (
            <div className="suggestion good">
              ✅ No performance impact from visualizations
            </div>
          )}
        </div>
      </div>
    </div>
  )
}