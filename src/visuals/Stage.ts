
import * as THREE from 'three';
import { Actor } from './Actor';
import { LipSync } from './LipSync';

export class Stage {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private actors: Map<string, Actor> = new Map();
    private activeActorId: string | null = null;
    private lipSync: LipSync | null = null;
    private crowd: THREE.Group | null = null;
    private crowdMembers: { mesh: THREE.Mesh, basePos: THREE.Vector3, phase: number, speed: number }[] = [];
    private audienceReactionState: 'neutral' | 'cheer' | 'groan' = 'neutral';
    private crowdLight: THREE.PointLight | null = null;

    constructor(canvas: HTMLCanvasElement, context?: WebGLRenderingContext) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e); // Dark blueish

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.setupLights();
        this.setupGround();
        this.initActors();
        this.setupAudience();

        window.addEventListener('resize', () => this.onWindowResize());
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
        // Hardcoded actors for now matching the prompt requirements
        // "Robot", "Poet" at x=-2 and x=2.
        // But our agents are Comedian, Philosopher, Scientist.
        // I will map them: Comedian -> Left, Philosopher -> Right, Scientist -> Center?
        // Prompt said: Initialize 2 Actors ("Robot", "Poet") at positions x=-2 and x=2.
        // I should probably stick to the prompt's structural request but use the actual agent IDs if I can, or map them.
        // Let's create actors for 'comedian' and 'philosopher' as per existing main.ts agents.
        // Wait, main.ts HAS 3 agents.
        // I will create 3 actors arranged on stage.

        // Comedian (Red)
        const comedian = new Actor('comedian', '#ff6b6b', -2);
        this.addActor('comedian', comedian);

        // Philosopher (Teal)
        const philosopher = new Actor('philosopher', '#4ecdc4', 2);
        this.addActor('philosopher', philosopher);

        // Scientist (Blue) - Center
        const scientist = new Actor('scientist', '#45b7d1', 0);
        this.addActor('scientist', scientist);
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
        });
    }

    public makeActorJump(_id: string) {
        // Optional: keep legacy jump capability if needed, or implement via Actor
        // For now, ignoring or basic impl
    }

    public render() {
        requestAnimationFrame(() => this.render());

        let volume = 0;
        if (this.lipSync) {
            volume = this.lipSync.getVolume();
        }

        // Update active actor
        if (this.activeActorId) {
            const actor = this.actors.get(this.activeActorId);
            actor?.update(volume);
        }

        // Idle animation for others?

        // Update audience
        const time = Date.now() * 0.001;
        const bounceHeight = this.audienceReactionState === 'cheer' ? 0.5 : (this.audienceReactionState === 'groan' ? 0.05 : 0.1);
        const speedMult = this.audienceReactionState === 'cheer' ? 3 : (this.audienceReactionState === 'groan' ? 0.5 : 1);

        this.crowdMembers.forEach(member => {
            // Bob up and down
            const yOffset = Math.sin(time * member.speed * speedMult + member.phase) * bounceHeight;
            member.mesh.position.y = member.basePos.y + Math.abs(yOffset);
        });


        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
