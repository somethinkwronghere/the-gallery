# Debug System

The Debug System provides comprehensive debugging and development tools for the digital museum application. It includes real-time performance monitoring, memory tracking, visualization controls, camera bookmarking, logging, and profiling capabilities.

## Features

### 🔧 Debug Panel
- Collapsible debug panel with tabbed interface
- Real-time metrics display
- Performance monitoring dashboard
- Memory usage tracking
- Render statistics
- Visualization controls
- Camera bookmarking system
- Log viewer with filtering
- Performance profiling results

### 📊 Performance Monitoring
- FPS tracking and analysis
- Frame time measurement
- Render time monitoring
- CPU usage estimation
- GPU memory tracking
- Draw call counting
- Triangle count monitoring
- Shader compilation tracking

### 💾 Memory Management
- JavaScript heap monitoring
- Three.js resource tracking (geometries, textures, materials)
- Memory leak detection
- Resource usage visualization
- Memory distribution charts
- Cleanup recommendations

### 🎨 Render Analysis
- Draw call optimization suggestions
- Triangle count analysis
- Geometry complexity assessment
- Shader program tracking
- Texture and framebuffer binding counts
- Performance bottleneck identification

### 👁️ Visualization Controls
- Bounding box display
- Wireframe rendering
- Normal vector visualization
- Collision area display
- Light helper visualization
- Camera frustum display
- Grid and axes helpers
- Real-time toggle controls

### 📍 Camera Bookmarking
- Save camera positions and rotations
- Quick navigation between bookmarks
- Bookmark descriptions and metadata
- Persistent storage in localStorage
- Import/export bookmark collections

### 📝 Logging System
- Multi-level logging (debug, info, warn, error)
- Category-based log filtering
- Search functionality
- Stack trace capture for errors
- Log data attachment
- Configurable log retention

### ⏱️ Performance Profiling
- Function execution timing
- Call count tracking
- Average duration calculation
- Performance bottleneck identification
- Profiling result analysis
- Custom profiling hooks

## Usage

### Basic Setup

```tsx
import { DebugProvider } from '../systems/debug/DebugContext'
import { DebugPanel } from '../components/DebugPanel'

function App() {
  return (
    <DebugProvider>
      <YourApp />
      <DebugPanel />
    </DebugProvider>
  )
}
```

### Using Debug Hooks

```tsx
import { useDebug, useDebugLog, useDebugProfiling } from '../systems/debug/DebugContext'

function MyComponent() {
  const { actions, stats } = useDebug()
  const log = useDebugLog()
  const { profile } = useDebugProfiling()

  const handleExpensiveOperation = () => {
    profile('expensive-operation', () => {
      // Your expensive code here
      log.info('component', 'Expensive operation completed')
    })
  }

  return (
    <div>
      <button onClick={() => actions.toggleDebugPanel()}>
        Toggle Debug Panel
      </button>
      <button onClick={handleExpensiveOperation}>
        Run Expensive Operation
      </button>
    </div>
  )
}
```

### Camera Bookmarking

```tsx
import { useDebugBookmarks } from '../hooks/useDebugSystem'

function CameraControls({ camera }) {
  const { saveCurrentPosition, loadBookmark, bookmarks } = useDebugBookmarks()

  const handleSaveBookmark = () => {
    saveCurrentPosition('My Bookmark', camera, 'Description of this view')
  }

  const handleLoadBookmark = (bookmarkId) => {
    loadBookmark(bookmarkId, camera)
  }

  return (
    <div>
      <button onClick={handleSaveBookmark}>Save Position</button>
      {bookmarks.map(bookmark => (
        <button key={bookmark.id} onClick={() => handleLoadBookmark(bookmark.id)}>
          {bookmark.name}
        </button>
      ))}
    </div>
  )
}
```

### Performance Monitoring

```tsx
import { useDebugPerformance } from '../hooks/useDebugSystem'

function PerformanceMonitor() {
  const { stats, analyzePerformance, measureFrameTime } = useDebugPerformance()

  useEffect(() => {
    const interval = setInterval(() => {
      analyzePerformance()
    }, 5000) // Analyze every 5 seconds

    return () => clearInterval(interval)
  }, [analyzePerformance])

  const handleRender = () => {
    measureFrameTime(() => {
      // Your render code here
    })
  }

  return (
    <div>
      <p>FPS: {stats.performance.fps}</p>
      <p>Memory: {stats.memory.heapUsed}MB</p>
      <p>Draw Calls: {stats.render.drawCalls}</p>
    </div>
  )
}
```

