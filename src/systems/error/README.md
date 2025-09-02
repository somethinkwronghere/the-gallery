# Error Handling and Recovery System

This system provides comprehensive error handling and graceful degradation for the digital museum application. It handles WebGL context loss, asset loading failures, memory issues, and other critical errors with automatic recovery strategies.

## Features

- **WebGL Context Loss Handling**: Automatic detection and recovery from WebGL context loss
- **Asset Loading Fallbacks**: Fallback assets and retry mechanisms for failed asset loads
- **Memory Management**: Out of memory detection and emergency cleanup
- **Graceful Degradation**: Automatic quality reduction when performance is critical
- **Error Logging**: Comprehensive error tracking and reporting
- **Recovery Strategies**: Multiple recovery strategies for different error types

## Components

### ErrorRecoveryManager

The core class that handles all error recovery operations:

```typescript
import { errorRecoveryManager } from '../systems/error/ErrorRecoveryManager';

// Handle WebGL context loss
await errorRecoveryManager.handleContextLoss(event);

// Handle asset loading errors
await errorRecoveryManager.handleAssetLoadError({
  assetId: 'model-1',
  url: '/models/artwork.glb',
  type: 'model',
  error: new Error('Failed to load'),
  retryCount: 0,
  timestamp: new Date()
});

// Handle memory issues
await errorRecoveryManager.handleOutOfMemory({
  currentUsage: 1200,
  maxUsage: 1024,
  threshold: 1024,
  timestamp: new Date(),
  criticalAssets: ['large-texture-1', 'complex-model-2']
});

// Register fallback assets
errorRecoveryManager.registerFallbackAsset('artwork-1', '/fallbacks/simple-artwork.glb');
```

### ErrorRecoveryContext

React context provider for error handling state management:

```typescript
import { ErrorRecoveryProvider } from '../systems/error/ErrorRecoveryContext';

function App() {
  return (
    <ErrorRecoveryProvider>
      <YourAppComponents />
    </ErrorRecoveryProvider>
  );
}
```

### useErrorRecovery Hook

React hook for easy error handling in components:

```typescript
import { useErrorRecovery } from '../hooks/useErrorRecovery';

function MyComponent() {
  const {
    handleAssetLoadError,
    handleMemoryError,
    registerFallbackAsset,
    isRecovering,
    getErrorStats
  } = useErrorRecovery();

  // Handle asset loading error
  const loadAsset = async (url: string) => {
    try {
      // Load asset...
    } catch (error) {
      await handleAssetLoadError('asset-id', url, 'model', error);
    }
  };

  // Check system health
  const health = isSystemHealthy();
  
  return (
    <div>
      {isRecovering && <div>System is recovering...</div>}
      {/* Your component content */}
    </div>
  );
}
```

## Error Types

The system handles the following error types:

- `webgl_context_loss`: WebGL context was lost
- `asset_load_failure`: Failed to load an asset
- `out_of_memory`: Memory usage is critical
- `network_error`: Network request failed
- `shader_compilation_error`: Shader compilation failed
- `texture_load_error`: Texture loading failed
- `model_parse_error`: 3D model parsing failed
- `performance_critical`: Performance dropped below threshold
- `unknown_error`: Unhandled error

## Recovery Strategies

Each error type has associated recovery strategies:

- `retry`: Retry the failed operation
- `fallback`: Use a fallback asset or configuration
- `degrade_quality`: Reduce quality settings
- `emergency_cleanup`: Free up memory and resources
- `context_restore`: Restore WebGL context
- `reload_page`: Reload the page as last resort
- `notify_user`: Show notification to user

## Configuration

### Error Thresholds

```typescript
const thresholds = {
  memoryWarningThreshold: 512, // MB
  memoryCriticalThreshold: 1024, // MB
  maxRetryAttempts: 3,
  contextLossTimeout: 5000, // ms
  assetLoadTimeout: 30000, // ms
  performanceFPSThreshold: 15
};

setThresholds(thresholds);
```

