
import * as THREE from 'three';
import {
  detectReactionFromText,
  getAnimProfile,
  reactionDuration,
  sampleIdlePose,
  sampleReactionPose,
  sampleThinkPose,
  type IdlePersonality,
  type PoseSample,
  type ReactionClip,
} from './actorAnimations';

export class Actor {
    public group: THREE.Group;
    protected mesh: THREE.Mesh;
    private spotlight: THREE.SpotLight;
    protected leftEye!: THREE.Mesh;
    protected rightEye!: THREE.Mesh;
    protected mouth!: THREE.Line;
    private eyeGlow: THREE.PointLight;
    private blinkTimer: number = 0;
    private isBlinking: boolean = false;

    private readonly agentId: string;
    private readonly baseX: number;
    private idle: IdlePersonality;
    private signatureReactions: readonly ReactionClip[];

    /** High-level performance state */
    private thinking = false;
    private talking = false;
    private reactionClip: ReactionClip | null = null;
    private reactionElapsed = 0;
    private reactionDur = 0;

    private readonly baseMeshY = 0.8;
    private lastTimeSec = performance.now() * 0.001;

    constructor(id: string, color: string, x: number) {
        this.agentId = id;
        this.baseX = x;
        const profile = getAnimProfile(id);
        this.idle = profile.idle;
        this.signatureReactions = profile.reactions;

        this.group = new THREE.Group();
        this.group.position.set(x, 0, 0);

        // Capsule Body - Enhanced with better material
        const geometry = new (THREE as any).CapsuleGeometry(0.3, 1, 8, 16);
        const material = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.3,
            roughness: 0.6,
            emissive: color,
            emissiveIntensity: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = this.baseMeshY;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        this.createFace();
        this.addAccessories(color);

        this.spotlight = new THREE.SpotLight(0xffffff, 0);
        this.spotlight.position.set(0, 5, 2);
        this.spotlight.target = this.mesh;
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.castShadow = true;
        this.group.add(this.spotlight);

        this.eyeGlow = new THREE.PointLight(0xffffff, 0, 2);
        this.eyeGlow.position.set(0, 0.6, 0.3);
        this.mesh.add(this.eyeGlow);
    }

    getAgentId(): string {
        return this.agentId;
    }

    getSignatureReactions(): readonly ReactionClip[] {
        return this.signatureReactions;
    }

