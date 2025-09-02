import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MobileControls.css';

export interface MobileControlsProps {
  enabled: boolean;
  onMove: (direction: { x: number; z: number }) => void;
  onLook: (rotation: { x: number; y: number }) => void;
  onAction: (action: 'jump' | 'interact' | 'menu') => void;
  sensitivity: number;
  showJoysticks: boolean;
  className?: string;
}

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  className?: string;
  label?: string;
  size?: number;
  deadzone?: number;
}

const VirtualJoystick: React.FC<JoystickProps> = ({
  onMove,
  className = '',
  label = '',
  size = 120,
  deadzone = 0.1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    setIsActive(true);
    isDraggingRef.current = true;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const updatePosition = (x: number, y: number) => {
      const deltaX = x - centerX;
      const deltaY = y - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = size / 2 - 20; // Account for knob size
      
      let normalizedX = deltaX / maxDistance;
      let normalizedY = deltaY / maxDistance;
      
      // Apply circular constraint
      if (distance > maxDistance) {
        normalizedX = (deltaX / distance) * (maxDistance / maxDistance);
        normalizedY = (deltaY / distance) * (maxDistance / maxDistance);
      }
      
      // Apply deadzone
      const normalizedDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      if (normalizedDistance < deadzone) {
        normalizedX = 0;
        normalizedY = 0;
      }
      
      setPosition({ x: normalizedX * maxDistance, y: normalizedY * maxDistance });
      onMove(normalizedX, -normalizedY); // Invert Y for typical game controls
    };
    
    updatePosition(clientX, clientY);
  }, [onMove, size, deadzone]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = size / 2 - 20;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance);
      normalizedY = (deltaY / distance);
    }
    
    const normalizedDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    if (normalizedDistance < deadzone) {
      normalizedX = 0;
      normalizedY = 0;
    }
    
    setPosition({ 
      x: Math.max(-maxDistance, Math.min(maxDistance, normalizedX * maxDistance)), 
      y: Math.max(-maxDistance, Math.min(maxDistance, normalizedY * maxDistance))
    });
    onMove(normalizedX, -normalizedY);
  }, [onMove, size, deadzone]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    isDraggingRef.current = false;
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMove, handleEnd]);

  return (
    <div className={`virtual-joystick ${className} ${isActive ? 'active' : ''}`}>
      {label && <div className="joystick-label">{label}</div>}
      <div
        ref={containerRef}
        className="joystick-container"
        style={{ width: size, height: size }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="joystick-background" />
        <div
          ref={knobRef}
          className="joystick-knob"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </div>
    </div>
  );
};

export const MobileControls: React.FC<MobileControlsProps> = ({
  enabled,
  onMove,
  onLook,
  onAction,
  sensitivity = 1,
  showJoysticks = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(enabled);

  useEffect(() => {
    setIsVisible(enabled);
  }, [enabled]);

  const handleMovementJoystick = useCallback((x: number, y: number) => {
    onMove({ x: x * sensitivity, z: y * sensitivity });
  }, [onMove, sensitivity]);

  const handleLookJoystick = useCallback((x: number, y: number) => {
    // Enhanced sensitivity with proper axis mapping and dead zone
    const deadZone = 0.15;
    if (Math.abs(x) < deadZone && Math.abs(y) < deadZone) return;
    
    // Improved sensitivity curve - more responsive but not overwhelming
    const baseSensitivity = 1.5; // Reduced base for better control
    const sensitivityMultiplier = sensitivity * baseSensitivity;
    const smoothX = x * sensitivityMultiplier;
    const smoothY = y * sensitivityMultiplier;
    
    // Correct axis mapping: x controls horizontal rotation (yaw), y controls vertical rotation (pitch)
    onLook({ 
      x: -smoothY, // pitch (vertical look) - inverted for natural feel
      y: smoothX   // yaw (horizontal look)
    });
  }, [onLook, sensitivity]);

  if (!isVisible) return null;

  return (
    <div className={`mobile-controls ${className}`}>
      {showJoysticks && (
        <>
          {/* Movement joystick (left side) */}
          <div className="joystick-wrapper left">
            <VirtualJoystick
              onMove={handleMovementJoystick}
              className="movement-joystick"
              label="Move"
              size={120}
              deadzone={0.15}
            />
          </div>

          {/* Look joystick (right side) */}
          <div className="joystick-wrapper right">
            <VirtualJoystick
              onMove={handleLookJoystick}
              className="look-joystick"
              label="Look"
              size={120}
              deadzone={0.1}
            />
          </div>
        </>
      )}

      {/* Simplified Action buttons - only Jump */}
      <div className="action-buttons">
        <button
          className="action-button jump-button"
          onTouchStart={(e) => {
            e.preventDefault();
            onAction('jump');
          }}
          onClick={() => onAction('jump')}
        >
          <span className="button-icon">⬆</span>
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
