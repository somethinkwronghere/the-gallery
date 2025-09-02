import { useEffect, ReactNode } from 'react'
import { useSimpleMemoryManager } from '../../hooks/useSimpleMemoryManager'

export interface AutoCleanupProps {
  children: ReactNode
  componentId?: string
  enableAutoCleanup?: boolean
  onCleanup?: () => void
}

/**
 * Wrapper component that automatically handles memory cleanup
 * when the component unmounts
 */
export const AutoCleanup: React.FC<AutoCleanupProps> = ({
  children,
  componentId,
  enableAutoCleanup = true,
  onCleanup
}) => {
  const { } = useSimpleMemoryManager({
    componentId,
    enableAutoCleanup
  })

  useEffect(() => {
    // Register additional cleanup function if provided
    if (onCleanup && enableAutoCleanup) {
      return onCleanup
    }
  }, [onCleanup, enableAutoCleanup])

  return <>{children}</>
}

export default AutoCleanup