    private createFace() {
        const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });

        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(-0.1, 0.6, 0.28);
        this.mesh.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.1, 0.6, 0.28);
        this.mesh.add(this.rightEye);

        const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 0.05);
        this.leftEye.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 0.05);
        this.rightEye.add(rightPupil);

        const mouthCurve = new THREE.EllipseCurve(
            0, 0,
            0.12, 0.06,
            0, Math.PI,
            false,
            0
        );
        const points = mouthCurve.getPoints(20);
        const mouthGeo = new THREE.BufferGeometry().setFromPoints(points);
        const mouthMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Line(mouthGeo, mouthMat);
        this.mouth.position.set(0, 0.4, 0.28);
        this.mouth.rotation.x = Math.PI / 2;
        this.mesh.add(this.mouth);
    }

    private addAccessories(color: string) {
        const ringGeo = new THREE.TorusGeometry(0.32, 0.02, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0;
        this.mesh.add(ring);

        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.7,
            roughness: 0.3
        });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = 0.95;
        this.mesh.add(antenna);

        const ballGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const ballMat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.5,
            roughness: 0.4,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.position.y = 1.1;
        this.mesh.add(ball);
    }

    setTalking(isTalking: boolean) {
        this.talking = isTalking;
        this.spotlight.intensity = isTalking ? 50 : 0;
        this.eyeGlow.intensity = isTalking ? 2 : 0;

        if (isTalking) {
            (this.leftEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
            (this.rightEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
            // Clear thinking when they start speaking
            this.thinking = false;
        } else {
            (this.leftEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
            (this.rightEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
    }

    /**
     * "Thinking" pose while the LLM generates for this agent.
     */
    setThinking(isThinking: boolean): void {
        this.thinking = isThinking;
        if (isThinking) {
            this.reactionClip = null;
            // Dim spotlight hint without full talking state
            if (!this.talking) {
                this.spotlight.intensity = 12;
                this.eyeGlow.intensity = 0.6;
            }
        } else if (!this.talking) {
            this.spotlight.intensity = 0;
            this.eyeGlow.intensity = 0;
        }
    }

    isThinking(): boolean {
        return this.thinking;
    }

    /**
     * Play a one-shot reaction clip (laugh, facepalm, etc.).
     */
    playReaction(clip: ReactionClip, durationSec?: number): void {
        this.reactionClip = clip;
        this.reactionElapsed = 0;
        this.reactionDur = durationSec ?? reactionDuration(clip);
        // Thinking yields to reaction
        if (clip !== 'think') {
            this.thinking = false;
        }
    }

    /**
     * Map utterance text (and optional [tags]) to a reaction and play it.
     * @returns the clip played, or null
     */
    reactToText(text: string): ReactionClip | null {
        const clip = detectReactionFromText(text, this.signatureReactions);
        if (clip) {
            this.playReaction(clip);
            return clip;
        }
        return null;
    }

    /**
     * Per-frame update. Cheap procedural math only.
     * @param volume - lip-sync volume for active speaker (0 for idle actors)
     * @param timeSec - optional shared clock; defaults to performance.now
     */
    update(volume: number, timeSec?: number) {
        const now = timeSec ?? performance.now() * 0.001;
        const dt = Math.min(0.05, Math.max(0, now - this.lastTimeSec));
        this.lastTimeSec = now;

        // Advance one-shot reaction
        if (this.reactionClip) {
            this.reactionElapsed += dt;
            if (this.reactionElapsed >= this.reactionDur) {
                this.reactionClip = null;
                this.reactionElapsed = 0;
            }
        }

        let pose: PoseSample;
        if (this.reactionClip) {
            const progress = this.reactionDur > 0 ? this.reactionElapsed / this.reactionDur : 1;
            pose = sampleReactionPose(this.reactionClip, progress);
        } else if (this.thinking && volume < 0.05) {
            pose = sampleThinkPose(now, this.idle.phase);
        } else {
            pose = sampleIdlePose(this.idle, now);
        }

        // Volume squash/stretch layered on top (talking)
        const volScale = 1 + volume * 0.5;
        const scaleY = pose.meshScaleY * volScale;
        const scaleXZ = pose.meshScaleXZ / Math.sqrt(Math.max(0.5, volScale));

        this.group.position.x = this.baseX;
        this.group.position.y = pose.groupY;
        this.group.rotation.y = pose.groupRotY;
        this.group.rotation.z = pose.groupRotZ;

        this.mesh.scale.set(scaleXZ, scaleY, scaleXZ);
        this.mesh.position.y = this.baseMeshY * scaleY;
        this.mesh.rotation.x = pose.meshRotX;
        this.mesh.rotation.z = pose.meshRotZ;

        if (this.mouth) {
            const mouthScale = 1 + volume * 0.3 + pose.mouthOpen * 0.5;
            this.mouth.scale.set(mouthScale, mouthScale, 1);
        }

        // Eyes: blink vs pose squint
        this.updateEyes(volume, pose.eyeScaleY, dt);

        this.onExtraUpdate?.(volume, now, dt);
    }

    /** Optional hook for subclasses (TechBro props, etc.) */
    protected onExtraUpdate?(_volume: number, _timeSec: number, _dt: number): void;

    private updateEyes(volume: number, poseEyeY: number, _dt: number) {
        if (this.isBlinking) {
            this.blinkTimer++;
            if (this.blinkTimer > 6) {
                this.leftEye.scale.y = poseEyeY;
                this.rightEye.scale.y = poseEyeY;
                this.isBlinking = false;
                this.blinkTimer = 0;
            } else {
                this.leftEye.scale.y = 0.1;
                this.rightEye.scale.y = 0.1;
            }
        } else if (volume < 0.1 && !this.thinking && !this.reactionClip) {
            this.blinkTimer++;
            // ~every 4s at 60fps, desynced by phase
            const threshold = 200 + Math.floor(this.idle.phase * 40);
            if (this.blinkTimer > threshold) {
                this.startBlink();
            } else {
                this.leftEye.scale.y = poseEyeY;
                this.rightEye.scale.y = poseEyeY;
            }
        } else {
            this.blinkTimer = 0;
            this.leftEye.scale.y = poseEyeY;
            this.rightEye.scale.y = poseEyeY;
        }
    }

    private startBlink() {
        if (this.isBlinking) return;
        this.isBlinking = true;
        this.blinkTimer = 0;
        this.leftEye.scale.y = 0.1;
        this.rightEye.scale.y = 0.1;
    }
}
