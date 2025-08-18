import React, { createContext, useContext, ReactNode } from 'react'
import { useRenderingSystem, UseRenderingSystemReturn, UseRenderingSystemOptions } from '../../hooks/useRenderingSystem'
import { RenderingContextType } from '../../types/rendering'

// Create context
const RenderingContext = createContext<RenderingContextType | null>(null)

// Provider props
export interface RenderingProviderProps extends UseRenderingSystemOptions {
  children: ReactNode
  enabled?: boolean
}

// Provider component
export const RenderingProvider: React.FC<RenderingProviderProps> = ({
  children,
  enabled = true,
  ...renderingOptions
}) => {
  const renderingSystem = useRenderingSystem(renderingOptions)
  const [isEnabled, setEnabled] = React.useState(enabled)

  const contextValue: RenderingContextType = {
    ...renderingSystem,
    isEnabled,
    setEnabled
  }

  return (
    <RenderingContext.Provider value={contextValue}>
      {children}
    </RenderingContext.Provider>
  )
}

// Hook to use rendering context
export const useRenderingContext = (): RenderingContextType => {
  const context = useContext(RenderingContext)
  if (!context) {
    throw new Error('useRenderingContext must be used within a RenderingProvider')
  }
  return context
}

// HOC for components that need rendering system
export const withRenderingSystem = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const renderingSystem = useRenderingContext()
    return <Component {...props} renderingSystem={renderingSystem} />
  }
  
  WrappedComponent.displayName = `withRenderingSystem(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default RenderingContext