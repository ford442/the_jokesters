
import * as THREE from 'three';

export class Actor {
    public group: THREE.Group;
    private mesh: THREE.Mesh;
    private spotlight: THREE.SpotLight;
    private leftEye!: THREE.Mesh;
    private rightEye!: THREE.Mesh;
    private mouth!: THREE.Line;
    private eyeGlow: THREE.PointLight;
    private blinkTimer: number = 0;
    private isBlinking: boolean = false;
    // private originalY: number;

    constructor(_id: string, color: string, x: number) {
        this.group = new THREE.Group();
        this.group.position.set(x, 0, 0); // Base position
        // this.originalY = 1;
        // Geometry is height 1 in SceneManager, let's match that roughly or standard size.
        // SceneManager had cylinder height 1, radius 0.3. TargetY was position.y (1).
        // Let's make it sit on ground. 

        // Capsule Body - Enhanced with better material
        const geometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color,
            metalness: 0.3,
            roughness: 0.6,
            emissive: color,
            emissiveIntensity: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.8; // Radius 0.3 + Half Length 0.5 = 0.8? CapsuleGeometry params are radius, length. 
        // Total height = length + 2*radius = 1 + 0.6 = 1.6. Center is at 0. So bottom is -0.8.
        // To stand on 0, y should be 0.8.
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // Create head area with face features
        this.createFace();

        // Add accessories/decorations
        this.addAccessories(color);

        // Spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, 0); // Start dim
        this.spotlight.position.set(0, 5, 2);
        this.spotlight.target = this.mesh;
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.castShadow = true;
        this.group.add(this.spotlight);

        // Eye glow light for when speaking
        this.eyeGlow = new THREE.PointLight(0xffffff, 0, 2);
        this.eyeGlow.position.set(0, 0.6, 0.3);
        this.mesh.add(this.eyeGlow);
    }

    private createFace() {
        // Eyes - Larger and more expressive
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

        // Pupils
        const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 0.05);
        this.leftEye.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 0.05);
        this.rightEye.add(rightPupil);

        // Mouth - Curved for expression
        const mouthCurve = new THREE.EllipseCurve(
            0, 0,            // center x, y
            0.12, 0.06,      // xRadius, yRadius
            0, Math.PI,      // start angle, end angle
            false,           // clockwise
            0                // rotation
        );
        const points = mouthCurve.getPoints(20);
        const mouthGeo = new THREE.BufferGeometry().setFromPoints(points);
        // Note: linewidth is not supported by WebGL, line will appear as 1px
        const mouthMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Line(mouthGeo, mouthMat);
        this.mouth.position.set(0, 0.4, 0.28);
        this.mouth.rotation.x = Math.PI / 2;
        this.mesh.add(this.mouth);
    }

    private addAccessories(color: string) {
        // Add a subtle rim/ring around the middle for style
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

        // Add antenna/crown decoration on top
        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const antennaMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.7,
            roughness: 0.3
        });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = 0.95;
        this.mesh.add(antenna);

        // Ball on top of antenna
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
        // Smooth transition could be better, but direct set for now
        this.spotlight.intensity = isTalking ? 50 : 0;
        this.eyeGlow.intensity = isTalking ? 2 : 0;
        
        // Make eyes glow more when talking
        if (isTalking) {
            (this.leftEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
            (this.rightEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        } else {
            (this.leftEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
            (this.rightEye.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        }
    }

    update(volume: number) {
        // Simple squash and stretch or just scale Y
        const scale = 1 + volume * 0.5;
        this.mesh.scale.set(1 / Math.sqrt(scale), scale, 1 / Math.sqrt(scale)); // Conserve volume roughly
        // Lift up so it scales from bottom?
        // Changing scale from center of mesh modifies top and bottom.
        // To scale from bottom, we'd need to adjust position y.
        // Base Y is 0.8. New height is 1.6 * scale. Half height 0.8 * scale.
        // New center should be 0.8 * scale.
        this.mesh.position.y = 0.8 * scale;

        // Make mouth open wider with volume (simulate talking)
        if (this.mouth) {
            const mouthScale = 1 + volume * 0.3;
            this.mouth.scale.set(mouthScale, mouthScale, 1);
        }

        // Handle blinking animation
        if (this.isBlinking) {
            this.blinkTimer++;
            if (this.blinkTimer > 6) {
                // End blink
                this.leftEye.scale.y = 1;
                this.rightEye.scale.y = 1;
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        } else if (volume < 0.1) {
            // Idle state - blink occasionally
            this.blinkTimer++;
            // Blink approximately every 240 frames (4 seconds at 60fps)
            if (this.blinkTimer > 240) {
                this.startBlink();
            }
        } else {
            // Talking - reset timer
            this.blinkTimer = 0;
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
