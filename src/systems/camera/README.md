# Camera System

A comprehensive camera management system for the digital museum project, providing bookmark functionality, teleportation, smooth transitions, and development tools.

## Features

### 🎯 Teleport System
- **Instant Teleportation**: Quick movement to predefined locations
- **Smooth Transitions**: Animated camera movements with customizable easing
- **Map Integration**: Click-to-teleport on mini-map
- **Category System**: Organize teleport points by type (gallery, artwork, entrance, etc.)
- **Search & Filter**: Find teleport points quickly

### 📍 Bookmark System
- **Save Positions**: Bookmark current camera position and rotation
- **Quick Access**: Mark frequently used bookmarks for easy access
- **Import/Export**: Share bookmarks between sessions
- **Persistent Storage**: Automatically saved to localStorage
- **Rich Metadata**: Add descriptions, tags, and categories

### 🎬 Camera Utilities
- **Smooth Transitions**: Animated movement between positions
- **Look At**: Smoothly orient camera toward targets
- **Orbit Controls**: Orbit around points of interest
- **Shake Effects**: Camera shake for impact effects
- **Zoom Controls**: Smooth zoom to specific distances

### 🔧 Development Tools
- **Quick Navigation**: Ctrl+1/2/3 for instant development teleports
- **Path Recording**: Record and playback camera movements
- **Camera Info**: Real-time position and rotation display
- **Debug Positions**: Predefined development viewpoints

## Usage

### Basic Setup

```typescript
import { useCameraSystem } from '../hooks/useCameraSystem'

function MyComponent() {
  const {
    saveBookmark,
    loadBookmark,
    teleportTo,
    enableDevMode
  } = useCameraSystem()

  // Save current position
  const handleSave = () => {
    saveBookmark('My Position', 'Description here')
  }

  // Teleport to a point
  const handleTeleport = async () => {
    await teleportTo('point-id', {
      duration: 1500,
      easing: 'easeInOut'
    })
  }

  return (
    <div>
      <button onClick={handleSave}>Save Position</button>
      <button onClick={handleTeleport}>Teleport</button>
    </div>
  )
}
```

### Adding Camera Controls to Your App

```typescript
import { CameraControls } from '../components/CameraControls/CameraControls'

function App() {
  return (
    <div>
      {/* Your existing app content */}
      <CameraControls />
    </div>
  )
}
```

## Keyboard Shortcuts

### User Controls
- **T**: Toggle teleport UI
- **Ctrl+Shift+B**: Quick save bookmark
- **Ctrl+Shift+D**: Toggle development mode

### Development Mode
- **Ctrl+1**: Teleport to entrance
- **Ctrl+2**: Teleport to overview position
- **Ctrl+3**: Teleport to debug corner
- **Ctrl+Shift+C**: Log current camera state

## API Reference

### CameraUtilities

```typescript
interface CameraUtilities {
  getCurrentState(): CameraState
  setState(state: CameraState, options?: CameraTransitionOptions): Promise<void>
  transitionTo(target: CameraState, options?: CameraTransitionOptions): Promise<void>
  lookAt(target: Vector3, options?: CameraTransitionOptions): Promise<void>
  shake(intensity: number, duration: number): void
  zoomTo(target: Vector3, distance: number, options?: CameraTransitionOptions): Promise<void>
}
```

### BookmarkManager

```typescript
interface BookmarkManager {
  saveBookmark(name: string, description?: string): CameraBookmarkExtended
  loadBookmark(id: string, options?: CameraTransitionOptions): Promise<void>
  deleteBookmark(id: string): boolean
  getBookmarks(category?: TeleportCategory): CameraBookmarkExtended[]
  exportBookmarks(): string
  importBookmarks(data: string): boolean
}
```

### TeleportManager

```typescript
interface TeleportManager {
  addTeleportPoint(point: Omit<TeleportPoint, 'id' | 'createdAt'>): TeleportPoint
  teleportTo(pointId: string, options?: CameraTransitionOptions): Promise<void>
  teleportToPosition(position: Vector3, rotation?: Euler, options?: CameraTransitionOptions): Promise<void>
  quickTeleportTo(pointId: string): void
  teleportFromMap(mapPosition: { x: number, y: number }): Promise<void>
}
```

## Configuration

### Transition Options

```typescript
interface CameraTransitionOptions {
  duration: number // milliseconds
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut'
  lookAt?: Vector3 // optional target to look at during transition
  onStart?: () => void
  onUpdate?: (progress: number) => void
  onComplete?: () => void
}
```

### Teleport Categories

- **gallery**: Main gallery areas
- **artwork**: Specific artwork viewing positions
- **entrance**: Entry points and exits
- **viewpoint**: Scenic or overview positions
- **debug**: Development and testing positions
- **custom**: User-created positions

## Storage

The system automatically persists data to localStorage:

- **Bookmarks**: `camera_bookmarks`
- **Teleport Points**: `teleport_points`

Data is automatically loaded on system initialization.

## Integration with Existing Systems

### Debug Panel Integration

The camera system integrates with the existing debug panel:

```typescript
// Enhanced bookmark manager in debug panel
import { useCameraSystem } from '../../hooks/useCameraSystem'

// Toggle between old and new bookmark systems
const [useNewSystem, setUseNewSystem] = useState(true)
```

### Performance Integration

Camera transitions respect performance settings:

- Low performance: Shorter transition durations
- High performance: Smooth, longer transitions with easing

## Development

### Adding New Teleport Points

```typescript
const { addTeleportPoint } = useCameraSystem()

addTeleportPoint({
  name: 'New Viewpoint',
  position: new Vector3(10, 5, 10),
  rotation: new Euler(0, Math.PI / 4, 0),
  category: 'viewpoint',
  description: 'Great view of the main gallery',
  enabled: true,
  tags: ['scenic', 'overview']
})
```

### Custom Transitions

```typescript
await transitionTo(targetState, {
  duration: 2000,
  easing: 'easeInOut',
  onStart: () => console.log('Starting transition'),
  onUpdate: (progress) => console.log(`Progress: ${progress * 100}%`),
  onComplete: () => console.log('Transition complete')
})
```

## Troubleshooting

### Common Issues

1. **Camera not responding**: Ensure camera is properly initialized
2. **Bookmarks not saving**: Check localStorage availability
3. **Transitions not smooth**: Verify performance settings
4. **Teleport points not loading**: Check console for storage errors

### Debug Commands

```typescript
// Log current camera state
cameraSystem.devTools.logCameraState()

// Check system status
console.log('Camera system initialized:', cameraSystem.initialized)

// View all bookmarks
console.log('Bookmarks:', cameraSystem.bookmarks.getBookmarks())

// View all teleport points
console.log('Teleport points:', cameraSystem.teleport.getTeleportPoints())
```

## Future Enhancements

- [ ] Spline-based camera paths
- [ ] Physics-based camera movement
- [ ] VR/AR camera controls
- [ ] Multiplayer camera synchronization
- [ ] Advanced easing functions
- [ ] Camera collision detection
- [ ] Automatic tour generation