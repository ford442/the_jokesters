
import {
  Mesh,
  CapsuleGeometry,
  MeshPhongMaterial,
  BoxGeometry,
  Material,
} from 'three';
import { Actor } from './Actor';

/**
 * TechBroActor - Extended Actor with Tech Bro specific animations
 * 
 * Orange (#FF6B35) colored avatar with:
 * - Confident chest-out idle pose
 * - Finger-guns gesture for punchlines
 * - Hair-flip animation (simulated on capsule)
 * - 'Checking Apple Watch' motion for timing
 * - Enhanced lip-sync for faster speech pattern
 * 
 * Compatible with Actor's LOD system - reattaches custom elements after LOD changes
 */
export class TechBroActor extends Actor {
    // Custom Tech Bro elements
    private hairElement: Mesh | null = null;
    private wristElement: Mesh | null = null;
    private gunHandLeft: Mesh | null = null;
    private gunHandRight: Mesh | null = null;
    
    // Animation state
    private isGestureAnimating: boolean = false;
    private animationType: 'idle' | 'fingerguns' | 'hairflip' | 'watchcheck' = 'idle';
    private animationTime: number = 0;
    private animationDuration: number = 0;
    private currentMesh: Mesh | null = null;
    
    // Base confident pose values
    private readonly CONFIDENT_ROTATION_X = -0.08;
    private readonly CONFIDENT_POSITION_Y = 0.05;
    private readonly CONFIDENT_SCALE_X = 1.05;
    private readonly CONFIDENT_SCALE_Z = 1.05;
    private readonly CONFIDENT_SCALE_Y = 0.98;

    /**
     * Creates a Tech Bro 3D avatar with enhanced animations
     * @param id - Unique actor identifier
     * @param x - X position on stage
     */
    constructor(id: string, x: number) {
        // Call parent with orange Tech Bro color (z=0 for center-right positioning)
        super(id, '#FF6B35', x, 0);
        
        // Setup Tech Bro specific visual elements
        this.setupTechBroElements();
        
        // Set initial confident pose
        this.applyConfidentIdlePose();
    }
    
    /**
     * Get the current mesh from the Actor (accessing inherited protected/private)
     */
    private getCurrentMesh(): Mesh | null {
        // Access the mesh through the group (first child that's a Mesh)
        const mesh = this.group.children.find(child => child instanceof Mesh) as Mesh;
        return mesh || null;
    }
    
    /**
     * Setup additional visual elements for Tech Bro
     */
    private setupTechBroElements(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        this.currentMesh = mesh;
        
        // Create "hair" element - a small curved piece on top to simulate hair
        const hairGeo = new CapsuleGeometry(0.15, 0.3, 4, 8);
        const hairMat = new MeshPhongMaterial({ 
            color: 0x8B4513, // Brown hair color
            shininess: 50
        });
        this.hairElement = new Mesh(hairGeo, hairMat);
        this.hairElement.position.set(0, 0.7, 0.1);
        this.hairElement.rotation.x = Math.PI / 4;
        mesh.add(this.hairElement);
        
        // Create wrist/Apple Watch element
        const wristGeo = new BoxGeometry(0.15, 0.08, 0.05);
        const wristMat = new MeshPhongMaterial({ 
            color: 0x333333, // Dark watch band
            shininess: 80
        });
        this.wristElement = new Mesh(wristGeo, wristMat);
        // Position on left "wrist" (side of capsule)
        this.wristElement.position.set(-0.32, 0.1, 0);
        this.wristElement.visible = false; // Hidden by default
        mesh.add(this.wristElement);
    }
    
    /**
     * Reattach custom elements after LOD change (called by update loop)
     */
    private ensureElementsAttached(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh || mesh === this.currentMesh) return;
        
        // Mesh has changed (LOD update), reattach custom elements
        this.currentMesh = mesh;
        
        if (this.hairElement) {
            mesh.add(this.hairElement);
        }
        if (this.wristElement) {
            mesh.add(this.wristElement);
        }
        if (this.gunHandLeft) {
            mesh.add(this.gunHandLeft);
        }
        if (this.gunHandRight) {
            mesh.add(this.gunHandRight);
        }
        
