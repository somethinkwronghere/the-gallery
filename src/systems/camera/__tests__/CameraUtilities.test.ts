import { Vector3, Euler, PerspectiveCamera } from 'three'
import { CameraUtilities } from '../CameraUtilities'

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow }
})

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn()
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
})

describe('CameraUtilities', () => {
  let cameraUtilities: CameraUtilities
  let camera: PerspectiveCamera
  let mockTime: number

  beforeEach(() => {
    camera = new PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.rotation.set(0, 0, 0)
    
    cameraUtilities = new CameraUtilities(camera)
    
    mockTime = 0
    mockPerformanceNow.mockImplementation(() => mockTime)
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16) // Simulate 60fps
      return 1
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentState', () => {
    it('should return current camera state', () => {
      const state = cameraUtilities.getCurrentState()
      
      expect(state.position).toEqual(new Vector3(0, 0, 5))
      expect(state.rotation).toEqual(new Euler(0, 0, 0))
      expect(state.fov).toBe(75)
    })

    it('should throw error if camera not set', () => {
      const utilitiesWithoutCamera = new CameraUtilities()
      
      expect(() => utilitiesWithoutCamera.getCurrentState()).toThrow('Camera not set')
    })
  })

  describe('setState', () => {
    it('should set camera state immediately when no transition options', async () => {
      const targetState = {
        position: new Vector3(10, 5, 0),
        rotation: new Euler(0.1, 0.2, 0.3),
        fov: 60
      }

      await cameraUtilities.setState(targetState)

      expect(camera.position).toEqual(targetState.position)
      expect(camera.rotation).toEqual(targetState.rotation)
      expect(camera.fov).toBe(60)
    })

    it('should use transition when duration is specified', async () => {
      const targetState = {
        position: new Vector3(10, 5, 0),
        rotation: new Euler(0.1, 0.2, 0.3)
      }

      const transitionPromise = cameraUtilities.setState(targetState, {
        duration: 1000,
        easing: 'linear'
      })

      expect(cameraUtilities.isTransitioning()).toBe(true)
      
      // Simulate time passing
      mockTime = 500 // 50% through transition
      
      await transitionPromise
      expect(cameraUtilities.isTransitioning()).toBe(false)
    })
  })

  describe('transitionTo', () => {
    it('should transition camera position smoothly', async () => {
      const startPosition = new Vector3(0, 0, 5)
      const targetPosition = new Vector3(10, 0, 5)
      
      const onUpdate = jest.fn()
      const onComplete = jest.fn()

      const transitionPromise = cameraUtilities.transitionTo(
        { position: targetPosition, rotation: new Euler(0, 0, 0) },
        {
          duration: 1000,
          easing: 'linear',
          onUpdate,
          onComplete
        }
      )

      expect(cameraUtilities.isTransitioning()).toBe(true)
      
      // Simulate transition completion
      mockTime = 1000
      await transitionPromise

      expect(onComplete).toHaveBeenCalled()
      expect(cameraUtilities.isTransitioning()).toBe(false)
    })

    it('should stop existing transition when starting new one', async () => {
      const firstTarget = { position: new Vector3(5, 0, 0), rotation: new Euler(0, 0, 0) }
      const secondTarget = { position: new Vector3(10, 0, 0), rotation: new Euler(0, 0, 0) }

      // Start first transition
      const firstTransition = cameraUtilities.transitionTo(firstTarget, { duration: 1000, easing: 'linear' })
      expect(cameraUtilities.isTransitioning()).toBe(true)

      // Start second transition (should stop first)
      const secondTransition = cameraUtilities.transitionTo(secondTarget, { duration: 500, easing: 'linear' })
      
      expect(cameraUtilities.isTransitioning()).toBe(true)
      
      // Complete second transition
      mockTime = 500
      await secondTransition
      
      expect(cameraUtilities.isTransitioning()).toBe(false)
    })
  })

  describe('lookAt', () => {
    it('should orient camera to look at target', async () => {
      const target = new Vector3(10, 0, 0)
      
      await cameraUtilities.lookAt(target, { duration: 0, easing: 'linear' })
      
      // Camera should be oriented towards the target
      const direction = new Vector3()
      camera.getWorldDirection(direction)
      
      // The camera should be looking in the positive X direction
      expect(direction.x).toBeGreaterThan(0.9)
    })
  })

  describe('orbitAround', () => {
    it('should position camera in orbit around center point', () => {
      const center = new Vector3(0, 0, 0)
      const radius = 10
      const angle = Math.PI / 2 // 90 degrees

      cameraUtilities.orbitAround(center, radius, angle)

      // Camera should be positioned at (0, y, 10) for 90 degree angle
      expect(camera.position.x).toBeCloseTo(0, 5)
      expect(camera.position.z).toBeCloseTo(10, 5)
    })
  })

  describe('shake', () => {
    it('should apply shake effect to camera', () => {
      const originalPosition = camera.position.clone()
      const intensity = 0.5
      const duration = 100

      cameraUtilities.shake(intensity, duration)

      // Camera position should be modified (shake effect)
      // Note: This test is simplified as the actual shake is animated
      expect(camera.position).not.toEqual(originalPosition)
    })
  })

  describe('zoomTo', () => {
    it('should position camera at specified distance from target', async () => {
      const target = new Vector3(0, 0, 0)
      const distance = 15

      await cameraUtilities.zoomTo(target, distance, { duration: 0, easing: 'linear' })

      // Camera should be at the specified distance from target
      const actualDistance = camera.position.distanceTo(target)
      expect(actualDistance).toBeCloseTo(distance, 1)
    })
  })

  describe('stopTransition', () => {
    it('should stop ongoing transition', () => {
      const target = { position: new Vector3(10, 0, 0), rotation: new Euler(0, 0, 0) }
      
      cameraUtilities.transitionTo(target, { duration: 1000, easing: 'linear' })
      expect(cameraUtilities.isTransitioning()).toBe(true)
      
      cameraUtilities.stopTransition()
      expect(cameraUtilities.isTransitioning()).toBe(false)
    })
  })

  describe('easing functions', () => {
    it('should apply linear easing correctly', () => {
      // Access private method for testing
      const applyEasing = (cameraUtilities as any).applyEasing
      
      expect(applyEasing(0, 'linear')).toBe(0)
      expect(applyEasing(0.5, 'linear')).toBe(0.5)
      expect(applyEasing(1, 'linear')).toBe(1)
    })

    it('should apply easeIn easing correctly', () => {
      const applyEasing = (cameraUtilities as any).applyEasing
      
      expect(applyEasing(0, 'easeIn')).toBe(0)
      expect(applyEasing(0.5, 'easeIn')).toBe(0.25)
      expect(applyEasing(1, 'easeIn')).toBe(1)
    })

    it('should apply easeOut easing correctly', () => {
      const applyEasing = (cameraUtilities as any).applyEasing
      
      expect(applyEasing(0, 'easeOut')).toBe(0)
      expect(applyEasing(1, 'easeOut')).toBe(1)
      // easeOut should have faster initial progress
      expect(applyEasing(0.5, 'easeOut')).toBeGreaterThan(0.5)
    })
  })

  describe('dispose', () => {
    it('should clean up resources', () => {
      cameraUtilities.transitionTo(
        { position: new Vector3(10, 0, 0), rotation: new Euler(0, 0, 0) },
        { duration: 1000, easing: 'linear' }
      )
      
      expect(cameraUtilities.isTransitioning()).toBe(true)
      
      cameraUtilities.dispose()
      
      expect(cameraUtilities.isTransitioning()).toBe(false)
    })
  })
})