import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerformanceProvider } from '../../../systems/performance';
import SimplePerformance from '../SimplePerformance';

// Mock the performance hook
const mockPerformanceData = {
  metrics: {
    fps: 60,
    memoryUsage: 150,
    renderTime: 16.7,
    drawCalls: 0,
    triangleCount: 0,
    textureMemory: 0,
    frameTime: 0
  },
  level: 'high' as const,
  isOptimizing: false,
  config: {
    quality: 'high' as const,
    targetFPS: 60,
    maxDrawCalls: 1000,
    maxTriangles: 100000,
    textureQuality: 1.0,
    shadowQuality: 'high' as const,
    antialiasing: true,
    postProcessing: true,
    enableLOD: true,
    enableCulling: true,
    enableInstancing: true
  },
  userPreferences: {
    qualityPreset: 'auto' as const,
    targetFPS: 60,
    enableDebugMode: false,
    showPerformanceStats: false,
    enableAutoQuality: true,
    maxMemoryUsage: 512
  },
  actions: {
    adjustQuality: jest.fn(),
    setPerformanceLevel: jest.fn(),
    updateConfig: jest.fn(),
    updatePreferences: jest.fn(),
    resetMetrics: jest.fn()
  }
};

jest.mock('../../../hooks/usePerformance', () => ({
  usePerformance: () => mockPerformanceData
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PerformanceProvider>
      {component}
    </PerformanceProvider>
  );
};

describe('SimplePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Minimal Mode', () => {
    it('renders FPS, memory, and level in minimal mode', () => {
      renderWithProvider(<SimplePerformance mode="minimal" />);
      
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('FPS')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('MB')).toBeInTheDocument();
      expect(screen.getByText('YÜKSEK')).toBeInTheDocument();
    });

    it('applies correct position class', () => {
      const { container } = renderWithProvider(
        <SimplePerformance mode="minimal" position="top-right" />
      );
      
      expect(container.firstChild).toHaveClass('simple-performance--top-right');
    });

    it('hides when visible is false', () => {
      const { container } = renderWithProvider(
        <SimplePerformance visible={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Dashboard Mode', () => {
    it('renders detailed metrics in dashboard mode', () => {
      renderWithProvider(<SimplePerformance mode="dashboard" />);
      
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Frame Rate')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Render Time')).toBeInTheDocument();
      expect(screen.getByText('60 FPS')).toBeInTheDocument();
      expect(screen.getByText('150.0 MB')).toBeInTheDocument();
      expect(screen.getByText('16.7ms')).toBeInTheDocument();
    });

    it('shows optimization status when optimizing', () => {
      const optimizingData = {
        ...mockPerformanceData,
        isOptimizing: true
      };
      
      jest.mocked(require('../../../hooks/usePerformance').usePerformance).mockReturnValue(optimizingData);
      
      renderWithProvider(<SimplePerformance mode="dashboard" />);
      
      expect(screen.getByText('AUTO')).toBeInTheDocument();
    });

    it('applies correct level badge class', () => {
      renderWithProvider(<SimplePerformance mode="dashboard" />);
      
      const levelBadge = screen.getByText('YÜKSEK');
      expect(levelBadge).toHaveClass('simple-performance__level-badge--high');
    });
  });

  describe('Performance Level Colors', () => {
    it('shows correct level text for different levels', () => {
      const levels = [
        { level: 'high', text: 'YÜKSEK' },
        { level: 'medium', text: 'ORTA' },
        { level: 'low', text: 'DÜŞÜK' }
      ];

      levels.forEach(({ level, text }) => {
        const levelData = {
          ...mockPerformanceData,
          level: level as any
        };
        
        jest.mocked(require('../../../hooks/usePerformance').usePerformance).mockReturnValue(levelData);
        
        const { rerender } = renderWithProvider(<SimplePerformance />);
        expect(screen.getByText(text)).toBeInTheDocument();
        
        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('renders with correct CSS classes for responsive design', () => {
      const { container } = renderWithProvider(<SimplePerformance />);
      
      expect(container.firstChild).toHaveClass('simple-performance');
      expect(container.firstChild).toHaveClass('simple-performance--minimal');
    });
  });

  describe('Memory and FPS Color Coding', () => {
    it('applies warning colors for low FPS', () => {
      const lowFpsData = {
        ...mockPerformanceData,
        metrics: {
          ...mockPerformanceData.metrics,
          fps: 20
        }
      };
      
      jest.mocked(require('../../../hooks/usePerformance').usePerformance).mockReturnValue(lowFpsData);
      
      renderWithProvider(<SimplePerformance />);
      
      const fpsValue = screen.getByText('20');
      expect(fpsValue).toHaveStyle({ color: '#ef4444' });
    });

    it('applies warning colors for high memory usage', () => {
      const highMemoryData = {
        ...mockPerformanceData,
        metrics: {
          ...mockPerformanceData.metrics,
          memoryUsage: 450
        }
      };
      
      jest.mocked(require('../../../hooks/usePerformance').usePerformance).mockReturnValue(highMemoryData);
      
      renderWithProvider(<SimplePerformance />);
      
      const memoryValue = screen.getByText('450');
      expect(memoryValue).toHaveStyle({ color: '#ef4444' });
    });
  });
});