        // Reapply confident pose
        this.applyConfidentIdlePose();
    }
    
    /**
     * Apply the confident chest-out idle pose
     * Slight backward lean with chest puffed out
     */
    private applyConfidentIdlePose(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Lean back slightly (rotate around X axis)
        mesh.rotation.x = this.CONFIDENT_ROTATION_X;
        
        // Slight upward position adjustment for "standing tall"
        mesh.position.y = this.CONFIDENT_POSITION_Y;
        
        // Subtle chest expansion (scale X slightly)
        mesh.scale.set(
            this.CONFIDENT_SCALE_X,
            this.CONFIDENT_SCALE_Y,
            this.CONFIDENT_SCALE_Z
        );
    }
    
    /**
     * Trigger finger-guns gesture for punchlines
     * "You've been disrupt-ed! *finger guns*"
     */
    triggerFingerGuns(): void {
        if (this.isGestureAnimating) return;
        
        this.isGestureAnimating = true;
        this.animationType = 'fingerguns';
        this.animationTime = 0;
        this.animationDuration = 1.2; // seconds
        
        // Create temporary "gun hands"
        this.createGunHands();
    }
    
    /**
     * Create gun hand elements
     */
    private createGunHands(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Remove any existing gun hands
        this.removeGunHands();
        
        // Hand geometry
        const handGeo = new CapsuleGeometry(0.08, 0.25, 4, 8);
        const handMat = new MeshPhongMaterial({ color: 0xFF6B35 });
        
        // Left gun hand (extending from left side)
        this.gunHandLeft = new Mesh(handGeo, handMat);
        this.gunHandLeft.position.set(-0.45, 0.2, 0.2);
        this.gunHandLeft.rotation.z = Math.PI / 2;
        this.gunHandLeft.rotation.y = -0.3;
        mesh.add(this.gunHandLeft);
        
        // Right gun hand
        this.gunHandRight = new Mesh(handGeo, handMat);
        this.gunHandRight.position.set(0.45, 0.2, 0.2);
        this.gunHandRight.rotation.z = -Math.PI / 2;
        this.gunHandRight.rotation.y = 0.3;
        mesh.add(this.gunHandRight);
    }
    
    /**
     * Remove gun hand elements
     */
    private removeGunHands(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        if (this.gunHandLeft) {
            mesh.remove(this.gunHandLeft);
            this.gunHandLeft.geometry.dispose();
            (this.gunHandLeft.material as Material).dispose();
            this.gunHandLeft = null;
        }
        if (this.gunHandRight) {
            mesh.remove(this.gunHandRight);
            this.gunHandRight.geometry.dispose();
            (this.gunHandRight.material as Material).dispose();
            this.gunHandRight = null;
        }
    }
    
    /**
     * Trigger hair-flip animation
     * Simulates flipping hair back with a head toss
     */
    triggerHairFlip(): void {
        if (this.isGestureAnimating) return;
        
        this.isGestureAnimating = true;
        this.animationType = 'hairflip';
        this.animationTime = 0;
        this.animationDuration = 0.8; // seconds
    }
    
    /**
     * Trigger Apple Watch check animation
     * Looking at wrist for timing/pretending to be busy
     */
    triggerWatchCheck(): void {
        if (this.isGestureAnimating) return;
        
        this.isGestureAnimating = true;
        this.animationType = 'watchcheck';
        this.animationTime = 0;
        this.animationDuration = 2.0; // seconds - takes time to check watch
        
        // Show the wrist element
        if (this.wristElement) {
            this.wristElement.visible = true;
        }
    }
    
    /**
     * Override update to handle Tech Bro specific animations
     * Enhanced lip-sync for faster speech pattern (0.9 temp = faster speech)
     */
    update(volume: number): void {
        const deltaTime = 0.016; // Approximate 60fps
        
        // Ensure custom elements are attached (handles LOD changes)
        this.ensureElementsAttached();
        
        // Handle gesture animations
        if (this.isGestureAnimating) {
            this.updateAnimation(deltaTime);
        } else {
            // Idle breathing animation (confident chest-out)
            this.updateIdleBreathing();
        }
        
        // Enhanced lip-sync for faster speech pattern
        this.updateLipSync(volume);
    }
    
    /**
     * Update lip-sync with faster response for Tech Bro's quick speech
     */
    private updateLipSync(volume: number): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Amplify volume for more responsive animation (faster speech = more movement)
        const amplifiedVolume = Math.min(volume * 1.3, 1.0);
        
        // Squash and stretch with higher frequency response
        const scale = 1 + amplifiedVolume * 0.6;
        
        // Apply to mesh while preserving confident pose scale
        mesh.scale.set(
            this.CONFIDENT_SCALE_X / Math.sqrt(scale), 
            this.CONFIDENT_SCALE_Y * scale, 
            this.CONFIDENT_SCALE_Z / Math.sqrt(scale)
        );
        
        // Adjust Y position to maintain grounded appearance
        mesh.position.y = this.CONFIDENT_POSITION_Y + 0.8 * (scale - 1);
    }
    
    /**
     * Subtle breathing animation for idle state
     */
    private updateIdleBreathing(): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        const time = Date.now() * 0.001;
        
        // Slow confident breathing
        const breathScale = 1 + Math.sin(time * 2) * 0.015;
        
        // Maintain chest-out pose with breathing
        mesh.scale.set(
            this.CONFIDENT_SCALE_X * breathScale,
            this.CONFIDENT_SCALE_Y / breathScale,
            this.CONFIDENT_SCALE_Z * breathScale
        );
        
        // Subtle chest heave
        mesh.position.y = this.CONFIDENT_POSITION_Y + Math.sin(time * 2) * 0.01;
        
        // Maintain confident rotation
        mesh.rotation.x = this.CONFIDENT_ROTATION_X;
        mesh.rotation.z = 0;
        mesh.rotation.y = 0;
    }
    
    /**
     * Update gesture animations
     */
    private updateAnimation(deltaTime: number): void {
        this.animationTime += deltaTime;
        const progress = Math.min(this.animationTime / this.animationDuration, 1.0);
        
        switch (this.animationType) {
            case 'fingerguns':
                this.updateFingerGunsAnimation(progress);
                break;
            case 'hairflip':
                this.updateHairFlipAnimation(progress);
                break;
            case 'watchcheck':
                this.updateWatchCheckAnimation(progress);
                break;
        }
        
        // End animation
        if (progress >= 1.0) {
            this.endAnimation();
        }
    }
    
    /**
     * Finger guns animation - pew pew!
     */
    private updateFingerGunsAnimation(progress: number): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Phase 1: Extend guns (0-0.2)
        // Phase 2: Recoil/shoot (0.2-0.4)
        // Phase 3: Hold pose (0.4-0.7)
        // Phase 4: Retract (0.7-1.0)
        
        if (progress < 0.2) {
            // Extend
            const p = progress / 0.2;
            mesh.rotation.y = p * 0.1; // Slight twist
        } else if (progress < 0.4) {
            // Recoil/shoot effect
            const p = (progress - 0.2) / 0.2;
            const recoil = Math.sin(p * Math.PI) * 0.1;
            mesh.position.z = -recoil;
            mesh.rotation.x = this.CONFIDENT_ROTATION_X - recoil * 0.5;
        } else if (progress < 0.7) {
            // Hold pose - slight bobbing
            const bob = Math.sin((progress - 0.4) * Math.PI * 4) * 0.02;
            mesh.position.y = this.CONFIDENT_POSITION_Y + bob;
        } else {
            // Retract
            const p = (progress - 0.7) / 0.3;
            mesh.rotation.y = 0.1 * (1 - p);
            mesh.position.z = 0;
        }
    }
    
    /**
     * Hair flip animation - toss head back
     */
    private updateHairFlipAnimation(progress: number): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Smooth ease-out curve for head toss
        // Head toss back and return
        const tossAngle = Math.sin(progress * Math.PI) * 0.4;
        mesh.rotation.x = this.CONFIDENT_ROTATION_X - tossAngle;
        
        // Slight upward movement during toss
        const height = Math.sin(progress * Math.PI) * 0.1;
        mesh.position.y = this.CONFIDENT_POSITION_Y + height;
        
        // Animate hair element for extra effect
        if (this.hairElement) {
            // Hair lags behind then catches up
            const hairLag = Math.sin(progress * Math.PI * 0.8) * 0.3;
            this.hairElement.rotation.x = Math.PI / 4 - hairLag;
        }
    }
    
    /**
     * Apple Watch check animation - looking at wrist
     */
    private updateWatchCheckAnimation(progress: number): void {
        const mesh = this.getCurrentMesh();
        if (!mesh) return;
        
        // Phase 1: Raise arm/look at wrist (0-0.3)
        // Phase 2: Tap/check (0.3-0.6)
        // Phase 3: Look satisfied/annoyed (0.6-0.8)
        // Phase 4: Lower arm (0.8-1.0)
        
        if (progress < 0.3) {
            // Raise arm - rotate to show wrist
            const p = progress / 0.3;
            const easeP = 1 - Math.pow(1 - p, 2);
            
            // Rotate body to look at wrist
            mesh.rotation.z = easeP * 0.3; // Tilt toward wrist
            mesh.rotation.y = easeP * 0.5; // Turn to look
            mesh.rotation.x = this.CONFIDENT_ROTATION_X + easeP * 0.2;
            
        } else if (progress < 0.6) {
            // Tap/check motion
            const tapP = (progress - 0.3) / 0.3;
            const tap = Math.sin(tapP * Math.PI * 6) * 0.02;
            mesh.position.x = tap;
            
            // Subtle nod
            mesh.rotation.x = this.CONFIDENT_ROTATION_X + 0.2 + Math.sin(tapP * Math.PI * 2) * 0.05;
            
        } else if (progress < 0.8) {
            // Hold and look satisfied
            const p = (progress - 0.6) / 0.2;
            // Subtle "hmm" head movement
            mesh.rotation.x = this.CONFIDENT_ROTATION_X + 0.2 + Math.sin(p * Math.PI) * 0.03;
            
        } else {
            // Lower arm
            const p = (progress - 0.8) / 0.2;
            const easeP = 1 - Math.pow(1 - p, 2);
            
            mesh.rotation.z = 0.3 * (1 - easeP);
            mesh.rotation.y = 0.5 * (1 - easeP);
            mesh.rotation.x = this.CONFIDENT_ROTATION_X + 0.2 * (1 - easeP);
            mesh.position.x = 0;
        }
    }
    
    /**
     * End current animation and return to idle
     */
    private endAnimation(): void {
        this.isGestureAnimating = false;
        
        // Clean up gesture elements
        if (this.animationType === 'fingerguns') {
            this.removeGunHands();
        }
        
        // Hide wrist element
        if (this.wristElement) {
            this.wristElement.visible = false;
        }
        
        // Reset animation type
        this.animationType = 'idle';
        this.animationTime = 0;
        
        // Reset to confident idle pose
        this.applyConfidentIdlePose();
    }
    
    /**
     * Check if currently animating a gesture
     */
    isAnimatingGesture(): boolean {
        return this.isGestureAnimating;
    }
    
    /**
     * Get current animation type
     */
    getCurrentAnimation(): string {
        return this.animationType;
    }
    
    /**
     * Cleanup resources - extends parent dispose
     */
    dispose(): void {
        // Clean up Tech Bro specific resources
        this.removeGunHands();
        
        if (this.hairElement) {
            this.hairElement.geometry.dispose();
            (this.hairElement.material as Material).dispose();
        }
        
        if (this.wristElement) {
            this.wristElement.geometry.dispose();
            (this.wristElement.material as Material).dispose();
        }
        
        // Call parent dispose
        super.dispose();
    }
}
