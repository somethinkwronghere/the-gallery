/**
 * Optimized Touch Handler for Mobile Devices
 * Reduces latency and improves responsiveness
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  timestamp: number;
}

export interface TouchGesture {
  type: 'tap' | 'pan' | 'pinch' | 'longpress';
  touches: TouchPoint[];
  center: { x: number; y: number };
  scale?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
}

export type TouchEventHandler = (gesture: TouchGesture) => void;

export class OptimizedTouchHandler {
  private element: HTMLElement;
  private touches: Map<number, TouchPoint> = new Map();
  private handlers: Map<string, TouchEventHandler[]> = new Map();
  private longPressTimer: NodeJS.Timeout | null = null;
  private lastTapTime = 0;
  private isActive = false;

  // Configuration
  private config = {
    longPressDelay: 500,
    tapThreshold: 10,
    doubleTapDelay: 300,
    minPinchDistance: 20,
    velocityDecay: 0.95
  };

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Use passive listeners for better performance
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid delays
    
    this.isActive = true;
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        timestamp: now
      };
      
      this.touches.set(touch.identifier, touchPoint);
    }

    // Handle single touch gestures
    if (this.touches.size === 1) {
      this.startLongPressTimer();
    }

    this.emitGesture();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isActive) return;
    e.preventDefault();

    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint = this.touches.get(touch.identifier);
      
      if (touchPoint) {
        touchPoint.deltaX = touch.clientX - touchPoint.startX;
        touchPoint.deltaY = touch.clientY - touchPoint.startY;
        touchPoint.x = touch.clientX;
        touchPoint.y = touch.clientY;
        touchPoint.timestamp = now;
      }
    }

    // Cancel long press if moved too much
    if (this.touches.size === 1) {
      const touch = Array.from(this.touches.values())[0];
      const distance = Math.sqrt(touch.deltaX ** 2 + touch.deltaY ** 2);
      if (distance > this.config.tapThreshold) {
        this.cancelLongPress();
      }
    }

    this.emitGesture();
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.isActive) return;
    e.preventDefault();

    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint = this.touches.get(touch.identifier);
      
      if (touchPoint) {
        // Check for tap gesture
        const distance = Math.sqrt(touchPoint.deltaX ** 2 + touchPoint.deltaY ** 2);
        const duration = now - touchPoint.timestamp;
        
        if (distance < this.config.tapThreshold && duration < this.config.longPressDelay) {
          this.handleTap(touchPoint);
        }
        
        this.touches.delete(touch.identifier);
      }
    }

    if (this.touches.size === 0) {
      this.isActive = false;
      this.cancelLongPress();
    }

    this.emitGesture();
  };

  private handleTouchCancel = (e: TouchEvent) => {
    this.touches.clear();
    this.isActive = false;
    this.cancelLongPress();
  };

  private handleTap(touchPoint: TouchPoint) {
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    
    const gesture: TouchGesture = {
      type: 'tap',
      touches: [touchPoint],
      center: { x: touchPoint.x, y: touchPoint.y }
    };

    this.emit('tap', gesture);
    this.lastTapTime = now;
  }

  private startLongPressTimer() {
    this.cancelLongPress();
    this.longPressTimer = setTimeout(() => {
      if (this.touches.size === 1) {
        const touch = Array.from(this.touches.values())[0];
        const gesture: TouchGesture = {
          type: 'longpress',
          touches: [touch],
          center: { x: touch.x, y: touch.y }
        };
        this.emit('longpress', gesture);
      }
    }, this.config.longPressDelay);
  }

  private cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private emitGesture() {
    const touchArray = Array.from(this.touches.values());
    
    if (touchArray.length === 0) return;

    // Calculate center point
    const center = this.calculateCenter(touchArray);
    
    if (touchArray.length === 1) {
      // Pan gesture
      const touch = touchArray[0];
      const distance = Math.sqrt(touch.deltaX ** 2 + touch.deltaY ** 2);
      
      if (distance > this.config.tapThreshold) {
        const gesture: TouchGesture = {
          type: 'pan',
          touches: touchArray,
          center,
          velocity: this.calculateVelocity(touch)
        };
        this.emit('pan', gesture);
      }
    } else if (touchArray.length === 2) {
      // Pinch gesture
      const [touch1, touch2] = touchArray;
      const currentDistance = this.calculateDistance(touch1, touch2);
      const startDistance = this.calculateDistance(
        { x: touch1.startX, y: touch1.startY },
        { x: touch2.startX, y: touch2.startY }
      );
      
      if (Math.abs(currentDistance - startDistance) > this.config.minPinchDistance) {
        const scale = currentDistance / startDistance;
        const gesture: TouchGesture = {
          type: 'pinch',
          touches: touchArray,
          center,
          scale
        };
        this.emit('pinch', gesture);
      }
    }
  }

  private calculateCenter(touches: TouchPoint[]): { x: number; y: number } {
    const sum = touches.reduce(
      (acc, touch) => ({
        x: acc.x + touch.x,
        y: acc.y + touch.y
      }),
      { x: 0, y: 0 }
    );
    
    return {
      x: sum.x / touches.length,
      y: sum.y / touches.length
    };
  }

  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateVelocity(touch: TouchPoint): { x: number; y: number } {
    const timeDelta = performance.now() - touch.timestamp;
    const factor = timeDelta > 0 ? 1000 / timeDelta : 0;
    
    return {
      x: touch.deltaX * factor,
      y: touch.deltaY * factor
    };
  }

  private emit(eventType: string, gesture: TouchGesture) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(gesture));
    }
  }

  // Public API
  public on(eventType: string, handler: TouchEventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  public off(eventType: string, handler: TouchEventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    this.touches.clear();
    this.handlers.clear();
    this.cancelLongPress();
  }
}

// Utility function to create optimized touch handler
export const createOptimizedTouchHandler = (element: HTMLElement): OptimizedTouchHandler => {
  return new OptimizedTouchHandler(element);
};

export default OptimizedTouchHandler;