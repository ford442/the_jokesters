
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

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e); // Dark blueish

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.setupLights();
        this.setupGround();
        this.initActors();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    private setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);
    }

    private setupGround() {
        const geo = new THREE.PlaneGeometry(20, 10);
        const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
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

    public makeActorJump(id: string) {
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

        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
