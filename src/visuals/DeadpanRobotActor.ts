
import {
  Group,
  Mesh,
  BoxGeometry,
  MeshPhongMaterial,
  CircleGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PlaneGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  SpotLight,
  Vector3,
} from 'three';

/**
 * Animation state types for the Deadpan Robot
 */
export type RobotAnimationState = 
  | 'idle' 
  | 'speaking' 
  | 'processing' 
  | 'paused' 
  | 'tilting';

/**
 * DeadpanRobotActor - Mechanical robot with distinctive animations
 * 
 * Features:
 * - Mechanical head-tilt 15° between phrases
 * - LED-eye blink pattern (rhythmic, not random)
 * - 'Processing' idle with subtle vibration
 * - Abrupt snap-to-position movements (no easing)
 * - Integration with [pause 2s] and [processing...] timing cues
 */
export class DeadpanRobotActor {
    public group: Group;
    private bodyMesh: Mesh;
    private headGroup: Group;
    private leftEye: Mesh;
    private rightEye: Mesh;
    private spotlight: SpotLight;
    
    // Animation state
    private animationState: RobotAnimationState = 'idle';
    private headTiltAngle: number = 0;
    private targetHeadTilt: number = 0;
    private vibrationOffset: Vector3 = new Vector3();
    
    // Blink pattern (rhythmic - 3 rapid blinks every 4 seconds)
    private blinkTimer: number = 0;
    private readonly BLINK_INTERVAL: number = 4000; // ms
    private readonly BLINK_DURATION: number = 150; // ms per blink

    private isBlinking: boolean = false;
    
    // Processing vibration
    private readonly VIBRATION_AMPLITUDE: number = 0.015;
    private readonly VIBRATION_FREQUENCY: number = 50; // Hz
    
    // Timing
    private lastUpdateTime: number = performance.now();
    
    // Materials for state changes
    private eyeMaterial: MeshBasicMaterial;
    private processingEyeMaterial: MeshBasicMaterial;

