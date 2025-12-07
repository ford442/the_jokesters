
import * as THREE from 'three';

export class Actor {
    public group: THREE.Group;
    private mesh: THREE.Mesh;
    private spotlight: THREE.SpotLight;
    // private originalY: number;

    constructor(_id: string, color: string, x: number) {
        this.group = new THREE.Group();
        this.group.position.set(x, 0, 0); // Base position
        // this.originalY = 1;
        // Geometry is height 1 in SceneManager, let's match that roughly or standard size.
        // SceneManager had cylinder height 1, radius 0.3. TargetY was position.y (1).
        // Let's make it sit on ground. 

        // Capsule Body
        const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
        const material = new THREE.MeshPhongMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.8; // Radius 0.3 + Half Length 0.5 = 0.8? CapsuleGeometry params are radius, length. 
        // Total height = length + 2*radius = 1 + 0.6 = 1.6. Center is at 0. So bottom is -0.8.
        // To stand on 0, y should be 0.8.
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // Face / Direction Indicator
        const faceGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 0.5, 0.25); // Forward Z
        this.mesh.add(face);

        // Spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, 0); // Start dim
        this.spotlight.position.set(0, 5, 2);
        this.spotlight.target = this.mesh;
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.castShadow = true;
        this.group.add(this.spotlight);

        // Debug helper for light? No.
    }

    setTalking(isTalking: boolean) {
        // Smooth transition could be better, but direct set for now
        this.spotlight.intensity = isTalking ? 50 : 0;
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
    }
}