### Visualization Controls

```tsx
import { useDebugVisualization } from '../hooks/useDebugSystem'

function SceneDebugger({ scene }) {
  const { visualizations, inspectObject, highlightObject } = useDebugVisualization()

  const handleInspectObject = (object) => {
    const inspection = inspectObject(object, 'My Object')
    console.log('Object inspection:', inspection)
  }

  const handleHighlightObject = (object) => {
    highlightObject(object, true)
  }

  return (
    <div>
      <p>Bounding Boxes: {visualizations.boundingBoxes ? 'On' : 'Off'}</p>
      <p>Wireframes: {visualizations.wireframes ? 'On' : 'Off'}</p>
    </div>
  )
}
```

## Configuration

The debug system can be configured through the `DebugConfig` interface:

```typescript
interface DebugConfig {
  mode: 'off' | 'basic' | 'advanced' | 'full'
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxLogEntries: number
  showFPS: boolean
  showMemory: boolean
  showRenderStats: boolean
  enableProfiling: boolean
  autoSaveBookmarks: boolean
  screenshotFormat: 'png' | 'jpg' | 'webp'
  screenshotQuality: number
}
```

### Environment-based Configuration

```typescript
const debugConfig: DebugConfig = {
  mode: process.env.NODE_ENV === 'development' ? 'full' : 'off',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  maxLogEntries: 1000,
  showFPS: true,
  showMemory: true,
  showRenderStats: true,
  enableProfiling: process.env.NODE_ENV === 'development',
  autoSaveBookmarks: true,
  screenshotFormat: 'png',
  screenshotQuality: 0.8
}
```

## Debug Panel Interface

The debug panel provides several tabs:

1. **Performance** - FPS, memory, CPU usage, render times
2. **Memory** - Heap usage, Three.js resources, memory distribution
3. **Render** - Draw calls, triangles, optimization suggestions
4. **Visualizations** - Toggle various debug visualizations
5. **Bookmarks** - Manage camera bookmarks
6. **Logs** - View and filter debug logs
7. **Profiling** - Performance profiling results and analysis

## Keyboard Shortcuts

- `Ctrl + Shift + D` - Toggle debug panel
- `Ctrl + Shift + S` - Take screenshot
- `Ctrl + Shift + C` - Clear all logs
- `Ctrl + Shift + P` - Toggle profiling

## Performance Impact

The debug system is designed to have minimal performance impact when disabled. When enabled:

- **Basic mode**: ~1-2% performance overhead
- **Advanced mode**: ~3-5% performance overhead
- **Full mode**: ~5-10% performance overhead

Visualizations can have additional performance impact depending on scene complexity.

## Best Practices

1. **Disable in Production**: Always disable debug features in production builds
2. **Use Appropriate Log Levels**: Use debug/info for development, warn/error for production
3. **Profile Sparingly**: Enable profiling only when needed for performance analysis
4. **Clean Up Bookmarks**: Regularly clean up unused bookmarks to avoid clutter
5. **Monitor Memory**: Keep an eye on memory usage, especially in long-running sessions
6. **Use Visualizations Wisely**: Enable only necessary visualizations to avoid performance impact

## Troubleshooting

### Debug Panel Not Showing
- Check if `DebugProvider` is wrapping your app
- Verify debug mode is enabled in configuration
- Check browser console for errors

### Performance Issues
- Disable unnecessary visualizations
- Reduce profiling frequency
- Lower debug update frequency
- Check for memory leaks in debug logs

### Memory Leaks
- Monitor memory usage in the debug panel
- Check for unreleased Three.js resources
- Review object disposal patterns
- Use memory profiling tools

## Integration with Three.js

The debug system integrates seamlessly with Three.js:

```typescript
// Set renderer for debug system
debugManager.setRenderer(renderer)

// Update render metrics
debugManager.updateRenderMetrics(
  renderer.info.render.calls,
  renderer.info.render.triangles,
  renderTime
)
```

## Contributing

When adding new debug features:

1. Follow the existing patterns for hooks and components
2. Add appropriate TypeScript types
3. Include performance considerations
4. Update documentation
5. Add tests for critical functionality

## Dependencies

- React 18+
- Three.js
- TypeScript
- CSS3 (for styling)

The debug system is designed to be self-contained with minimal external dependencies.