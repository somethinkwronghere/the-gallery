/**
 * Migration utilities for transitioning from old performance components
 * to the new SimplePerformance component
 */

export interface LegacyPerformanceMonitorProps {
  visible?: boolean;
}

export interface LegacyFPSCounterProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface SimplePerformanceProps {
  visible?: boolean;
  mode?: 'minimal' | 'dashboard';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Converts PerformanceMonitor props to SimplePerformance props
 */
export const migratePerformanceMonitorProps = (
  props: LegacyPerformanceMonitorProps
): SimplePerformanceProps => {
  return {
    visible: props.visible,
    mode: 'dashboard'
  };
};

/**
 * Converts FPSCounter props to SimplePerformance props
 */
export const migrateFPSCounterProps = (
  props: LegacyFPSCounterProps
): SimplePerformanceProps => {
  return {
    visible: props.visible,
    mode: 'minimal',
    position: props.position
  };
};

/**
 * Migration guide for developers
 */
export const MIGRATION_GUIDE = {
  performanceMonitor: {
    before: `
// Old PerformanceMonitor usage
import PerformanceMonitor from '../PerformanceMonitor/PerformanceMonitor';

<PerformanceMonitor visible={showStats} />
    `,
    after: `
// New SimplePerformance usage
import { SimplePerformance } from '../SimplePerformance';

<SimplePerformance visible={showStats} mode="dashboard" />
    `
  },
  
  fpsCounter: {
    before: `
// Old FPSCounter usage
import FPSCounter from '../FPSCounter/FPSCounter';

<FPSCounter visible={showFPS} position="top-left" />
    `,
    after: `
// New SimplePerformance usage
import { SimplePerformance } from '../SimplePerformance';

<SimplePerformance visible={showFPS} position="top-left" />
    `
  },
  
  combined: {
    before: `
// Old combined usage
<FPSCounter visible={showFPS} position="top-left" />
<PerformanceMonitor visible={showDetailedStats} />
    `,
    after: `
// New combined usage
<SimplePerformance visible={showFPS} mode="minimal" position="top-left" />
<SimplePerformance visible={showDetailedStats} mode="dashboard" />
    `
  }
};

/**
 * Deprecated component warnings
 */
export const showDeprecationWarning = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED] ${componentName} is deprecated and will be removed in a future version. ` +
      `Please migrate to SimplePerformance component. ` +
      `See migration guide: ${MIGRATION_GUIDE}`
    );
  }
};

/**
 * Feature comparison between old and new components
 */
export const FEATURE_COMPARISON = {
  removed: [
    'Draw calls metric (rarely useful for end users)',
    'Triangle count metric (too technical)',
    'Separate MemoryMonitor component (integrated into SimplePerformance)',
    'Complex configuration options (simplified to essential settings)'
  ],
  
  improved: [
    'Unified component with two modes (minimal and dashboard)',
    'Better color coding for performance metrics',
    'Improved responsive design',
    'Cleaner, more user-friendly interface',
    'Better TypeScript support',
    'Reduced bundle size'
  ],
  
  maintained: [
    'FPS monitoring',
    'Memory usage tracking',
    'Performance level indication',
    'Auto-optimization status',
    'Render time metrics',
    'Positioning options'
  ]
};