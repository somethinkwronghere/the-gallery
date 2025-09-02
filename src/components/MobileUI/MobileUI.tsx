import React, { useState, useEffect, useCallback } from 'react';
import { MobileControls } from '../MobileControls/MobileControls';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import './MobileUI.css';

export interface MobileUIProps {
  visible?: boolean;
  onMove?: (direction: { x: number; z: number }) => void;
  onLook?: (rotation: { x: number; y: number }) => void;
  onAction?: (action: 'jump' | 'interact' | 'menu') => void;
  onToggleControls?: (enabled: boolean) => void;
  controlsSensitivity?: number;
  className?: string;
}

interface MobileMenuProps {
  visible: boolean;
  onClose: () => void;
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  onToggleControls: () => void;
  onSensitivityChange: (sensitivity: number) => void;
  currentQuality: string;
  touchControlsEnabled: boolean;
  sensitivity: number;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  visible,
  onClose,
  onQualityChange,
  onToggleControls,
  onSensitivityChange,
  currentQuality,
  touchControlsEnabled,
  sensitivity
}) => {
  if (!visible) return null;

  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <h3>Galeri Ayarları</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="mobile-menu-content">
          <div className="setting-group">
            <label className="setting-label">Grafik Kalitesi</label>
            <div className="quality-buttons">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  className={`quality-button ${currentQuality === quality ? 'active' : ''}`}
                  onClick={() => onQualityChange(quality)}
                >
                  {quality === 'low' ? 'Düşük' : quality === 'medium' ? 'Orta' : 'Yüksek'}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Dokunmatik Kontroller</label>
            <button
              className={`toggle-button ${touchControlsEnabled ? 'active' : ''}`}
              onClick={onToggleControls}
            >
              {touchControlsEnabled ? 'Açık' : 'Kapalı'}
            </button>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              Kamera Hassasiyeti: {Math.round(sensitivity * 100)}%
            </label>
            <div className="sensitivity-slider-container">
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={sensitivity}
                onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                className="sensitivity-slider"
              />
              <div className="slider-labels">
                <span>Yavaş</span>
                <span>Hızlı</span>
              </div>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Cihaz Bilgisi</label>
            <div className="device-info">
              <div className="info-item">
                <span>Platform: </span>
                <span>{navigator.platform}</span>
              </div>
              <div className="info-item">
                <span>Ekran: </span>
                <span>{window.screen.width}×{window.screen.height}</span>
              </div>
              <div className="info-item">
                <span>Piksel Oranı: </span>
                <span>{window.devicePixelRatio}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// MobileHUD removed for simplified mobile UI implementation

export const MobileUI: React.FC<MobileUIProps> = ({
  visible = true,
  onMove,
  onLook,
  onAction,
  onToggleControls,
  controlsSensitivity = 1,
  className = ''
}) => {
  const {
    isMobile,
    isTablet,
    isTouchDevice,
    isLandscape,
    optimizedConfig,
    touchControlsEnabled,
    actions
  } = useMobileOptimization({
    enableAutoOptimization: true,
    enableTouchControls: true,
    enableResponsiveAdjustments: true
  });

  const [showMenu, setShowMenu] = useState(false);
  // Removed unused state variables for cleaner code
  const [controlsVisible, setControlsVisible] = useState(touchControlsEnabled);
  const [sensitivity, setSensitivity] = useState(controlsSensitivity || 0.8);

  // Monitoring removed for simplified mobile UI

  // Update controls visibility when touchControlsEnabled changes
  useEffect(() => {
    setControlsVisible(touchControlsEnabled);
    onToggleControls?.(touchControlsEnabled);
  }, [touchControlsEnabled, onToggleControls]);

  const handleMove = useCallback((direction: { x: number; z: number }) => {
    onMove?.(direction);
  }, [onMove]);

  const handleLook = useCallback((rotation: { x: number; y: number }) => {
    onLook?.(rotation);
  }, [onLook]);

  const handleAction = useCallback((action: 'jump' | 'interact' | 'menu') => {
    if (action === 'menu') {
      setShowMenu(true);
    } else {
      onAction?.(action);
    }
  }, [onAction]);

  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high') => {
    actions.forceQuality(quality);
  }, [actions]);

  const handleToggleControls = useCallback(() => {
    actions.toggleTouchControls();
    setControlsVisible(prev => !prev);
  }, [actions]);

  // Fullscreen toggle removed for simplified UI

  // Don't render on non-mobile devices unless it's a touch device
  if (!visible || (!isMobile && !isTablet && !isTouchDevice)) {
    return null;
  }

  return (
    <div className={`mobile-ui ${className} ${isLandscape ? 'landscape' : 'portrait'}`}>

      {controlsVisible && (
        <MobileControls
          enabled={controlsVisible}
          onMove={handleMove}
          onLook={handleLook}
          onAction={handleAction}
          sensitivity={sensitivity}
          showJoysticks={true}
        />
      )}

      <MobileMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onQualityChange={handleQualityChange}
        onToggleControls={handleToggleControls}
        onSensitivityChange={setSensitivity}
        currentQuality={optimizedConfig.quality}
        touchControlsEnabled={touchControlsEnabled}
        sensitivity={sensitivity}
      />

      {/* Orientation hint for mobile devices */}
      {isMobile && !isLandscape && (
        <div className="orientation-hint">
          <div className="hint-content">
            <div className="hint-icon">📱</div>
            <div className="hint-text">
              Daha iyi bir deneyim için cihazınızı çevirin
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileUI;
