import React, { useState, useEffect, useCallback } from 'react';
import { SimpleMobileControls } from '../SimpleMobileControls/SimpleMobileControls';
import { useSimpleMobileOptimization } from '../../hooks/useSimpleMobileOptimization';
import './SimpleMobileUI.css';

export interface SimpleMobileUIProps {
  visible?: boolean;
  onMove?: (direction: { x: number; z: number }) => void;
  onLook?: (rotation: { x: number; y: number }) => void;
  onAction?: (action: 'jump' | 'menu') => void;
  className?: string;
}

interface SimpleMobileMenuProps {
  visible: boolean;
  onClose: () => void;
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  currentQuality: string;
  fps: number;
}

const SimpleMobileMenu: React.FC<SimpleMobileMenuProps> = ({
  visible,
  onClose,
  onQualityChange,
  currentQuality,
  fps
}) => {
  if (!visible) return null;

  return (
    <div className="simple-mobile-menu-overlay" onClick={onClose}>
      <div className="simple-mobile-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <h3>Ayarlar</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="menu-content">
          <div className="setting-item">
            <label>Grafik Kalitesi</label>
            <div className="quality-options">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  className={`quality-btn ${currentQuality === quality ? 'active' : ''}`}
                  onClick={() => onQualityChange(quality)}
                >
                  {quality === 'low' ? 'Düşük' : quality === 'medium' ? 'Orta' : 'Yüksek'}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <label>Performans</label>
            <div className="performance-info">
              <span className={`fps-display ${fps < 20 ? 'low' : fps < 40 ? 'medium' : 'high'}`}>
                {Math.round(fps)} FPS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SimpleMobileUI: React.FC<SimpleMobileUIProps> = ({
  visible = true,
  onMove,
  onLook,
  onAction,
  className = ''
}) => {
  const {
    isMobile,
    isTablet,
    isTouchDevice,
    isLandscape,
    currentQuality,
    fps,
    actions
  } = useSimpleMobileOptimization();

  const [showMenu, setShowMenu] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const handleMove = useCallback((direction: { x: number; z: number }) => {
    onMove?.(direction);
  }, [onMove]);

  const handleLook = useCallback((rotation: { x: number; y: number }) => {
    onLook?.(rotation);
  }, [onLook]);

  const handleAction = useCallback((action: 'jump' | 'menu') => {
    if (action === 'menu') {
      setShowMenu(true);
    } else {
      onAction?.(action);
    }
  }, [onAction]);

  const handleQualityChange = useCallback((quality: 'low' | 'medium' | 'high') => {
    actions.setQuality(quality);
  }, [actions]);

  // Auto-hide controls after inactivity (simplified)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setControlsEnabled(true);
      timeout = setTimeout(() => {
        if (!showMenu) {
          setControlsEnabled(false);
        }
      }, 10000); // Hide after 10 seconds of inactivity
    };

    const handleActivity = () => {
      resetTimeout();
    };

    if (isMobile || isTablet) {
      document.addEventListener('touchstart', handleActivity, { passive: true });
      document.addEventListener('touchmove', handleActivity, { passive: true });
      resetTimeout();
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('touchmove', handleActivity);
    };
  }, [isMobile, isTablet, showMenu]);

  // Don't render on non-mobile devices
  if (!visible || (!isMobile && !isTablet && !isTouchDevice)) {
    return null;
  }

  return (
    <div className={`simple-mobile-ui ${className} ${isLandscape ? 'landscape' : 'portrait'}`}>
      {/* Simple HUD */}
      <div className="simple-hud">
        <div className="hud-left">
          <div className={`quality-indicator ${currentQuality}`}>
            {currentQuality.toUpperCase()}
          </div>
        </div>
        <div className="hud-right">
          <div className={`fps-indicator ${fps < 20 ? 'low' : fps < 40 ? 'medium' : 'high'}`}>
            {Math.round(fps)}
          </div>
        </div>
      </div>

      {/* Controls */}
      {controlsEnabled && (
        <SimpleMobileControls
          enabled={controlsEnabled}
          onMove={handleMove}
          onLook={handleLook}
          onAction={handleAction}
          sensitivity={0.8}
        />
      )}

      {/* Menu */}
      <SimpleMobileMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onQualityChange={handleQualityChange}
        currentQuality={currentQuality}
        fps={fps}
      />

      {/* Orientation hint for portrait mode */}
      {isMobile && !isLandscape && (
        <div className="orientation-hint">
          <div className="hint-icon">📱</div>
          <div className="hint-text">Daha iyi deneyim için cihazı çevirin</div>
        </div>
      )}

      {/* Tap to show controls when hidden */}
      {!controlsEnabled && (
        <div 
          className="tap-to-show"
          onClick={() => setControlsEnabled(true)}
          onTouchStart={() => setControlsEnabled(true)}
        >
          <div className="tap-hint">Kontrolleri göstermek için dokunun</div>
        </div>
      )}
    </div>
  );
};

export default SimpleMobileUI;