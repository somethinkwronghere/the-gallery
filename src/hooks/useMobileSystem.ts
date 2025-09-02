import { useState, useEffect, useCallback, useRef } from 'react';
import { getMobileSystem } from '../systems/mobile';
import type { 
  MobileSystemState, 
  MobileConfiguration, 
  MobileEvents,
  UseMobileResult 
} from '../types/mobile';

/**
 * Hook for managing mobile system functionality
 */
export const useMobileSystem = (): UseMobileResult => {
  const mobileSystem = getMobileSystem();
  const [state, setState] = useState<MobileSystemState>(mobileSystem.getState());
  const eventHandlersRef = useRef<Map<keyof MobileEvents, Set<Function>>>(new Map());

  // Update state when mobile system changes
  useEffect(() => {
    const updateState = () => {
      setState(mobileSystem.getState());
    };

    // Listen to all mobile system events to trigger state updates
    const events: (keyof MobileEvents)[] = [
      'orientationChange',
      'deviceMotion',
      'batteryChange',
      'performanceWarning',
      'lowMemory',
      'thermalThrottle',
      'connectionChange',
      'offline',
      'online',
      'controlsToggle',
      'qualityChange',
      'fullscreen'
    ];

    events.forEach(event => {
      mobileSystem.on(event, updateState);
    });

    return () => {
      events.forEach(event => {
        mobileSystem.off(event, updateState);
      });
    };
  }, [mobileSystem]);

  // Actions
  const actions = {
    updateConfig: useCallback((config: Partial<MobileConfiguration>) => {
      mobileSystem.updateConfig(config);
      setState(mobileSystem.getState());
    }, [mobileSystem]),

    updateControls: useCallback((controls: Partial<MobileSystemState['controls']>) => {
      const currentState = mobileSystem.getState();
      currentState.controls = { ...currentState.controls, ...controls };
      setState(currentState);
    }, [mobileSystem]),

    updateUI: useCallback((ui: Partial<MobileSystemState['ui']>) => {
      mobileSystem.updateUI(ui);
      setState(mobileSystem.getState());
    }, [mobileSystem]),

    toggleControls: useCallback(() => {
      mobileSystem.toggleControls();
      setState(mobileSystem.getState());
    }, [mobileSystem]),

    toggleFullscreen: useCallback(() => {
      mobileSystem.toggleFullscreen();
    }, [mobileSystem]),

    setQuality: useCallback((level: string) => {
      mobileSystem.setQuality(level as any);
      setState(mobileSystem.getState());
    }, [mobileSystem]),

    resetSettings: useCallback(() => {
      mobileSystem.resetSettings();
      setState(mobileSystem.getState());
    }, [mobileSystem])
  };

  // Event system
  const events = {
    on: useCallback(<K extends keyof MobileEvents>(
      event: K, 
      handler: MobileEvents[K]
    ) => {
      mobileSystem.on(event, handler);
      
      // Track handlers for cleanup
      if (!eventHandlersRef.current.has(event)) {
        eventHandlersRef.current.set(event, new Set());
      }
      eventHandlersRef.current.get(event)!.add(handler);
    }, [mobileSystem]),

    off: useCallback(<K extends keyof MobileEvents>(
      event: K, 
      handler: MobileEvents[K]
    ) => {
      mobileSystem.off(event, handler);
      
      // Remove from tracked handlers
      const handlers = eventHandlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    }, [mobileSystem]),

    emit: useCallback(<K extends keyof MobileEvents>(
      event: K, 
      ...args: Parameters<MobileEvents[K]>
    ) => {
      mobileSystem.emit(event, ...args);
    }, [mobileSystem])
  };

  // Cleanup on unmount
  useEffect(() => {
    const currentHandlers = eventHandlersRef.current;
    return () => {
      // Clean up all tracked event handlers
      currentHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
          mobileSystem.off(event, handler as any);
        });
      });
      currentHandlers.clear();
    };
  }, [mobileSystem]);

  return {
    ...state,
    actions,
    events
  };
};

export default useMobileSystem;
