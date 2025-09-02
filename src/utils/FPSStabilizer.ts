export interface StabilizationConfig {
  targetFPS: number;
  toleranceRange: number; // ±5 FPS tolerance
  adaptiveRendering: boolean;
  frameSkipping: boolean;
  dynamicQuality: boolean;
  smoothingFactor: number; // 0.1 - 1.0
}

export interface FrameMetrics {
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  variance: number;
  stability: number; // 0-1 scale
  dropped: number;
  rendered: number;
}

export class FPSStabilizer {
  private static instance: FPSStabilizer;
  private config: StabilizationConfig;
  private frameHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private droppedFrames: number = 0;
  private renderedFrames: number = 0;
  private rafId: number | null = null;
  private isStabilizing: boolean = false;
  
  // Adaptive rendering
  private renderQueue: (() => void)[] = [];
  private priorityQueue: (() => void)[] = [];
  private isProcessingFrame: boolean = false;
  
  // Quality adjustment
  private qualitySteps: number[] = [0.25, 0.5, 0.75, 1.0];
  private currentQualityIndex: number = 3; // Start at highest quality
  
  private constructor() {
    this.config = {
      targetFPS: 60,
      toleranceRange: 5,
      adaptiveRendering: true,
      frameSkipping: true,
      dynamicQuality: true,
      smoothingFactor: 0.3
    };
  }

  static getInstance(): FPSStabilizer {
    if (!FPSStabilizer.instance) {
      FPSStabilizer.instance = new FPSStabilizer();
    }
    return FPSStabilizer.instance;
  }

