# Simple Memory Manager

A simplified memory management system that consolidates the existing memory infrastructure into an easy-to-use interface with automatic cleanup capabilities.

## Features

- **Automatic Resource Tracking**: Track Three.js resources (geometries, materials, textures, objects)
- **Component-based Cleanup**: Automatic cleanup when React components unmount
- **Memory Monitoring**: Real-time memory usage statistics and warnings
- **Emergency Cleanup**: Automatic cleanup when memory pressure is detected
- **Leak Detection**: Integration with memory leak detection system
- **Simple Configuration**: Easy-to-use configuration options

## Usage

### Basic Usage

```typescript
import { simpleMemoryManager } from '../utils/SimpleMemoryManager'

// Track a resource
const geometry = new BufferGeometry()
const resourceId = simpleMemoryManager.trackResource(geometry)

// Get memory statistics
const stats = simpleMemoryManager.getMemoryStats()
console.log(`Total memory: ${stats.totalMemoryMB}MB`)

// Perform cleanup
simpleMemoryManager.performCleanup()
```

### React Hook Usage

```typescript
import { useSimpleMemoryManager } from '../hooks/useSimpleMemoryManager'

function MyComponent() {
  const { 
    trackResource, 
    memoryStats, 
    warnings, 
    performCleanup 
  } = useSimpleMemoryManager({
    trackMemoryStats: true,
    enableAutoCleanup: true
  })

  useEffect(() => {
    const geometry = new BufferGeometry()
    trackResource(geometry) // Automatically cleaned up on unmount
  }, [trackResource])

  return (
    <div>
      {memoryStats && (
        <div>Memory: {memoryStats.totalMemoryMB}MB</div>
      )}
      {warnings.length > 0 && (
        <button onClick={performCleanup}>
          Clean Memory ({warnings.length} warnings)
        </button>
      )}
    </div>
  )
}
```

### Three.js Specific Hook

```typescript
import { useSimpleThreeMemoryManager } from '../hooks/useSimpleMemoryManager'

function ThreeComponent() {
  const { 
    trackGeometry, 
    trackMaterial, 
    trackMesh 
  } = useSimpleThreeMemoryManager()

  useEffect(() => {
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial()
    const mesh = new Mesh(geometry, material)

    // Track individual resources
    trackGeometry(geometry)
    trackMaterial(material)

    // Or track entire mesh (includes geometry, material, and object)
    trackMesh(mesh)
  }, [trackGeometry, trackMaterial, trackMesh])

  return <Canvas>{/* Your Three.js content */}</Canvas>
}
```

### AutoCleanup Component

```typescript
import { AutoCleanup } from '../components/AutoCleanup'

function App() {
  return (
    <AutoCleanup 
      componentId="main-app"
      onCleanup={() => console.log('App cleanup')}
    >
      <MyThreeJSComponent />
    </AutoCleanup>
  )
}
```

## Configuration

```typescript
// Update configuration
simpleMemoryManager.updateConfig({
  autoCleanupEnabled: true,
  memoryThresholdMB: 400,
  cleanupIntervalMs: 30000,
  aggressiveMode: false
})

// Get current configuration
const config = simpleMemoryManager.getConfig()
```

## Memory Statistics

The memory manager provides detailed statistics:

```typescript
interface SimpleMemoryStats {
  totalMemoryMB: number        // Total memory usage
  textureMemoryMB: number      // Memory used by textures
  geometryMemoryMB: number     // Memory used by geometries
  jsHeapMB: number            // JavaScript heap usage
  resourceCount: number        // Number of tracked resources
  isMemoryPressure: boolean   // Whether system is under memory pressure
}
```

## Memory Warnings

The system provides warnings when memory usage is high:

```typescript
const warnings = simpleMemoryManager.getMemoryWarnings()
warnings.forEach(warning => {
  console.log(`${warning.level}: ${warning.message}`)
  warning.recommendations.forEach(rec => {
    console.log(`  - ${rec}`)
  })
})
```

## Integration with SimplePerformance

The SimplePerformance component automatically integrates memory monitoring:

```typescript
<SimplePerformance 
  mode="dashboard"
  showMemoryDetails={true}
  enableAutoCleanup={true}
/>
```

## Best Practices

1. **Use React Hooks**: Always use `useSimpleMemoryManager` or `useThreeMemoryManager` in React components for automatic cleanup
2. **Track Resources Early**: Track resources as soon as they're created
3. **Monitor Warnings**: Pay attention to memory warnings and act on recommendations
4. **Component IDs**: Use meaningful component IDs for better debugging
5. **Emergency Cleanup**: Let the system handle emergency cleanup automatically
6. **Configuration**: Adjust thresholds based on your application's needs

## Automatic Cleanup

The system automatically:
- Cleans up resources when React components unmount
- Performs cleanup when memory thresholds are exceeded
- Detects and handles memory leaks
- Forces garbage collection when available
- Provides emergency cleanup for critical memory pressure

## Performance Impact

The simplified memory manager is designed to have minimal performance impact:
- Cleanup operations are batched and throttled
- Memory monitoring runs at configurable intervals
- Resource tracking uses efficient data structures
- Emergency cleanup only triggers when necessary

## Migration from Old System

If you're migrating from the old MemoryMonitor system:

1. Replace `MemoryMonitor` component usage with `SimplePerformance` with memory options
2. Use `useSimpleMemoryManager` or `useSimpleThreeMemoryManager` instead of direct memory manager calls
3. Update cleanup patterns to use component-based cleanup
4. Configure thresholds according to your needs

## Troubleshooting

### High Memory Usage
- Check memory warnings for specific recommendations
- Verify resources are being tracked and cleaned up
- Consider lowering memory thresholds
- Enable aggressive cleanup mode

### Memory Leaks
- Use the leak detection system to identify problematic resources
- Ensure all components use proper cleanup hooks
- Check for circular references in resource tracking
- Monitor resource counts over time

### Performance Issues
- Increase cleanup intervals if cleanup is too frequent
- Disable detailed memory tracking in production
- Use minimal mode for performance monitoring
- Consider manual cleanup for performance-critical sections