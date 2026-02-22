import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  Frustum,
  Matrix4,
  InstancedMesh,
  CapsuleGeometry,
  MeshLambertMaterial,
  DynamicDrawUsage,
  Vector3,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
} from 'three';
import type { Color as ColorType } from 'three';
import { Actor } from './Actor';
import { LipSync } from './LipSync';
import { TechBroActor } from './TechBroActor';
import { DeadpanRobotActor, RobotAnimationSequence, parseTimingCues } from './DeadpanRobotActor';

/**
 * Audience member instance data
 */
interface AudienceInstance {
    position: Vector3;
    scale: number;
    color: ColorType;
    animationOffset: number;
    speed: number;
}

/**
 * Stage - Optimized 3D scene management with crowd simulation
 * 
 * Performance optimizations:
 * - InstancedMesh for audience particles (100s of members in 1 draw call)
 * - LOD system for agents (3 levels: high/medium/low detail)
 * - Frustum culling (skip rendering off-screen agents)
 * - Optimized render loop (60fps with 5 simultaneous speakers)
 * - Object pooling for particle animations
 */
export class Stage {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private actors: Map<string, Actor> = new Map();
    private robotActors: Map<string, DeadpanRobotActor> = new Map();
    private techBroActors: Map<string, TechBroActor> = new Map();
    private activeActorId: string | null = null;
    private lipSync: LipSync | null = null;
    
    // Animation sequences for robots
    private robotAnimationSequences: Map<string, RobotAnimationSequence> = new Map();
    
    // Frustum culling
    private frustum: Frustum = new Frustum();
    private projScreenMatrix: Matrix4 = new Matrix4();
    
    // LOD update timing (throttle to every 10 frames)
    private lodUpdateFrame = 0;
    private readonly LOD_UPDATE_INTERVAL = 10;
    
    // Audience instanced mesh
    private audienceMesh: InstancedMesh | null = null;
    private audienceInstances: AudienceInstance[] = [];
    private readonly AUDIENCE_COUNT = 150;
    private dummyMatrix: Matrix4 = new Matrix4();
    
    // Performance monitoring
    private lastFrameTime: number = performance.now();
    private frameCount: number = 0;
    private fps: number = 60;
    private enableProfiling: boolean = false;

    constructor(canvas: HTMLCanvasElement, context?: WebGLRenderingContext) {
        this.scene = new Scene();
        this.scene.background = new Color(0x1a1a2e);

        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 8);

