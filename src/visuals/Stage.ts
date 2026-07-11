
import * as THREE from 'three';
import { Actor } from './Actor';
import { TechBroActor } from './TechBroActor';
import { LipSync } from './LipSync';
import type { RendererMode } from './rendererMode';
import type { ReactionClip } from './actorAnimations';

/**
 * Minimal renderer surface shared by THREE.WebGLRenderer and the WebGPURenderer
 * from three/webgpu. Both expose these members; render() is sync on WebGL and a
 * Promise on WebGPU, which the render loop handles.
 */
interface SceneRenderer {
    shadowMap: { enabled: boolean };
    setSize(width: number, height: number): void;
    render(scene: THREE.Scene, camera: THREE.Camera): void | Promise<void>;
    renderAsync?(scene: THREE.Scene, camera: THREE.Camera): Promise<void>;
}

/** Options for constructing a Stage. */
export interface StageOptions {
    /**
     * Pre-acquired WebGL2 context (WebGL mode only). Omit for WebGPU mode — a
     * canvas can bind only one context type, so WebGPU must acquire its own.
     */
    context?: WebGLRenderingContext;
    /** Requested renderer for the 3D scene. Defaults to 'webgl'. */
    rendererMode?: RendererMode;
}

export class Stage {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private canvas: HTMLCanvasElement;
    private glContext?: WebGLRenderingContext;
    private requestedMode: RendererMode;
    /** The renderer actually in use once initRenderer() resolves. */
    private activeMode: RendererMode = 'webgl';
    private renderer: SceneRenderer | null = null;
    private renderingAsync = false; // guards against overlapping WebGPU frames
    private actors: Map<string, Actor> = new Map();
    private activeActorId: string | null = null;
    private lipSync: LipSync | null = null;
    private crowd: THREE.Group | null = null;
    private crowdMembers: { mesh: THREE.Mesh, basePos: THREE.Vector3, phase: number, speed: number }[] = [];
    private audienceReactionState: 'neutral' | 'cheer' | 'groan' = 'neutral';
    private crowdLight: THREE.PointLight | null = null;

    constructor(canvas: HTMLCanvasElement, options: StageOptions = {}) {
        this.canvas = canvas;
        this.glContext = options.context;
        this.requestedMode = options.rendererMode ?? 'webgl';

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e); // Dark blueish

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        // Scene graph does not depend on the renderer, so it is built eagerly.
        // The renderer is created in initRenderer() because WebGPU needs async init.
        this.setupLights();
        this.setupGround();
        this.initActors();
        this.setupAudience();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Create the 3D renderer. Must be called (and awaited) before render().
     *
     * WebGPU rendering is opt-in and falls back to WebGL2 if it is unavailable
     * or fails to initialize. This only affects how the scene is drawn — LLM
     * inference always runs on WebGPU independently.
     *
     * @returns the renderer mode actually in use.
     */
    public async initRenderer(): Promise<RendererMode> {
        if (this.requestedMode === 'webgpu') {
            try {
                const { WebGPURenderer } = await import('three/webgpu');
                const renderer = new WebGPURenderer({
                    canvas: this.canvas,
                    antialias: true,
                    alpha: true,
                });
                await renderer.init();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                this.renderer = renderer;
                this.activeMode = 'webgpu';
                console.log('[Stage] Renderer: WebGPU (opt-in). Note: shares the GPU with LLM inference.');
                return this.activeMode;
            } catch (err) {
                console.warn(
                    '[Stage] WebGPU renderer init failed — falling back to WebGL2:',
                    (err as Error)?.message ?? err,
                );
                // Fall through to WebGL. The canvas has no usable context yet, so
                // let three acquire its own WebGL2 context (do not reuse glContext,
                // which may be undefined in the WebGPU path).
                this.glContext = undefined;
            }
        }

        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            context: this.glContext,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        this.renderer = renderer;
        this.activeMode = 'webgl';
        console.log('[Stage] Renderer: WebGL2 (default).');
        return this.activeMode;
    }

    /** The renderer mode actually in use (valid after initRenderer resolves). */
    public getActiveRendererMode(): RendererMode {
        return this.activeMode;
    }