    /**
     * Creates a 3D deadpan robot
     * @param id - Unique actor identifier
     * @param color - Hex color string (default: silver #C0C0C0)
     * @param x - X position on stage
     */
    constructor(_id: string, color: string = '#C0C0C0', x: number) {
        this.group = new Group();
        this.group.position.set(x, 0, 0);

        // Robot Body - Boxy mechanical design instead of capsule
        const bodyGeo = new BoxGeometry(0.5, 1.2, 0.4);
        const bodyMat = new MeshPhongMaterial({ 
            color: color,
            shininess: 80,
            specular: 0x444444
        });
        this.bodyMesh = new Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.6;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.group.add(this.bodyMesh);

        // Mechanical details - chest panel
        const chestGeo = new BoxGeometry(0.35, 0.4, 0.05);
        const chestMat = new MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 60
        });
        const chest = new Mesh(chestGeo, chestMat);
        chest.position.set(0, 0.1, 0.2);
        this.bodyMesh.add(chest);

        // Status light on chest
        const statusGeo = new CircleGeometry(0.04, 16);
        this.processingEyeMaterial = new MeshBasicMaterial({ 
            color: 0x00ff00,
            side: DoubleSide
        });
        const status = new Mesh(statusGeo, this.processingEyeMaterial);
        status.position.set(0, 0.1, 0.23);
        this.bodyMesh.add(status);

        // Head Group - separate for tilting
        this.headGroup = new Group();
        this.headGroup.position.set(0, 0.7, 0); // At top of body
        this.bodyMesh.add(this.headGroup);

        // Robot Head - Box shape
        const headGeo = new BoxGeometry(0.45, 0.4, 0.45);
        const headMat = new MeshPhongMaterial({ 
            color: color,
            shininess: 80,
            specular: 0x444444
        });
        const head = new Mesh(headGeo, headMat);
        head.castShadow = true;
        this.headGroup.add(head);

        // LED Eyes - Glowing panels
        this.eyeMaterial = new MeshBasicMaterial({ 
            color: 0x00ffff, // Cyan LED color
            side: DoubleSide
        });

        // Left eye
        const eyeGeo = new PlaneGeometry(0.08, 0.04);
        this.leftEye = new Mesh(eyeGeo, this.eyeMaterial.clone());
        this.leftEye.position.set(-0.1, 0, 0.23);
        head.add(this.leftEye);

        // Right eye
        this.rightEye = new Mesh(eyeGeo, this.eyeMaterial.clone());
        this.rightEye.position.set(0.1, 0, 0.23);
        head.add(this.rightEye);

        // Antenna
        const antennaGeo = new CylinderGeometry(0.01, 0.01, 0.2);
        const antennaMat = new MeshStandardMaterial({ color: 0x666666 });
        const antenna = new Mesh(antennaGeo, antennaMat);
        antenna.position.set(0.15, 0.3, 0);
        head.add(antenna);

        // Antenna tip
        const tipGeo = new SphereGeometry(0.03);
        const tipMat = new MeshBasicMaterial({ color: 0xff0000 }); // Red tip
        const tip = new Mesh(tipGeo, tipMat);
        tip.position.set(0.15, 0.4, 0);
        head.add(tip);

        // Spotlight for highlighting when talking
        this.spotlight = new SpotLight(0xffffff, 0);
        this.spotlight.position.set(0, 5, 2);
        this.spotlight.target = this.bodyMesh;
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.castShadow = true;
        this.group.add(this.spotlight);

        // Initialize blink timer with random offset so robots don't sync
        this.blinkTimer = Math.random() * this.BLINK_INTERVAL;
    }

    /**
     * Sets the talking state
     */
    setTalking(isTalking: boolean) {
        this.spotlight.intensity = isTalking ? 50 : 0;
        if (isTalking && this.animationState !== 'processing') {
            this.animationState = 'speaking';
        }
    }

    /**
     * Trigger a mechanical head tilt (15 degrees)
     * Snaps to position without easing
     * @param direction - 'left', 'right', or 'reset'
     */
    tiltHead(direction: 'left' | 'right' | 'reset') {
        const TILT_ANGLE = Math.PI / 12; // 15 degrees
        
        switch (direction) {
            case 'left':
                this.targetHeadTilt = TILT_ANGLE;
                break;
            case 'right':
                this.targetHeadTilt = -TILT_ANGLE;
                break;
            case 'reset':
                this.targetHeadTilt = 0;
                break;
        }
        
        // Snap immediately - no easing
        this.headTiltAngle = this.targetHeadTilt;
        this.animationState = 'tilting';
        
        // Return to idle after brief tilt
        setTimeout(() => {
            if (this.animationState === 'tilting') {
                this.animationState = 'idle';
            }
        }, 200);
    }

    /**
     * Set processing state - triggers vibration animation
     */
    setProcessing(isProcessing: boolean) {
        if (isProcessing) {
            this.animationState = 'processing';
            // Change eyes to indicate processing
            (this.leftEye.material as MeshBasicMaterial).color.setHex(0xffaa00); // Orange
            (this.rightEye.material as MeshBasicMaterial).color.setHex(0xffaa00);
            this.processingEyeMaterial.color.setHex(0xffaa00); // Status light
        } else {
            this.animationState = 'idle';
            // Reset eyes to cyan
            (this.leftEye.material as MeshBasicMaterial).color.setHex(0x00ffff);
            (this.rightEye.material as MeshBasicMaterial).color.setHex(0x00ffff);
            this.processingEyeMaterial.color.setHex(0x00ff00); // Status light
        }
    }

    /**
     * Set paused state (for [pause 2s] cues)
     */
    setPaused(isPaused: boolean) {
        if (isPaused) {
            this.animationState = 'paused';
            // Dim eyes slightly during pause
            (this.leftEye.material as MeshBasicMaterial).color.multiplyScalar(0.5);
            (this.rightEye.material as MeshBasicMaterial).color.multiplyScalar(0.5);
        } else {
            this.animationState = 'idle';
            // Restore eye brightness
            (this.leftEye.material as MeshBasicMaterial).color.setHex(0x00ffff);
            (this.rightEye.material as MeshBasicMaterial).color.setHex(0x00ffff);
        }
    }

    /**
     * Get current animation state
     */
    getAnimationState(): RobotAnimationState {
        return this.animationState;
    }

    /**
     * Update the robot animation
     * @param volume - Audio volume for lip-sync-like response
     */
    update(volume: number) {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Apply head tilt (snap - no easing)
        this.headGroup.rotation.z = this.headTiltAngle;

        // Rhythmic LED blink pattern (3 rapid blinks every 4 seconds)
        this.updateBlinkPattern(currentTime, deltaTime);

        // Processing vibration
        if (this.animationState === 'processing') {
            this.updateVibration(currentTime);
        } else {
            this.vibrationOffset.set(0, 0, 0);
        }

        // Audio-responsive head movement (subtle nodding while speaking)
        if (this.animationState === 'speaking' && volume > 0.1) {
            this.headGroup.rotation.x = Math.sin(currentTime * 0.02) * 0.05 * volume;
        } else {
            this.headGroup.rotation.x = 0;
        }

        // Apply vibration offset
        this.bodyMesh.position.x = this.vibrationOffset.x;
        this.bodyMesh.position.y = 0.6 + this.vibrationOffset.y;
        this.bodyMesh.position.z = this.vibrationOffset.z;
    }

    /**
     * Rhythmic blink pattern - 3 rapid blinks every 4 seconds
     */
    private updateBlinkPattern(_currentTime: number, deltaTime: number) {
        this.blinkTimer += deltaTime;

        // Check if it's time for a blink cycle
        if (this.blinkTimer >= this.BLINK_INTERVAL) {
            this.blinkTimer = 0;

            this.isBlinking = true;
        }

        if (this.isBlinking) {
            // Triple blink pattern: on-off-on-off-on-off
            const cyclePosition = this.blinkTimer % (this.BLINK_DURATION * 2);
            const isVisible = cyclePosition < this.BLINK_DURATION;
            
            // Scale eyes to simulate blink (Y scale to 0.1 for closed)
            const eyeScale = isVisible ? 1 : 0.1;
            this.leftEye.scale.y = eyeScale;
            this.rightEye.scale.y = eyeScale;

            // Check if we completed all 3 blinks
            if (this.blinkTimer >= this.BLINK_DURATION * 6) {
                this.isBlinking = false;
    
                // Reset eyes
                this.leftEye.scale.y = 1;
                this.rightEye.scale.y = 1;
            }
        }
    }

    /**
     * Subtle vibration for processing state
     */
    private updateVibration(currentTime: number) {
        const time = currentTime * 0.001;
        const vibeX = Math.sin(time * this.VIBRATION_FREQUENCY) * this.VIBRATION_AMPLITUDE;
        const vibeY = Math.cos(time * this.VIBRATION_FREQUENCY * 1.3) * this.VIBRATION_AMPLITUDE;
        const vibeZ = Math.sin(time * this.VIBRATION_FREQUENCY * 0.7) * this.VIBRATION_AMPLITUDE * 0.5;
        
        this.vibrationOffset.set(vibeX, vibeY, vibeZ);
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.group.traverse((child) => {
            if (child instanceof Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}

/**
 * Timing cue parser for robot animations
 * Extracts [pause Xs] and [processing...] cues from text
 */
export interface TimingCue {
    type: 'pause' | 'processing';
    duration: number; // milliseconds
    position: number; // position in text
}

export function parseTimingCues(text: string): { cleanText: string; cues: TimingCue[] } {
    const cues: TimingCue[] = [];
    let cleanText = text;
    
    // Parse [pause Xs] cues
    const pauseRegex = /\[pause\s+(\d+)s\]/g;
    let match;
    while ((match = pauseRegex.exec(text)) !== null) {
        cues.push({
            type: 'pause',
            duration: parseInt(match[1]) * 1000,
            position: match.index
        });
    }
    cleanText = cleanText.replace(pauseRegex, '');
    
    // Parse [processing...] cues
    const processingRegex = /\[processing\.\.\.\]/g;
    while ((match = processingRegex.exec(text)) !== null) {
        cues.push({
            type: 'processing',
            duration: 2000, // Default 2 seconds
            position: match.index
        });
    }
    cleanText = cleanText.replace(processingRegex, '');
    
    // Also clean up other robot sound effects that shouldn't be spoken
    cleanText = cleanText.replace(/\[whirring noise\]/g, '');
    cleanText = cleanText.replace(/\[error beep\]/g, '');
    cleanText = cleanText.replace(/\[calculating\.\.\.\]/g, '');
    
    // Trim and clean up
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return { cleanText, cues };
}

/**
 * Animation sequence for robot speech with timing cues
 */
export class RobotAnimationSequence {
    private cues: TimingCue[];
    private currentCueIndex: number = 0;
    private startTime: number;
    private robot: DeadpanRobotActor;

    constructor(cues: TimingCue[], robot: DeadpanRobotActor) {
        this.cues = cues.sort((a, b) => a.position - b.position);
        this.startTime = performance.now();
        this.robot = robot;
    }

    /**
     * Update animation based on elapsed time
     * Returns true if sequence is complete
     */
    update(): boolean {
        const elapsed = performance.now() - this.startTime;
        
        // Process current cue
        if (this.currentCueIndex < this.cues.length) {
            const cue = this.cues[this.currentCueIndex];
            
            if (elapsed >= cue.position) {
                this.executeCue(cue);
                this.currentCueIndex++;
            }
        }
        
        // Check if all cues are done
        if (this.currentCueIndex >= this.cues.length) {
            const lastCue = this.cues[this.cues.length - 1];
            if (lastCue && elapsed >= lastCue.position + lastCue.duration) {
                return true; // Sequence complete
            }
        }
        
        return false;
    }

    private executeCue(cue: TimingCue) {
        switch (cue.type) {
            case 'pause':
                this.robot.setPaused(true);
                // Head tilt during pause (alternate directions)
                const direction = this.currentCueIndex % 2 === 0 ? 'left' : 'right';
                this.robot.tiltHead(direction);
                
                setTimeout(() => {
                    this.robot.setPaused(false);
                    this.robot.tiltHead('reset');
                }, cue.duration);
                break;
                
            case 'processing':
                this.robot.setProcessing(true);
                setTimeout(() => {
                    this.robot.setProcessing(false);
                }, cue.duration);
                break;
        }
    }

    stop() {
        this.robot.setProcessing(false);
        this.robot.setPaused(false);
        this.robot.tiltHead('reset');
    }
}
