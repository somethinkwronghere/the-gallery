import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Mesh, Vector3, Euler, Matrix4 } from 'three'
import { useInstancing } from '../../hooks/useInstancing'

export interface InstancedMeshWrapperProps {
  /** The original mesh to create instances from */
  originalMesh: Mesh
  /** Maximum number of instances for this group */
  maxInstances?: number
  /** Array of transform data for instances */
  instances: Array<{
    position?: Vector3
    rotation?: Euler
    scale?: Vector3
    visible?: boolean
    userData?: any
  }>
  /** Callback when instances are created */
  onInstancesCreated?: (groupId: string, instanceIds: string[]) => void
  /** Callback when instances are updated */
  onInstancesUpdated?: (groupId: string) => void
  /** Whether to enable automatic cleanup on unmount */
  autoCleanup?: boolean
}

export interface InstancedMeshWrapperRef {
  groupId: string | null
  instanceIds: string[]
  updateInstance: (index: number, position?: Vector3, rotation?: Euler, scale?: Vector3) => void
  setInstanceVisibility: (index: number, visible: boolean) => void
  addInstance: (position?: Vector3, rotation?: Euler, scale?: Vector3, userData?: any) => string
  removeInstance: (index: number) => void
  getStats: () => any
}

/**
 * Wrapper component that automatically creates and manages instanced meshes
 * from existing Three.js meshes
 */
const InstancedMeshWrapper = forwardRef<InstancedMeshWrapperRef, InstancedMeshWrapperProps>(({
  originalMesh,
  maxInstances = 100,
  instances = [],
  onInstancesCreated,
  onInstancesUpdated,
  autoCleanup = true
}, ref) => {
  const instancing = useInstancing()
  const groupIdRef = useRef<string | null>(null)
  const instanceIdsRef = useRef<string[]>([])

  // Create instance group and instances
  useEffect(() => {
    if (!originalMesh) return

    try {
      // Create instance group
      const groupId = instancing.createInstanceGroup(originalMesh, maxInstances)
      groupIdRef.current = groupId

      // Create instances
      const instanceIds = instancing.createMultipleInstances(groupId, instances)
      instanceIdsRef.current = instanceIds

      // Notify parent component
      onInstancesCreated?.(groupId, instanceIds)

      console.log(`Created instance group ${groupId} with ${instanceIds.length} instances`)

    } catch (error) {
      console.error('Error creating instanced mesh:', error)
    }

    // Cleanup function
    return () => {
      if (autoCleanup && groupIdRef.current) {
        instancing.removeInstanceGroup(groupIdRef.current)
        groupIdRef.current = null
        instanceIdsRef.current = []
      }
    }
  }, [originalMesh, maxInstances, autoCleanup, instancing])

  // Update instances when props change
  useEffect(() => {
    if (!groupIdRef.current || instanceIdsRef.current.length === 0) return

    // Update existing instances
    instances.forEach((instanceData, index) => {
      if (index < instanceIdsRef.current.length) {
        const instanceId = instanceIdsRef.current[index]
        
        // Update transform
        if (instanceData.position || instanceData.rotation || instanceData.scale) {
          instancing.updateInstance(
            groupIdRef.current!,
            instanceId,
            instanceData.position,
            instanceData.rotation,
            instanceData.scale
          )
        }

        // Update visibility
        if (typeof instanceData.visible === 'boolean') {
          instancing.setInstanceVisibility(groupIdRef.current!, instanceId, instanceData.visible)
        }
      }
    })

    onInstancesUpdated?.(groupIdRef.current)
  }, [instances, instancing, onInstancesUpdated])

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    groupId: groupIdRef.current,
    instanceIds: [...instanceIdsRef.current],
    
    updateInstance: (index: number, position?: Vector3, rotation?: Euler, scale?: Vector3) => {
      if (groupIdRef.current && index < instanceIdsRef.current.length) {
        const instanceId = instanceIdsRef.current[index]
        instancing.updateInstance(groupIdRef.current, instanceId, position, rotation, scale)
      }
    },

    setInstanceVisibility: (index: number, visible: boolean) => {
      if (groupIdRef.current && index < instanceIdsRef.current.length) {
        const instanceId = instanceIdsRef.current[index]
        instancing.setInstanceVisibility(groupIdRef.current, instanceId, visible)
      }
    },

    addInstance: (position?: Vector3, rotation?: Euler, scale?: Vector3, userData?: any) => {
      if (groupIdRef.current) {
        const instanceId = instancing.createInstance(
          groupIdRef.current,
          position,
          rotation,
          scale,
          userData
        )
        instanceIdsRef.current.push(instanceId)
        return instanceId
      }
      return ''
    },

    removeInstance: (index: number) => {
      if (groupIdRef.current && index < instanceIdsRef.current.length) {
        const instanceId = instanceIdsRef.current[index]
        instancing.removeInstance(groupIdRef.current, instanceId)
        instanceIdsRef.current.splice(index, 1)
      }
    },

    getStats: () => instancing.getStats()
  }), [instancing])

  // This component doesn't render anything visible - it just manages instancing
  return null
})

InstancedMeshWrapper.displayName = 'InstancedMeshWrapper'

export default InstancedMeshWrapper