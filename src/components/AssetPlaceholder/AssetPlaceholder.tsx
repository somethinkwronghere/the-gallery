import React from 'react'
import { AssetType } from '../../types/assets'
import './AssetPlaceholder.css'

interface AssetPlaceholderProps {
  type: AssetType
  size?: 'small' | 'medium' | 'large'
  message?: string
  showIcon?: boolean
  color?: string
  className?: string
  onClick?: () => void
}

export const AssetPlaceholder: React.FC<AssetPlaceholderProps> = ({
  type,
  size = 'medium',
  message,
  showIcon = true,
  color = '#cccccc',
  className = '',
  onClick
}) => {
  const getDefaultMessage = (type: AssetType) => {
    switch (type) {
      case 'model':
        return '3D Model Yükleniyor...'
      case 'texture':
        return 'Tekstür Yükleniyor...'
      case 'audio':
        return 'Ses Dosyası Yükleniyor...'
      default:
        return 'Asset Yükleniyor...'
    }
  }

  const getIcon = (type: AssetType) => {
    switch (type) {
      case 'model':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2M12 4.15L18.85 7.5L12 10.85L5.15 7.5L12 4.15M4 8.93L11 12.57V20.07L4 16.43V8.93M13 12.57L20 8.93V16.43L13 20.07V12.57Z"/>
          </svg>
        )
      case 'texture':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
          </svg>
        )
      case 'audio':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        )
    }
  }

  return (
    <div 
      className={`asset-placeholder asset-placeholder--${type} asset-placeholder--${size} ${className}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && (
        <div className="asset-placeholder__icon">
          {getIcon(type)}
        </div>
      )}
      <div className="asset-placeholder__message">
        {message || getDefaultMessage(type)}
      </div>
      <div className="asset-placeholder__spinner">
        <div className="asset-placeholder__spinner-ring"></div>
      </div>
    </div>
  )
}

export default AssetPlaceholder