### Fallback Assets

```typescript
const fallbackConfig = {
  model: '/assets/fallback/default-model.glb',
  texture: '/assets/fallback/default-texture.jpg',
  material: '/assets/fallback/default-material.json',
  audio: '/assets/fallback/silence.mp3',
  showPlaceholder: true,
  placeholderColor: '#cccccc',
  placeholderText: 'Asset Loading...'
};
```

## Integration with Other Systems

### Performance Manager Integration

```typescript
// Automatic quality degradation on performance issues
const performanceManager = usePerformance();
const { handlePerformanceError } = useErrorRecovery();

if (performanceManager.metrics.fps < 15) {
  await handlePerformanceError(
    performanceManager.metrics.fps,
    30,
    performanceManager.metrics
  );
}
```

### Asset Manager Integration

```typescript
// Asset loading with error handling
const assetManager = useAssetManager();
const { handleAssetLoadError, registerFallbackAsset } = useErrorRecovery();

// Register fallbacks
registerFallbackAsset('artwork-1', '/fallbacks/simple-artwork.glb');

// Load with error handling
try {
  const asset = await assetManager.loadAsset(url, 'model');
} catch (error) {
  await handleAssetLoadError('artwork-1', url, 'model', error);
}
```

### Memory Manager Integration

```typescript
// Memory monitoring with error handling
const memoryManager = useMemoryManager();
const { handleMemoryError } = useErrorRecovery();

memoryManager.onMemoryWarning((usage) => {
  handleMemoryError(usage, memoryManager.getThreshold());
});
```

## Error Boundary

Use the ErrorBoundary component to catch React errors:

```typescript
import { ErrorBoundary } from '../systems/error/ErrorRecoveryContext';

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ErrorRecoveryProvider>
        <YourAppComponents />
      </ErrorRecoveryProvider>
    </ErrorBoundary>
  );
}
```

## Monitoring and Debugging

### Error Statistics

```typescript
const { getErrorStats } = useErrorRecovery();

const stats = getErrorStats();
console.log('Total errors:', stats.totalErrors);
console.log('Recent errors:', stats.recentErrors);
console.log('Errors by type:', stats.errorsByType);
console.log('Context loss count:', stats.contextLossCount);
```

### System Health Check

```typescript
const { isSystemHealthy } = useErrorRecovery();

const health = isSystemHealthy();
if (!health.healthy) {
  console.warn('System health issues detected:', health);
}
```

## Best Practices

1. **Register Fallbacks Early**: Register fallback assets during app initialization
2. **Monitor Memory**: Keep track of memory usage and set appropriate thresholds
3. **Handle Errors Gracefully**: Always provide user feedback during error recovery
4. **Test Recovery**: Test error scenarios to ensure recovery strategies work
5. **Log Errors**: Use the error logging system for debugging and monitoring
6. **Progressive Degradation**: Implement multiple levels of quality degradation

## Testing

The error recovery system can be tested by simulating various error conditions:

```typescript
// Simulate WebGL context loss
const canvas = document.querySelector('canvas');
const loseContext = canvas.getContext('webgl').getExtension('WEBGL_lose_context');
loseContext.loseContext();

// Simulate memory pressure
const { triggerRecovery } = useErrorRecovery();
await triggerRecovery('emergency_cleanup');

// Simulate asset load failure
await handleAssetLoadError('test-asset', '/invalid-url.glb', 'model', new Error('Not found'));
```

## Performance Impact

The error recovery system is designed to have minimal performance impact:

- Error monitoring runs on separate intervals
- Recovery strategies are executed only when needed
- Memory checks are throttled to avoid performance issues
- Context loss handling is event-driven

## Browser Compatibility

The system works across all modern browsers with WebGL support:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Some features like memory monitoring require specific browser APIs and will gracefully degrade if not available.