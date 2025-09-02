/**
 * Mobile Input Manager
 * Manages mobile input state and integrates with existing player controls
 */

interface MobileInputState {
  movement: {
    forward: number;
    backward: number;
    left: number;
    right: number;
  };
  camera: {
    pitch: number;
    yaw: number;
  };
  actions: {
    jump: boolean;
    interact: boolean;
  };
}

class MobileInputManager {
  private static instance: MobileInputManager;
  private inputState: MobileInputState;
  private listeners: Set<(state: MobileInputState) => void> = new Set();

  private constructor() {
    this.inputState = {
      movement: { forward: 0, backward: 0, left: 0, right: 0 },
      camera: { pitch: 0, yaw: 0 },
      actions: { jump: false, interact: false }
    };
  }

  public static getInstance(): MobileInputManager {
    if (!MobileInputManager.instance) {
      MobileInputManager.instance = new MobileInputManager();
    }
    return MobileInputManager.instance;
  }

  public updateMovement(direction: { x: number; z: number }): void {
    // Convert joystick input to movement keys (fix direction)
    this.inputState.movement.forward = Math.max(0, direction.z);  // Fixed: removed negative
    this.inputState.movement.backward = Math.max(0, -direction.z); // Fixed: added negative
    this.inputState.movement.left = Math.max(0, -direction.x);
    this.inputState.movement.right = Math.max(0, direction.x);
    
    this.notifyListeners();
  }

  public updateCamera(rotation: { x: number; y: number }): void {
    this.inputState.camera.pitch = rotation.x;
    this.inputState.camera.yaw = rotation.y;
    
    this.notifyListeners();
  }

  public updateAction(action: 'jump' | 'interact', pressed: boolean): void {
    this.inputState.actions[action] = pressed;
    this.notifyListeners();
  }

  public getInputState(): MobileInputState {
    return { ...this.inputState };
  }

  public subscribe(listener: (state: MobileInputState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.inputState));
  }

  // Method to simulate keyboard events for compatibility (deprecated - using direct integration instead)
  public simulateKeyboardEvents(): void {
    // This method is kept for compatibility but we now use direct integration in MobilePlayer
    console.log('simulateKeyboardEvents called - using direct integration instead');
  }

  private dispatchKey(code: string, type: 'keydown' | 'keyup', target: Element): void {
    const event = new KeyboardEvent(type, {
      code,
      key: this.codeToKey(code),
      bubbles: true,
      cancelable: true
    });
    
    target.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  private codeToKey(code: string): string {
    const mapping: { [key: string]: string } = {
      'KeyW': 'w',
      'KeyS': 's',
      'KeyA': 'a',
      'KeyD': 'd',
      'Space': ' '
    };
    return mapping[code] || code;
  }
}

export default MobileInputManager;