  setConfig(config: Partial<StabilizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start FPS stabilization
   */
  start(): void {
    if (this.isStabilizing) return;
    
    this.isStabilizing = true;
    this.lastFrameTime = performance.now();
    this.startFrameLoop();
    
    console.log('FPS Stabilizer started with target:', this.config.targetFPS);
  }

  /**
   * Stop FPS stabilization
   */
  stop(): void {
    this.isStabilizing = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    console.log('FPS Stabilizer stopped');
  }

  /**
   * Add a rendering task to the queue
   */
  queueRenderTask(task: () => void, priority: boolean = false): void {
    if (priority) {
      this.priorityQueue.push(task);
    } else {
      this.renderQueue.push(task);
    }
  }

  /**
   * Process render tasks with frame budget management
   */
  private processRenderTasks(frameTime: number): void {
    if (this.isProcessingFrame) return;
    
    this.isProcessingFrame = true;
    const startTime = performance.now();
    const targetFrameTime = 1000 / this.config.targetFPS;
    const maxBudget = targetFrameTime * 0.8; // Use 80% of frame budget
    
    // Process priority tasks first
    while (this.priorityQueue.length > 0 && (performance.now() - startTime) < maxBudget) {
      const task = this.priorityQueue.shift();
      if (task) {
        try {
          task();
        } catch (error) {
          console.error('Priority task error:', error);
        }
      }
    }
    
    // Process regular tasks with remaining budget
    while (this.renderQueue.length > 0 && (performance.now() - startTime) < maxBudget) {
      const task = this.renderQueue.shift();
      if (task) {
        try {
          task();
        } catch (error) {
          console.error('Render task error:', error);
        }
      }
    }
    
    this.isProcessingFrame = false;
  }

  /**
   * Main frame loop with stabilization
   */
  private startFrameLoop(): void {
    const frameLoop = (currentTime: number) => {
      if (!this.isStabilizing) return;
      
      const deltaTime = currentTime - this.lastFrameTime;
      const currentFPS = deltaTime > 0 ? 1000 / deltaTime : 0;
      
      // Update frame metrics
      this.updateFrameMetrics(currentFPS);
      
      // Decide whether to render this frame
      const shouldRender = this.shouldRenderFrame(currentFPS, deltaTime);
      
      if (shouldRender) {
        // Process render tasks with budget management
        this.processRenderTasks(deltaTime);
        this.renderedFrames++;
      } else {
        // Skip this frame
        this.droppedFrames++;
      }
      
      // Adaptive quality adjustment
      if (this.config.dynamicQuality) {
        this.adjustQuality();
      }
      
      this.lastFrameTime = currentTime;
      this.frameCount++;
      
      this.rafId = requestAnimationFrame(frameLoop);
    };
    
    this.rafId = requestAnimationFrame(frameLoop);
  }

  /**
   * Update frame timing metrics
   */
  private updateFrameMetrics(currentFPS: number): void {
    // Add to history with smoothing
    this.frameHistory.push(currentFPS);
    
    // Keep only recent history
    if (this.frameHistory.length > 60) { // 1 second at 60fps
      this.frameHistory.shift();
    }
  }

  /**
   * Determine if current frame should be rendered
   */
  private shouldRenderFrame(currentFPS: number, deltaTime: number): boolean {
    if (!this.config.frameSkipping) return true;
    
    const targetFrameTime = 1000 / this.config.targetFPS;
    const metrics = this.getMetrics();
    
    // Skip frame if we're consistently above target FPS
    if (metrics.averageFPS > this.config.targetFPS + this.config.toleranceRange) {
      return this.frameCount % 2 === 0; // Skip every other frame
    }
    
    // Always render if below target
    if (metrics.averageFPS < this.config.targetFPS - this.config.toleranceRange) {
      return true;
    }
    
    // Adaptive skipping based on frame variance
    if (metrics.variance > 50) { // High variance
      return deltaTime >= targetFrameTime * 0.9;
    }
    
    return true;
  }

  /**
   * Adjust rendering quality based on performance
   */
  private adjustQuality(): void {
    const metrics = this.getMetrics();
    const targetFPS = this.config.targetFPS;
    
    // Decrease quality if FPS is too low
    if (metrics.averageFPS < targetFPS - this.config.toleranceRange) {
      if (this.currentQualityIndex > 0) {
        this.currentQualityIndex--;
        this.notifyQualityChange();
      }
    }
    // Increase quality if FPS is stable and high
    else if (metrics.averageFPS > targetFPS + this.config.toleranceRange && 
             metrics.stability > 0.8) {
      if (this.currentQualityIndex < this.qualitySteps.length - 1) {
        this.currentQualityIndex++;
        this.notifyQualityChange();
      }
    }
  }

  /**
   * Notify other systems of quality changes
   */
  private notifyQualityChange(): void {
    const newQuality = this.qualitySteps[this.currentQualityIndex];
    const event = new CustomEvent('fpsStabilizerQualityChange', {
      detail: { quality: newQuality }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current frame metrics
   */
  getMetrics(): FrameMetrics {
    if (this.frameHistory.length === 0) {
      return {
        currentFPS: 0,
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        variance: 0,
        stability: 0,
        dropped: this.droppedFrames,
        rendered: this.renderedFrames
      };
    }
    
    const currentFPS = this.frameHistory[this.frameHistory.length - 1];
    const averageFPS = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    const minFPS = Math.min(...this.frameHistory);
    const maxFPS = Math.max(...this.frameHistory);
    
    // Calculate variance
    const variance = this.frameHistory.reduce((sum, fps) => {
      return sum + Math.pow(fps - averageFPS, 2);
    }, 0) / this.frameHistory.length;
    
    // Calculate stability (0-1, where 1 is perfectly stable)
    const fpsRange = maxFPS - minFPS;
    const stability = Math.max(0, 1 - (fpsRange / this.config.targetFPS));
    
    return {
      currentFPS,
      averageFPS,
      minFPS,
      maxFPS,
      variance,
      stability,
      dropped: this.droppedFrames,
      rendered: this.renderedFrames
    };
  }

  /**
   * Get current quality level
   */
  getCurrentQuality(): number {
    return this.qualitySteps[this.currentQualityIndex];
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.frameHistory = [];
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.renderedFrames = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * Force a specific quality level
   */
  setQuality(quality: number): void {
    const index = this.qualitySteps.findIndex(q => q >= quality);
    if (index !== -1) {
      this.currentQualityIndex = index;
      this.notifyQualityChange();
    }
  }

  /**
   * Get stabilization status
   */
  getStatus() {
    return {
      isStabilizing: this.isStabilizing,
      config: this.config,
      currentQuality: this.getCurrentQuality(),
      queueSize: this.renderQueue.length + this.priorityQueue.length,
      metrics: this.getMetrics()
    };
  }

  /**
   * Dispose of the stabilizer
   */
  dispose(): void {
    this.stop();
    this.renderQueue = [];
    this.priorityQueue = [];
    this.resetMetrics();
  }
}

// Export singleton instance
export const fpsStabilizer = FPSStabilizer.getInstance();
