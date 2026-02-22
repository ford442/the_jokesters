import {
  Group,
  Mesh,
  Sphere,
  Vector3,
  CapsuleGeometry,
  BoxGeometry,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshBasicMaterial,
  SpotLight,
  MeshStandardMaterial,
  BufferGeometry,
  Material,
} from 'three';
import { CallbackVisualizer, type CallbackVisualState } from './CallbackVisualizer';

/**
 * LOD Level configuration
 */
interface LODLevel {
    distance: number;
    geometry: BufferGeometry;
    material: Material;
}

/**
 * Actor - 3D Avatar Representation with LOD support
 * 
 * Visibility guarantees:
 * - Capsule centered at specified X position, at ground level (y=0)
 * - Bright MeshPhongMaterial that responds to scene lighting
 * - Face indicator for direction
 * - Spotlight for highlighting when talking
 * 
 * Performance features:
 * - LOD system with 3 levels (high, medium, low) based on distance
 * - Frustum culling support via visibility tracking
 * - Geometry pooling for reduced memory allocation
 */
export class Actor {
    public group: Group;
    protected mesh: Mesh;
    private spotlight: SpotLight;
    private faceIndicator: Mesh;
    
    // LOD system
    private lodLevels: LODLevel[] = [];
    private currentLOD = -1;
    private highGeometry: CapsuleGeometry;
    private mediumGeometry: CapsuleGeometry;
    private lowGeometry: BoxGeometry;
    
    // Materials for different LOD levels
    private highMaterial: MeshPhongMaterial;
    private mediumMaterial: MeshLambertMaterial;
    private lowMaterial: MeshBasicMaterial;
    
    // Frustum culling
    public isInFrustum = true;
    private boundingSphere: Sphere;
    
    // Animation
    private baseY: number;
    private id: string;
    
    // Callback visual feedback
    private callbackVisualizer: CallbackVisualizer;

    /**
     * Creates a 3D avatar capsule with LOD support
     * @param _id - Unique actor identifier
     * @param color - Hex color string for the capsule
     * @param x - X position on stage (y and z are always 0 for ground placement)
     */
    constructor(_id: string, color: string, x: number, z: number = 0) {
        this.id = _id;
        this.group = new Group();
        // Position group at specified X, ground level (y=0), Z position
        this.group.position.set(x, 0, z);

        // Pre-create geometries for LOD (shared across instances)
        // High detail: 8 segments, 16 rings
        this.highGeometry = new CapsuleGeometry(0.3, 1, 8, 16);
        // Medium detail: 4 segments, 8 rings  
        this.mediumGeometry = new CapsuleGeometry(0.3, 1, 4, 8);
        // Low detail: simple box
        this.lowGeometry = new BoxGeometry(0.6, 1.6, 0.6);

        // Materials for each LOD level
        this.highMaterial = new MeshPhongMaterial({ 
            color: color,
            shininess: 30
        });
        
        this.mediumMaterial = new MeshLambertMaterial({ 
            color: color
        });
        
        this.lowMaterial = new MeshBasicMaterial({ 
            color: color
        });

        // Setup LOD levels
        this.lodLevels = [
            { distance: 0, geometry: this.highGeometry, material: this.highMaterial },
            { distance: 8, geometry: this.mediumGeometry, material: this.mediumMaterial },
            { distance: 15, geometry: this.lowGeometry, material: this.lowMaterial }
        ];

        // Create initial mesh with high detail
        this.mesh = new Mesh(this.highGeometry, this.highMaterial);
        this.baseY = 0;
        this.mesh.position.y = this.baseY;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // Create bounding sphere for frustum culling
        this.boundingSphere = new Sphere();
        this.updateBoundingSphere();

        // Face / Direction Indicator (only visible at high LOD)
        const faceGeo = new BoxGeometry(0.2, 0.2, 0.1);
        const faceMat = new MeshStandardMaterial({ color: 0xffffff });
        this.faceIndicator = new Mesh(faceGeo, faceMat);
        this.faceIndicator.position.set(0, 0.2, 0.28);
        this.mesh.add(this.faceIndicator);

        // Spotlight for highlighting when actor is talking
        this.spotlight = new SpotLight(0xffffff, 0);
        this.spotlight.position.set(0, 5, 2);
        this.spotlight.target = this.mesh;
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.castShadow = true;
        // Optimize shadow map for performance
        this.spotlight.shadow.mapSize.width = 512;
        this.spotlight.shadow.mapSize.height = 512;
        this.spotlight.shadow.camera.near = 0.5;
        this.spotlight.shadow.camera.far = 10;
        this.group.add(this.spotlight);

        // Initialize callback visualizer for running gag feedback
        this.callbackVisualizer = new CallbackVisualizer(this.group, this.mesh);
    }

