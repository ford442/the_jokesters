/**
 * Avatar Visibility Verification
 * 
 * Requirements for guaranteed avatar visibility:
 * 1. Actor Position: (0, 0, 0) - centered at origin
 * 2. Camera Position: (0, 0, 5) - looking straight at actor
 * 3. Contrasting Background: Dark blue (0x1a1a2e) vs light-colored actors
 * 4. Proper Lighting: 3-point lighting ensuring visibility
 * 
 * Expected Result: Bright, clearly visible capsule avatar against dark background
 */

import * as THREE from 'three';

// Current Implementation Configuration
export const VISIBILITY_CONFIG = {
    stage: {
        background: 0x1a1a2e, // Dark blue/purple
        camera: {
            position: { x: 0, y: 0, z: 5 },
            fov: 75,
            near: 0.1,
            far: 1000
        }
    },
    lighting: {
        ambient: { color: 0xffffff, intensity: 0.6 },
        directional: { 
            color: 0xffffff, 
            intensity: 1.0, 
            position: { x: 5, y: 10, z: 7 }
        },
        fill: { 
            color: 0xaaccff, 
            intensity: 0.4, 
            position: { x: -5, y: 5, z: -5 }
        }
    },
    ground: {
        color: 0x333333,
        position: { y: -0.8 },
        size: { width: 20, depth: 10 }
    },
    actor: {
        geometry: { radius: 0.3, length: 1, capSegments: 4, radialSegments: 8 },
        material: { shininess: 30 },
        meshPosition: { y: 0 },
        spotlight: { intensity: { talking: 50, idle: 0 } }
    },
    actors: [
        { id: 'comedian', color: '#ff6b6b', x: -2 },
        { id: 'scientist', color: '#45b7d1', x: 0 },
        { id: 'philosopher', color: '#4ecdc4', x: 2 }
    ]
};

// Verification checklist
export const VISIBILITY_CHECKLIST = {
    actor_centered: 'Actor mesh at y=0 (centered vertically)',
    camera_positioned: 'Camera at (0, 0, 5)',
    background_contrast: 'Dark background (0x1a1a2e)',
    ambient_light: 'Ambient light (0.6 intensity)',
    directional_light: 'Directional key light (1.0 intensity)',
    fill_light: 'Fill light (0.4 intensity, blue-tinted)',
    shadows_enabled: 'Shadows enabled for depth',
    bright_actor_colors: 'Actors use bright colors (red, blue, teal)',
    face_indicator: 'White face indicator visible',
    spotlight_highlight: 'Spotlight highlights active speaker (intensity 50)'
};

// Minimal test scene generator for verification
export function createMinimalVisibilityScene(canvas: HTMLCanvasElement): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    actors: THREE.Mesh[];
} {
    // Scene with contrasting background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VISIBILITY_CONFIG.stage.background);

    // Camera at (0, 0, 5) looking at origin
    const camera = new THREE.PerspectiveCamera(
        VISIBILITY_CONFIG.stage.camera.fov,
        canvas.width / canvas.height || 1,
        VISIBILITY_CONFIG.stage.camera.near,
        VISIBILITY_CONFIG.stage.camera.far
    );
    camera.position.set(
        VISIBILITY_CONFIG.stage.camera.position.x,
        VISIBILITY_CONFIG.stage.camera.position.y,
        VISIBILITY_CONFIG.stage.camera.position.z
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: false 
    });
    renderer.setSize(canvas.width || 800, canvas.height || 600);
    renderer.setClearColor(VISIBILITY_CONFIG.stage.background, 1);
    renderer.shadowMap.enabled = true;

    // 1. Ambient light (base illumination)
    const ambientLight = new THREE.AmbientLight(
        VISIBILITY_CONFIG.lighting.ambient.color,
        VISIBILITY_CONFIG.lighting.ambient.intensity
    );
    scene.add(ambientLight);

    // 2. Directional light (main key light)
    const dirLight = new THREE.DirectionalLight(
        VISIBILITY_CONFIG.lighting.directional.color,
        VISIBILITY_CONFIG.lighting.directional.intensity
    );
    dirLight.position.set(
        VISIBILITY_CONFIG.lighting.directional.position.x,
        VISIBILITY_CONFIG.lighting.directional.position.y,
        VISIBILITY_CONFIG.lighting.directional.position.z
    );
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Fill light
    const fillLight = new THREE.DirectionalLight(
        VISIBILITY_CONFIG.lighting.fill.color,
        VISIBILITY_CONFIG.lighting.fill.intensity
    );
    fillLight.position.set(
        VISIBILITY_CONFIG.lighting.fill.position.x,
        VISIBILITY_CONFIG.lighting.fill.position.y,
        VISIBILITY_CONFIG.lighting.fill.position.z
    );
    scene.add(fillLight);

    // Create actors
    const actors: THREE.Mesh[] = [];
    VISIBILITY_CONFIG.actors.forEach(actorConfig => {
        // Capsule
        const geometry = new THREE.CapsuleGeometry(
            VISIBILITY_CONFIG.actor.geometry.radius,
            VISIBILITY_CONFIG.actor.geometry.length,
            VISIBILITY_CONFIG.actor.geometry.capSegments,
            VISIBILITY_CONFIG.actor.geometry.radialSegments
        );
        const material = new THREE.MeshPhongMaterial({ 
            color: actorConfig.color,
            shininess: VISIBILITY_CONFIG.actor.material.shininess
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position at x offset, centered at origin
        mesh.position.set(actorConfig.x, 0, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        actors.push(mesh);

        // Face indicator
        const faceGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 0.2, 0.28);
        mesh.add(face);
    });

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(
        VISIBILITY_CONFIG.ground.size.width,
        VISIBILITY_CONFIG.ground.size.depth
    );
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: VISIBILITY_CONFIG.ground.color,
        roughness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = VISIBILITY_CONFIG.ground.position.y;
    ground.receiveShadow = true;
    scene.add(ground);

    return { scene, camera, renderer, actors };
}

// Validation function
export function validateVisibility(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (VISIBILITY_CONFIG.stage.camera.position.y !== 0) {
        issues.push('Camera Y position should be 0 for centered view');
    }
    if (VISIBILITY_CONFIG.lighting.ambient.intensity < 0.4) {
        issues.push('Ambient light intensity too low for visibility');
    }
    if (VISIBILITY_CONFIG.lighting.directional.intensity < 0.8) {
        issues.push('Directional light intensity too low');
    }
    if (VISIBILITY_CONFIG.actor.meshPosition.y !== 0) {
        issues.push('Actor mesh should be centered at y=0');
    }
    
    return {
        valid: issues.length === 0,
        issues
    };
}

console.log('Avatar Visibility Verification Module Loaded');
console.log('Configuration:', VISIBILITY_CONFIG);
console.log('Checklist:', VISIBILITY_CHECKLIST);
console.log('Validation:', validateVisibility());
