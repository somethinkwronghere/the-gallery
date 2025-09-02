import React, { useState, useRef, useCallback, useEffect } from 'react';
import './SimpleMobileControls.css';

export interface SimpleMobileControlsProps {
  enabled: boolean;
  onMove: (direction: { x: number; z: number }) => void;
  onLook: (rotation: { x: number; y: number }) => void;
  onAction: (action: 'jump' | 'menu') => void;
  sensitivity?: number;
  className?: string;
}

interface SimpleJoystickProps {
  onMove: (x: number, y: number) => void;
  className?: string;
  size?: number;
}

const SimpleJoystick: React.FC<SimpleJoystickProps> = ({
  onMove,
  className = '',
  size = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
      const maxDistance = size / 2 - 15;
      
      let normalizedX = deltaX / maxDistance;
      let normalizedY = deltaY / maxDistance;
      
      // Apply circular constraint
      if (distance > maxDistance) {
        normalizedX = (deltaX / distance);
        normalizedY = (deltaY / distance);
      }
      
      // Simple deadzone
      const deadzone = 0.15;
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
    };
    
    updatePosition(clientX, clientY);
  }, [onMove, size]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = size / 2 - 15;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance);
      normalizedY = (deltaY / distance);
    }
    
    const deadzone = 0.15;
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
  }, [onMove, size]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    isDraggingRef.current = false;
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // Optimized touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  // Mouse events for testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMove, handleEnd]);

  return (
    <div className={`simple-joystick ${className} ${isActive ? 'active' : ''}`}>
      <div
        ref={containerRef}
        className="joystick-area"
        style={{ width: size, height: size }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="joystick-base" />
        <div
          className="joystick-stick"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </div>
    </div>
  );
};

export const SimpleMobileControls: React.FC<SimpleMobileControlsProps> = ({
  enabled,
  onMove,
  onLook,
  onAction,
  sensitivity = 1,
  className = ''
}) => {
  const handleMovementJoystick = useCallback((x: number, y: number) => {
    onMove({ x: x * sensitivity, z: y * sensitivity });
  }, [onMove, sensitivity]);

  const handleLookJoystick = useCallback((x: number, y: number) => {
    // Optimized sensitivity with better responsiveness
    const deadZone = 0.1;
    if (Math.abs(x) < deadZone && Math.abs(y) < deadZone) return;
    
    const baseSensitivity = 1.2;
    const sensitivityMultiplier = sensitivity * baseSensitivity;
    const smoothX = x * sensitivityMultiplier;
    const smoothY = y * sensitivityMultiplier;
    
    onLook({ 
      x: -smoothY, // pitch (vertical look)
      y: smoothX   // yaw (horizontal look)
    });
  }, [onLook, sensitivity]);

  if (!enabled) return null;

  return (
    <div className={`simple-mobile-controls ${className}`}>
      {/* Movement joystick (left) */}
      <div className="joystick-container left">
        <SimpleJoystick
          onMove={handleMovementJoystick}
          className="movement-joystick"
          size={100}
        />
      </div>

      {/* Look joystick (right) */}
      <div className="joystick-container right">
        <SimpleJoystick
          onMove={handleLookJoystick}
          className="look-joystick"
          size={100}
        />
      </div>

      {/* Simplified action buttons */}
      <div className="action-buttons">
        <button
          className="action-btn jump-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            onAction('jump');
          }}
          onClick={() => onAction('jump')}
        >
          ↑
        </button>
        <button
          className="action-btn menu-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            onAction('menu');
          }}
          onClick={() => onAction('menu')}
        >
          ☰
        </button>
      </div>
    </div>
  );
};

export default SimpleMobileControls;