    /**
     * Record a callback for visual feedback
     * @param jokeId - The joke identifier
     * @param count - Current callback count
     * @param status - Callback status from engine
     */
    recordCallback(jokeId: string, count: number, status: CallbackVisualState['status']): void {
        this.callbackVisualizer.recordCallback(jokeId, count, status);
    }

    /**
     * Clear all callback visuals (scene reset)
     */
    clearCallbackVisuals(): void {
        this.callbackVisualizer.clear();
    }

    /**
     * Update bounding sphere for frustum culling
     */
    private updateBoundingSphere(): void {
        // Get world position
        const worldPos = new Vector3();
        this.mesh.getWorldPosition(worldPos);
        // Bounding sphere radius covers the capsule
        this.boundingSphere.set(worldPos, 1.0);
    }

    /**
     * Get bounding sphere for frustum culling
     */
    public getBoundingSphere(): Sphere {
        this.updateBoundingSphere();
        return this.boundingSphere;
    }

    /**
     * Update LOD level based on distance to camera
     * @param cameraPosition - Current camera position
     * @returns true if LOD changed
     */
    public updateLOD(cameraPosition: Vector3): boolean {
        const distance = this.group.position.distanceTo(cameraPosition);
        
        // Find appropriate LOD level
        let targetLOD = this.lodLevels.length - 1;
        for (let i = 0; i < this.lodLevels.length; i++) {
            if (distance < this.lodLevels[i].distance || i === 0) {
                targetLOD = i;
                break;
            }
        }
        
        // Only update if LOD changed
        if (targetLOD !== this.currentLOD) {
            this.currentLOD = targetLOD;
            const level = this.lodLevels[targetLOD];
            
            // Preserve transform
            const position = this.mesh.position.clone();
            const rotation = this.mesh.rotation.clone();
            const scale = this.mesh.scale.clone();
            
            // Remove old mesh
            this.group.remove(this.mesh);
            
            // Create new mesh with LOD geometry/material
            this.mesh = new Mesh(level.geometry, level.material);
            this.mesh.position.copy(position);
            this.mesh.rotation.copy(rotation);
            this.mesh.scale.copy(scale);
            this.mesh.castShadow = targetLOD < 2; // No shadows for lowest LOD
            this.mesh.receiveShadow = targetLOD < 2;
            
            // Add face indicator only for high LOD
            if (targetLOD === 0 && this.faceIndicator) {
                this.mesh.add(this.faceIndicator);
                this.faceIndicator.visible = true;
            } else if (this.faceIndicator) {
                this.faceIndicator.visible = false;
            }
            
            this.group.add(this.mesh);
            this.spotlight.target = this.mesh;
            
            return true;
        }
        
        return false;
    }

    /**
     * Sets the talking state - enables spotlight when true
     */
    setTalking(isTalking: boolean) {
        // Use intensity transition for smoother effect
        const targetIntensity = isTalking ? 50 : 0;
        this.spotlight.intensity = targetIntensity;
    }

    /**
     * Updates the actor based on audio volume
     * Scales the capsule to simulate speech animation
     * Only updates if in frustum for performance
     * Also updates callback visualizer animations
     */
    update(volume: number, deltaTime: number = 0.016) {
        // Skip expensive animation if not visible
        if (!this.isInFrustum) return;
        
        // Don't override awkward silence animation
        if (!this.isInAwkwardSilence()) {
            // Simple squash and stretch based on audio volume
            const scale = 1 + volume * 0.5;
            this.mesh.scale.set(1 / Math.sqrt(scale), scale, 1 / Math.sqrt(scale));
            
            // Adjust Y position to scale from bottom, not center
            this.mesh.position.y = 0.8 * (scale - 1);
        }
        
        // Update callback visualizer
        this.callbackVisualizer.update(deltaTime);
    }

    /**
     * Check if actor is currently in awkward silence animation
     */
    private isInAwkwardSilence(): boolean {
        // The callback visualizer manages this state internally
        // We check mesh rotation as a proxy for awkward silence state
        return Math.abs(this.mesh.rotation.z) > 0.01;
    }

    /**
     * Get actor ID
     */
    getId(): string {
        return this.id;
    }

    /**
     * Sets frustum visibility state
     */
    setFrustumVisibility(visible: boolean) {
        if (this.isInFrustum !== visible) {
            this.isInFrustum = visible;
            this.mesh.visible = visible;
            // Also hide spotlight when not in frustum
            this.spotlight.visible = visible;
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.highGeometry.dispose();
        this.mediumGeometry.dispose();
        this.lowGeometry.dispose();
        this.highMaterial.dispose();
        this.mediumMaterial.dispose();
        this.lowMaterial.dispose();
    }
}