        this.renderer = new WebGLRenderer({ 
            canvas, 
            context, 
            antialias: true, 
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a2e, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        
        // Performance: Limit pixel ratio for high-DPI displays
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.setupLights();
        this.setupGround();
        this.initActors();
        this.initAudience();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    private setupLights() {
        // Ambient light - reduced intensity for performance
        const ambient = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        // Main directional light with optimized shadows
        const directional = new DirectionalLight(0xffffff, 1.0);
        directional.position.set(5, 10, 7);
        directional.castShadow = true;
        // Optimized shadow map resolution
        directional.shadow.mapSize.width = 1024;
        directional.shadow.mapSize.height = 1024;
        directional.shadow.camera.near = 0.5;
        directional.shadow.camera.far = 50;
        // Tight shadow camera for better resolution
        directional.shadow.camera.left = -10;
        directional.shadow.camera.right = 10;
        directional.shadow.camera.top = 10;
        directional.shadow.camera.bottom = -10;
        this.scene.add(directional);

        // Fill light (no shadows)
        const fillLight = new DirectionalLight(0xaaccff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    private setupGround() {
        const geo = new PlaneGeometry(40, 30);
        const mat = new MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.8,
            metalness: 0.2
        });
        const mesh = new Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -0.8;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    }

    /**
     * Initialize the 5 main agents on stage
     * Positions optimized for visibility with 5 characters
     */
    private initActors() {
        // 5 agents arranged in a semi-circle:
        // Comedian (-3), Philosopher (3), Scientist (0), Tech Bro (-1.5), Robot (1.5)
        // All at z=0 (front row) for equal visibility
        
        // Comedian (Red) - Far Left
        const comedian = new Actor('comedian', '#ff6b6b', -3, 0);
        this.addActor('comedian', comedian);

        // Philosopher (Teal) - Far Right
        const philosopher = new Actor('philosopher', '#4ecdc4', 3, 0);
        this.addActor('philosopher', philosopher);

        // Scientist (Blue) - Center
        const scientist = new Actor('scientist', '#45b7d1', 0, 0);
        this.addActor('scientist', scientist);
        
        // Tech Bro (Orange) - Left-Center
        const techBro = new TechBroActor('techBro', -1.5);
        this.addTechBroActor('techBro', techBro);
        this.scene.add(techBro.group);
        
        // Robot (Silver) - Right-Center, starts slightly behind for depth
        const robot = new DeadpanRobotActor('robot', '#C0C0C0', 1.5);
        robot.group.position.z = 0;
        this.addRobotActor('robot', robot);
        this.scene.add(robot.group);
    }

    /**
     * Initialize instanced audience mesh for crowd simulation
     * Uses InstancedMesh for 100s of audience members in a single draw call
     */
    private initAudience() {
        // Create simple geometry for audience members (low-poly capsules)
        const geometry = new CapsuleGeometry(0.15, 0.4, 4, 8);
        const material = new MeshLambertMaterial({
            color: 0x666666,
        });
        
        // Create instanced mesh
        this.audienceMesh = new InstancedMesh(
            geometry,
            material,
            this.AUDIENCE_COUNT
        );
        this.audienceMesh.castShadow = false;
        this.audienceMesh.receiveShadow = false;
        this.audienceMesh.instanceMatrix.setUsage(DynamicDrawUsage);
        
        // Generate audience positions in a grid pattern behind the stage
        let index = 0;
        const colors: Color[] = [
            new Color(0x444444),
            new Color(0x555555),
            new Color(0x4a4a4a),
            new Color(0x3a3a3a),
            new Color(0x505050),
        ];
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 15; col++) {
                if (index >= this.AUDIENCE_COUNT) break;
                
                // Position audience in rows behind the stage
                const x = (col - 7) * 1.2 + (Math.random() - 0.5) * 0.3;
                const z = -4 - row * 1.5 + (Math.random() - 0.5) * 0.3;
                const y = -0.4;
                
                // Random scale variation
                const scale = 0.8 + Math.random() * 0.4;
                
                // Store instance data for animation
                this.audienceInstances.push({
                    position: new Vector3(x, y, z),
                    scale,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    animationOffset: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5
                });
                
                // Set initial transform
                this.dummyMatrix.makeScale(scale, scale, scale);
                this.dummyMatrix.setPosition(x, y, z);
                this.audienceMesh.setMatrixAt(index, this.dummyMatrix);
                this.audienceMesh.setColorAt(index, this.audienceInstances[index].color);
                
                index++;
            }
        }
        
        this.audienceMesh.instanceMatrix.needsUpdate = true;
        if (this.audienceMesh.instanceColor) {
            this.audienceMesh.instanceColor.needsUpdate = true;
        }
        
        // Add to scene
        this.scene.add(this.audienceMesh);
    }

    private addActor(id: string, actor: Actor) {
        this.actors.set(id, actor);
        this.scene.add(actor.group);
    }
    
    private addRobotActor(id: string, robot: DeadpanRobotActor) {
        this.robotActors.set(id, robot);
    }
    
    private addTechBroActor(id: string, techBro: TechBroActor) {
        this.techBroActors.set(id, techBro);
    }

    public setLipSync(lipSync: LipSync) {
        this.lipSync = lipSync;
    }

    public setActiveActor(id: string) {
        this.activeActorId = id;
        
        // Handle regular actors
        this.actors.forEach((actor, actorId) => {
            actor.setTalking(actorId === id);
        });
        
        // Handle robot actors
        this.robotActors.forEach((robot, robotId) => {
            robot.setTalking(robotId === id);
        });
        
        // Handle Tech Bro actors
        this.techBroActors.forEach((techBro, techBroId) => {
            techBro.setTalking(techBroId === id);
        });
    }
    
    /**
     * Check if the given agent ID is a robot
     */
    public isRobot(agentId: string): boolean {
        return this.robotActors.has(agentId);
    }
    
