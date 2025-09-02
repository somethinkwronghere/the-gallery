# User Settings System

A comprehensive user settings management system for the digital museum application, providing persistent configuration, validation, presets, and a complete UI for managing all application settings.

## Features

- **Comprehensive Settings**: Performance, display, camera, teleport, audio, accessibility, and developer settings
- **Persistent Storage**: Automatic saving to localStorage with validation
- **Settings Presets**: Built-in and custom presets for different use cases
- **Import/Export**: Full settings backup and restore functionality
- **Real-time Validation**: Input validation with error and warning messages
- **Auto-save**: Automatic saving with debouncing to prevent excessive writes
- **Responsive UI**: Complete settings panel with category-based organization
- **Keyboard Shortcuts**: Quick access via keyboard shortcuts
- **TypeScript Support**: Full type safety and IntelliSense support

## Architecture

### Core Components

1. **UserSettingsContext**: React context providing settings state and actions
2. **SettingsManager**: Core business logic for settings management
3. **SettingsPanel**: Complete UI for managing all settings
4. **Category Components**: Individual setting category components
5. **Custom Hooks**: Convenience hooks for specific setting categories

### Settings Categories

- **Performance**: Quality presets, FPS targets, optimization features
- **Display**: Theme, UI scale, performance indicators
- **Camera**: Mouse/keyboard sensitivity, transitions, effects
- **Teleport**: UI preferences, animation settings, favorite categories
- **Audio**: Volume controls, spatial audio, focus behavior
- **Accessibility**: High contrast, reduced motion, font size, keyboard navigation
- **Developer**: Debug mode, logging, visual debug tools

## Usage

### Basic Setup

```tsx
import { UserSettingsProvider } from './systems/settings/UserSettingsContext'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'

function App() {
  return (
    <UserSettingsProvider>
      <YourAppContent />
      <SettingsPanel visible={showSettings} onClose={() => setShowSettings(false)} />
    </UserSettingsProvider>
  )
}
```

### Using Settings in Components

```tsx
import { useUserSettings, usePerformanceSettings } from './systems/settings/UserSettingsContext'

function MyComponent() {
  // Access all settings
  const { settings, actions } = useUserSettings()
  
  // Or access specific category
  const { settings: perfSettings, updateSettings } = usePerformanceSettings()
  
  // Update settings
  const handleQualityChange = (quality: QualityPreset) => {
    updateSettings({ qualityPreset: quality })
  }
  
  return (
    <div>
      <p>Current quality: {perfSettings.qualityPreset}</p>
      <button onClick={() => handleQualityChange('high')}>
        Set High Quality
      </button>
    </div>
  )
}
```

### Using the Settings Panel Hook

```tsx
import { useSettingsPanel } from '../hooks/useSettingsPanel'

function MyComponent() {
  const {
    isVisible,
    openSettings,
    closeSettings,
    switchCategory,
    isDirty,
    saveSettings
  } = useSettingsPanel({
    defaultCategory: 'performance',
    autoSave: true
  })
  
  return (
    <div>
      <button onClick={() => openSettings('performance')}>
        Open Performance Settings
      </button>
      
      {isDirty && (
        <button onClick={saveSettings}>
          Save Changes
        </button>
      )}
    </div>
  )
}
```

## Settings Structure

### UserSettings Interface

```typescript
interface UserSettings {
  performance: {
    qualityPreset: QualityPreset
    targetFPS: number
    enableAutoQuality: boolean
    // ... more performance settings
  }
  
  display: {
    showPerformanceStats: boolean
    uiScale: number
    theme: 'light' | 'dark' | 'auto'
    // ... more display settings
  }
  
  // ... other categories
}
```

### Built-in Presets

- **High Performance**: Maximum quality for high-end devices
- **Balanced**: Balanced settings for most devices
- **Low-End Device**: Optimized for low-end devices
- **Accessibility**: Settings optimized for accessibility

## Validation

The system includes comprehensive validation for all settings:

