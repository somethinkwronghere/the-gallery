import { Vector3, Euler, Camera, MathUtils } from 'three'
import { CameraState, CameraTransitionOptions, CameraUtilities as ICameraUtilities } from '../../types/camera'

export class CameraUtilities implements ICameraUtilities {
  private camera: Camera | null = null
  private isTransitioningFlag = false
  private currentTransition: {
    startState: CameraState
    targetState: CameraState
    startTime: number
    duration: number
    options: CameraTransitionOptions
  } | null = null
  private animationFrameId: number | null = null

  constructor(camera?: Camera) {
    if (camera) {
      this.setCamera(camera)
    }
  }

  setCamera(camera: Camera): void {
    this.camera = camera
  }

  getCurrentState(): CameraState {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    return {
      position: this.camera.position.clone(),
      rotation: this.camera.rotation.clone(),
      zoom: (this.camera as any).zoom || 1,
      fov: (this.camera as any).fov || 75
    }
  }

  async setState(state: CameraState, options?: CameraTransitionOptions): Promise<void> {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    if (options && options.duration > 0) {
      return this.transitionTo(state, options)
    }

    // Immediate state change
    this.camera.position.copy(state.position)
    this.camera.rotation.copy(state.rotation)
    
    if (state.zoom !== undefined && 'zoom' in this.camera) {
      (this.camera as any).zoom = state.zoom
    }
    
    if (state.fov !== undefined && 'fov' in this.camera) {
      (this.camera as any).fov = state.fov
      ;(this.camera as any).updateProjectionMatrix?.()
    }
  }

  async transitionTo(target: CameraState, options: CameraTransitionOptions = { duration: 1000, easing: 'easeInOut' }): Promise<void> {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    // Stop any existing transition
    this.stopTransition()

    const startState = this.getCurrentState()
    
    return new Promise((resolve) => {
      this.isTransitioningFlag = true
      this.currentTransition = {
        startState,
        targetState: target,
        startTime: performance.now(),
        duration: options.duration,
        options
      }

      options.onStart?.()

      const animate = () => {
        if (!this.currentTransition || !this.camera) {
          resolve()
          return
        }

        const elapsed = performance.now() - this.currentTransition.startTime
        const progress = Math.min(elapsed / this.currentTransition.duration, 1)
        const easedProgress = this.applyEasing(progress, options.easing || 'easeInOut')

        // Interpolate position
        const currentPos = new Vector3().lerpVectors(
          this.currentTransition.startState.position,
          this.currentTransition.targetState.position,
          easedProgress
        )

        // Interpolate rotation
        const currentRot = new Euler().setFromVector3(
          new Vector3(
            MathUtils.lerp(
              this.currentTransition.startState.rotation.x,
              this.currentTransition.targetState.rotation.x,
              easedProgress
            ),
            MathUtils.lerp(
              this.currentTransition.startState.rotation.y,
              this.currentTransition.targetState.rotation.y,
              easedProgress
            ),
            MathUtils.lerp(
              this.currentTransition.startState.rotation.z,
              this.currentTransition.targetState.rotation.z,
              easedProgress
            )
          )
        )

        // Apply interpolated values
        this.camera.position.copy(currentPos)
        this.camera.rotation.copy(currentRot)

        // Interpolate zoom if applicable
        if (this.currentTransition.targetState.zoom !== undefined && 'zoom' in this.camera) {
          const currentZoom = MathUtils.lerp(
            this.currentTransition.startState.zoom || 1,
            this.currentTransition.targetState.zoom,
            easedProgress
          )
          ;(this.camera as any).zoom = currentZoom
        }

        // Interpolate FOV if applicable
        if (this.currentTransition.targetState.fov !== undefined && 'fov' in this.camera) {
          const currentFov = MathUtils.lerp(
            this.currentTransition.startState.fov || 75,
            this.currentTransition.targetState.fov,
            easedProgress
          )
          ;(this.camera as any).fov = currentFov
          ;(this.camera as any).updateProjectionMatrix?.()
        }

        // Handle lookAt target
        if (options.lookAt) {
          this.camera.lookAt(options.lookAt)
        }

        options.onUpdate?.(progress)

        if (progress >= 1) {
          this.isTransitioningFlag = false
          this.currentTransition = null
          options.onComplete?.()
          resolve()
        } else {
          this.animationFrameId = requestAnimationFrame(animate)
        }
      }

      this.animationFrameId = requestAnimationFrame(animate)
    })
  }

  stopTransition(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.isTransitioningFlag = false
    this.currentTransition = null
  }

  isTransitioning(): boolean {
    return this.isTransitioningFlag
  }

  async lookAt(target: Vector3, options: CameraTransitionOptions = { duration: 500, easing: 'easeInOut' }): Promise<void> {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    const currentState = this.getCurrentState()
    
    // Calculate the rotation needed to look at the target
    const tempCamera = this.camera.clone()
    tempCamera.lookAt(target)
    
    const targetState: CameraState = {
      ...currentState,
      rotation: tempCamera.rotation.clone()
    }

    return this.transitionTo(targetState, { ...options, lookAt: target })
  }

  orbitAround(center: Vector3, radius: number, angle: number): void {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    const x = center.x + radius * Math.cos(angle)
    const z = center.z + radius * Math.sin(angle)
    
    this.camera.position.set(x, this.camera.position.y, z)
    this.camera.lookAt(center)
  }

  shake(intensity: number, duration: number): void {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    const originalPosition = this.camera.position.clone()
    const startTime = performance.now()

    const shakeAnimation = () => {
      const elapsed = performance.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        this.camera!.position.copy(originalPosition)
        return
      }

      const currentIntensity = intensity * (1 - progress) // Fade out over time
      const offsetX = (Math.random() - 0.5) * currentIntensity
      const offsetY = (Math.random() - 0.5) * currentIntensity
      const offsetZ = (Math.random() - 0.5) * currentIntensity

      this.camera!.position.copy(originalPosition)
      this.camera!.position.add(new Vector3(offsetX, offsetY, offsetZ))

      requestAnimationFrame(shakeAnimation)
    }

    requestAnimationFrame(shakeAnimation)
  }

  async zoomTo(target: Vector3, distance: number, options: CameraTransitionOptions = { duration: 1000, easing: 'easeInOut' }): Promise<void> {
    if (!this.camera) {
      throw new Error('Camera not set')
    }

    const direction = new Vector3().subVectors(this.camera.position, target).normalize()
    const newPosition = target.clone().add(direction.multiplyScalar(distance))

    const targetState: CameraState = {
      position: newPosition,
      rotation: this.camera.rotation.clone()
    }

    return this.transitionTo(targetState, { ...options, lookAt: target })
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t
      case 'easeIn':
        return t * t
      case 'easeOut':
        return 1 - (1 - t) * (1 - t)
      case 'easeInOut':
      default:
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }
  }

  dispose(): void {
    this.stopTransition()
    this.camera = null
  }
}