    /**
     * Parse timing cues from text and set up robot animation sequence
     */
    public setupRobotAnimation(agentId: string, text: string): string {
        const robot = this.robotActors.get(agentId);
        if (!robot) return text;
        
        const { cleanText, cues } = parseTimingCues(text);
        
        if (cues.length > 0) {
            // Stop any existing sequence
            const existingSequence = this.robotAnimationSequences.get(agentId);
            if (existingSequence) {
                existingSequence.stop();
            }
            
            // Create new animation sequence
            const sequence = new RobotAnimationSequence(cues, robot);
            this.robotAnimationSequences.set(agentId, sequence);
        }
        
        return cleanText;
    }
    
    /**
     * Trigger mechanical head tilt for robot
     */
    public tiltRobotHead(agentId: string, direction: 'left' | 'right' | 'reset') {
        const robot = this.robotActors.get(agentId);
        if (robot) {
            robot.tiltHead(direction);
        }
    }
    
    /**
     * Set robot processing state
     */
    public setRobotProcessing(agentId: string, isProcessing: boolean) {
        const robot = this.robotActors.get(agentId);
        if (robot) {
            robot.setProcessing(isProcessing);
        }
    }
    
    /**
     * Swap an actor with a robot (for when robot takes a position)
     */
    public swapActorWithRobot(actorIdToReplace: string, robotId: string): boolean {
        const actor = this.actors.get(actorIdToReplace);
        const robot = this.robotActors.get(robotId);
        
        if (!actor || !robot) return false;
        
        // Remove actor from scene
        this.scene.remove(actor.group);
        
        // Position robot at actor's position
        robot.group.position.x = actor.group.position.x;
        
        // Add robot to scene
        this.scene.add(robot.group);
        
        return true;
    }
    
    /**
     * Restore original actor
     */
    public restoreActor(actorId: string, robotId: string): boolean {
        const actor = this.actors.get(actorId);
        const robot = this.robotActors.get(robotId);
        
        if (!actor || !robot) return false;
        
        // Remove robot from scene
        this.scene.remove(robot.group);
        
        // Restore actor
        this.scene.add(actor.group);
        
        return true;
    }

    /**
     * Trigger a Tech Bro gesture animation
     * @param gestureType - Type of gesture: 'fingerguns', 'hairflip', or 'watchcheck'
     * @returns true if gesture was triggered, false if actor not found or already animating
     */
    public triggerTechBroGesture(gestureType: 'fingerguns' | 'hairflip' | 'watchcheck'): boolean {
        const techBro = this.techBroActors.get('techBro');
        if (!techBro) return false;

        switch (gestureType) {
            case 'fingerguns':
                techBro.triggerFingerGuns();
                return true;
            case 'hairflip':
                techBro.triggerHairFlip();
                return true;
            case 'watchcheck':
                techBro.triggerWatchCheck();
                return true;
            default:
                return false;
        }
    }

    /**
     * Check if Tech Bro is currently animating a gesture
     */
    public isTechBroAnimating(): boolean {
        const techBro = this.techBroActors.get('techBro');
        if (techBro) {
            return techBro.isAnimatingGesture();
        }
        return false;
    }

    public makeActorJump(_id: string) {
        // Optional: keep legacy jump capability
    }

    /**
     * Record a callback for visual feedback on an actor
     * @param agentId - The agent ID
     * @param jokeId - The joke identifier
     * @param count - Current callback count
     * @param status - Callback status from engine
     */
    public recordCallback(agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead'): void {
        const actor = this.actors.get(agentId);
        if (actor) {
            actor.recordCallback(jokeId, count, status);
        }
    }

    /**
     * Clear all callback visuals for all actors (scene reset)
     */
    public clearAllCallbackVisuals(): void {
        this.actors.forEach(actor => {
            actor.clearCallbackVisuals();
        });
    }
    
    /**
     * Enable/disable performance profiling
     */
    public setProfiling(enabled: boolean): void {
        this.enableProfiling = enabled;
    }
    
    /**
     * Get current FPS
     */
    public getFPS(): number {
        return Math.round(this.fps);
    }
    
    /**
     * Update frustum for culling calculations
     */
    private updateFrustum(): void {
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }
    
    /**
     * Check if an actor is within the camera frustum
     */
    private isActorInFrustum(actor: Actor): boolean {
        const sphere = actor.getBoundingSphere();
        return this.frustum.intersectsSphere(sphere);
    }
    