```typescript
// Validation is automatic when updating settings
const validation = actions.validateSettings({
  performance: { targetFPS: 200 } // This would fail validation
})

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors)
}
```

## Storage

Settings are automatically persisted to localStorage:

- **Settings Key**: `dijital-muze-settings`
- **Presets Key**: `dijital-muze-presets`
- **Auto-save**: 2-second debounce after changes
- **Manual Save**: Available via `saveSettings()` action

## Import/Export

Full settings backup and restore:

```typescript
// Export settings
const exportData = await actions.exportSettings()

// Import settings
await actions.importSettings(exportData)
```

Export format includes:
- All current settings
- Custom presets
- Export timestamp
- Version information

## Keyboard Shortcuts

- **Ctrl/Cmd + ,**: Open settings panel
- **Escape**: Close settings panel
- **Tab**: Navigate between settings
- **Enter/Space**: Activate controls

## Accessibility Features

- Full keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Reduced motion options
- Scalable UI elements
- Focus management

## Performance Considerations

- **Debounced Auto-save**: Prevents excessive localStorage writes
- **Validation Caching**: Validation results are cached until settings change
- **Lazy Loading**: Settings categories are loaded on demand
- **Memory Efficient**: Minimal re-renders with optimized context structure

## Development

### Adding New Settings

1. Update the `UserSettings` interface in `types/settings.ts`
2. Add validation logic in `SettingsManager.ts`
3. Create or update the appropriate category component
4. Add default values to `DEFAULT_SETTINGS`

### Creating Custom Presets

```typescript
const customPreset = actions.createPreset(
  'My Custom Preset',
  'Optimized for my specific needs'
)
```

### Extending Validation

```typescript
// Add custom validation in SettingsManager.ts
if (settings.myCategory?.myField !== undefined) {
  if (/* validation condition */) {
    errors.push({
      category: 'myCategory',
      field: 'myField',
      message: 'Custom validation message',
      value: settings.myCategory.myField
    })
  }
}
```

## Testing

The settings system includes comprehensive tests:

- Unit tests for SettingsManager
- Integration tests for UserSettingsContext
- Component tests for SettingsPanel
- Validation tests for all setting categories

## Migration

When updating settings structure:

1. Update the `UserSettings` interface
2. Add migration logic in `SettingsManager.loadSettings()`
3. Update default values
4. Test with existing localStorage data

## Troubleshooting

### Settings Not Persisting

- Check browser localStorage quota
- Verify no localStorage errors in console
- Ensure auto-save is enabled

### Validation Errors

- Check console for validation error details
- Verify setting values are within valid ranges
- Use `validateSettings()` to debug specific issues

### Performance Issues

- Reduce auto-save frequency if needed
- Check for excessive re-renders in components
- Use category-specific hooks instead of full settings context

## API Reference

### UserSettingsContext

- `settings`: Current settings object
- `isLoading`: Loading state
- `isDirty`: Whether settings have unsaved changes
- `lastSaved`: Timestamp of last save
- `validationResult`: Current validation state
- `availablePresets`: List of available presets
- `actions`: Settings management actions

### Actions

- `updateSettings(updates)`: Update multiple settings
- `updateCategory(category, updates)`: Update specific category
- `resetSettings()`: Reset all settings to defaults
- `resetCategory(category)`: Reset category to defaults
- `saveSettings()`: Manually save settings
- `loadSettings()`: Reload settings from storage
- `applyPreset(presetId)`: Apply a preset
- `createPreset(name, description?)`: Create custom preset
- `deletePreset(presetId)`: Delete custom preset
- `exportSettings()`: Export settings as JSON
- `importSettings(data)`: Import settings from JSON
- `validateSettings(settings?)`: Validate settings

### Category Hooks

- `usePerformanceSettings()`
- `useDisplaySettings()`
- `useCameraSettings()`
- `useTeleportSettings()`

Each category hook provides:
- `settings`: Category-specific settings
- `updateSettings(updates)`: Update category settings
- `resetSettings()`: Reset category to defaults