    private setupLights() {
        // Ambient light for base illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // Stage lights - Three colored lights from above for TV show feel
        const leftStageLight = new THREE.DirectionalLight(0xff6b6b, 0.5);
        leftStageLight.position.set(-5, 8, 3);
        leftStageLight.castShadow = true;
        this.scene.add(leftStageLight);

        const centerStageLight = new THREE.DirectionalLight(0x45b7d1, 0.5);
        centerStageLight.position.set(0, 8, 3);
        centerStageLight.castShadow = true;
        this.scene.add(centerStageLight);

        const rightStageLight = new THREE.DirectionalLight(0x4ecdc4, 0.5);
        rightStageLight.position.set(5, 8, 3);
        rightStageLight.castShadow = true;
        this.scene.add(rightStageLight);

        // Rim light from behind for depth
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);

        // Configure shadow quality
        [leftStageLight, centerStageLight, rightStageLight].forEach(light => {
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 50;
        });
    }

    private setupGround() {
        // Main stage floor with grid pattern
        const geo = new THREE.PlaneGeometry(20, 10);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a3e,
            roughness: 0.7,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Add a grid overlay for stage lines
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
        gridHelper.position.y = 0.01; // Slightly above floor to prevent z-fighting
        this.scene.add(gridHelper);

        // Add backdrop/curtain
        const backdropGeo = new THREE.PlaneGeometry(20, 8);
        const backdropMat = new THREE.MeshStandardMaterial({ 
            color: 0x16213e,
            roughness: 0.9,
            metalness: 0.1
        });
        const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
        backdrop.position.set(0, 4, -3);
        backdrop.receiveShadow = true;
        this.scene.add(backdrop);

        // Add stage edge strips (like a comedy club stage)
        const stripGeo = new THREE.BoxGeometry(20, 0.1, 0.3);
        const stripMat = new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.3,
            emissive: 0xffd700,
            emissiveIntensity: 0.2
        });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, 0.05, 4);
        this.scene.add(strip);
    }

    private initActors() {
        // Five agents across the stage — each gets a distinct idle + reaction profile
        // via actorAnimations.ts (comedian bounce, philosopher slow nod, etc.).
        this.addActor('comedian', new Actor('comedian', '#ff6b6b', -3.2));
        this.addActor('philosopher', new Actor('philosopher', '#4ecdc4', -1.6));
        this.addActor('scientist', new Actor('scientist', '#45b7d1', 0));
        this.addActor('techBro', new TechBroActor('techBro', 1.6));
        this.addActor('robot', new Actor('robot', '#C0C0C0', 3.2));
    }


    private setupAudience() {
        this.crowd = new THREE.Group();
        this.scene.add(this.crowd);

        // A light that shines on the crowd
        this.crowdLight = new THREE.PointLight(0x5555ff, 0.2, 20);
        this.crowdLight.position.set(0, 5, 8);
        this.scene.add(this.crowdLight);

        const crowdColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffd700, 0x8e44ad, 0x2ecc71];
        const numMembers = 40;

        for (let i = 0; i < numMembers; i++) {
            // Randomize position in the "stands" in the foreground
            const x = (Math.random() - 0.5) * 18;
            const z = 6 + Math.random() * 4;
            const y = (z - 6) * 0.5 + 0.5; // Slight stadium seating rise

            const geo = new THREE.SphereGeometry(0.3, 8, 8);
            const mat = new THREE.MeshStandardMaterial({
                color: crowdColors[Math.floor(Math.random() * crowdColors.length)],
                roughness: 0.8
            });
            const mesh = new THREE.Mesh(geo, mat);

            const basePos = new THREE.Vector3(x, y, z);
            mesh.position.copy(basePos);

            this.crowd.add(mesh);
            this.crowdMembers.push({
                mesh,
                basePos,
                phase: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2
            });
        }
    }

    public triggerAudienceReaction(reaction: 'cheer' | 'groan' | 'neutral') {
        this.audienceReactionState = reaction;
        if (this.crowdLight) {
            if (reaction === 'cheer') {
                this.crowdLight.color = new THREE.Color(0xffd700);
                this.crowdLight.intensity = 1.0;
            } else if (reaction === 'groan') {
                this.crowdLight.color = new THREE.Color(0xff0000);
                this.crowdLight.intensity = 0.5;
            } else {
                this.crowdLight.color = new THREE.Color(0x5555ff);
                this.crowdLight.intensity = 0.2;
            }
        }

        // Reset back to neutral after a few seconds
        if (reaction !== 'neutral') {
            setTimeout(() => {
                this.triggerAudienceReaction('neutral');
            }, 3000);
        }
    }

    private addActor(id: string, actor: Actor) {
        this.actors.set(id, actor);
        this.scene.add(actor.group);
    }

    public setLipSync(lipSync: LipSync) {
        this.lipSync = lipSync;
    }

    public setActiveActor(id: string) {
        this.activeActorId = id;
        this.actors.forEach((actor, actorId) => {
            actor.setTalking(actorId === id);
            // Clear thinking on everyone else when spotlight moves
            if (actorId !== id) actor.setThinking(false);
        });
    }

    /** Thinking pose while LLM generates for this agent. */
    public setThinking(id: string, isThinking: boolean): void {
        const actor = this.actors.get(id);
        actor?.setThinking(isThinking);
        if (isThinking) {
            // Soft focus: not full talking, but mark as active for volume path
            this.activeActorId = id;
            this.actors.forEach((a, agentId) => {
                if (agentId !== id) {
                    a.setTalking(false);
                    a.setThinking(false);
                }
            });
        }
    }

    /** Play a named reaction clip on an agent. */
    public playReaction(id: string, clip: ReactionClip, durationSec?: number): void {
        this.actors.get(id)?.playReaction(clip, durationSec);
    }

    /**
     * Map spoken/generated text to a reaction (keywords + [director tags]).
     * @returns clip name or null
     */
    public reactToText(id: string, text: string): ReactionClip | null {
        return this.actors.get(id)?.reactToText(text) ?? null;
    }

    public makeActorJump(id: string) {
        this.actors.get(id)?.playReaction('bounce');
    }

    public render() {
        requestAnimationFrame(() => this.render());

        // Renderer may still be initializing (WebGPU init is async).
        if (!this.renderer) return;

        let volume = 0;
        if (this.lipSync) {
            volume = this.lipSync.getVolume();
        }

        // Update every actor every frame (cheap procedural idle/think/react).
        // Only the active speaker gets audio volume for lip-sync squash.
        const timeSec = performance.now() * 0.001;
        this.actors.forEach((actor, actorId) => {
            const v = actorId === this.activeActorId ? volume : 0;
            actor.update(v, timeSec);
        });

        // Update audience
        const time = Date.now() * 0.001;
        const bounceHeight = this.audienceReactionState === 'cheer' ? 0.5 : (this.audienceReactionState === 'groan' ? 0.05 : 0.1);
        const speedMult = this.audienceReactionState === 'cheer' ? 3 : (this.audienceReactionState === 'groan' ? 0.5 : 1);

        this.crowdMembers.forEach(member => {
            // Bob up and down
            const yOffset = Math.sin(time * member.speed * speedMult + member.phase) * bounceHeight;
            member.mesh.position.y = member.basePos.y + Math.abs(yOffset);
        });


        if (this.activeMode === 'webgpu') {
            // WebGPU render is async; skip the frame if the previous one is still
            // in flight so we never overlap GPU submissions.
            if (!this.renderingAsync) {
                this.renderingAsync = true;
                const draw = this.renderer.renderAsync
                    ? this.renderer.renderAsync(this.scene, this.camera)
                    : Promise.resolve(this.renderer.render(this.scene, this.camera));
                draw.catch((err: unknown) => {
                    console.warn('[Stage] WebGPU frame render failed:', (err as Error)?.message ?? err);
                }).finally(() => {
                    this.renderingAsync = false;
                });
            }
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer?.setSize(window.innerWidth, window.innerHeight);
    }
}