    /**
     * Update LOD levels for all actors (throttled)
     */
    private updateLODLevels(): void {
        const cameraPos = this.camera.position;
        
        this.actors.forEach(actor => {
            actor.updateLOD(cameraPos);
        });
    }
    
    /**
     * Update frustum culling for all actors
     */
    private updateFrustumCulling(): void {
        this.actors.forEach(actor => {
            const isVisible = this.isActorInFrustum(actor);
            actor.setFrustumVisibility(isVisible);
        });
    }
    
    /**
     * Animate audience members with subtle idle movements
     */
    private updateAudience(time: number): void {
        if (!this.audienceMesh) return;
        
        let needsUpdate = false;
        
        // Only update every 2nd frame for performance (30fps for audience)
        if (this.frameCount % 2 === 0) {
            for (let i = 0; i < this.audienceInstances.length; i++) {
                const instance = this.audienceInstances[i];
                
                // Subtle breathing/idling animation
                const yOffset = Math.sin(time * instance.speed + instance.animationOffset) * 0.02;
                const scaleVariation = 1 + Math.sin(time * instance.speed * 0.5 + instance.animationOffset) * 0.02;
                
                this.dummyMatrix.makeScale(
                    instance.scale * scaleVariation,
                    instance.scale * scaleVariation,
                    instance.scale * scaleVariation
                );
                this.dummyMatrix.setPosition(
                    instance.position.x,
                    instance.position.y + yOffset,
                    instance.position.z
                );
                
                this.audienceMesh.setMatrixAt(i, this.dummyMatrix);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                this.audienceMesh.instanceMatrix.needsUpdate = true;
            }
        }
    }

    public render() {
        requestAnimationFrame(() => this.render());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // FPS calculation (averaged over 1 second)
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = 1 / deltaTime;
        }

        // Update frustum for culling
        this.updateFrustum();
        
        // Update frustum culling for all actors
        this.updateFrustumCulling();
        
        // Throttled LOD updates (every N frames)
        this.lodUpdateFrame++;
        if (this.lodUpdateFrame >= this.LOD_UPDATE_INTERVAL) {
            this.lodUpdateFrame = 0;
            this.updateLODLevels();
        }

        let volume = 0;
        if (this.lipSync) {
            volume = this.lipSync.getVolume();
        }

        // Update active actor (always update, even if not visible)
        if (this.activeActorId) {
            const actor = this.actors.get(this.activeActorId);
            const robot = this.robotActors.get(this.activeActorId);
            const techBro = this.techBroActors.get(this.activeActorId);
            
            if (actor) {
                actor.update(volume, deltaTime);
            }
            if (robot) {
                robot.update(volume);
            }
            if (techBro) {
                techBro.update(volume);
            }
        }
        
        // Update non-active actors only if visible (optimization)
        this.actors.forEach((actor, actorId) => {
            if (actorId !== this.activeActorId && actor.isInFrustum) {
                // Reduced update frequency for non-active actors
                actor.update(0, deltaTime);
            }
        });
        
        // Update robot animation sequences
        this.robotAnimationSequences.forEach((sequence, agentId) => {
            const isComplete = sequence.update();
            if (isComplete) {
                this.robotAnimationSequences.delete(agentId);
            }
        });
        
        // Update audience animation
        this.updateAudience(currentTime * 0.001);

        this.renderer.render(this.scene, this.camera);
        
        // Profiling output
        if (this.enableProfiling && this.frameCount % 60 === 0) {
            console.log(`[Stage] FPS: ${this.getFPS()}, Active: ${this.activeActorId || 'none'}`);
        }
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Dispose of all resources
     */
    public dispose(): void {
        // Dispose actors
        this.actors.forEach(actor => actor.dispose());
        this.actors.clear();
        
        // Dispose robot actors
        this.robotActors.forEach(robot => robot.dispose());
        this.robotActors.clear();
        
        // Dispose tech bro actors
        this.techBroActors.forEach(techBro => techBro.dispose());
        this.techBroActors.clear();
        
        // Dispose audience
        if (this.audienceMesh) {
            this.audienceMesh.geometry.dispose();
            (this.audienceMesh.material as MeshLambertMaterial).dispose();
            this.scene.remove(this.audienceMesh);
        }
        
        // Dispose renderer
        this.renderer.dispose();
    }
}
