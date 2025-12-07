declare module 'three' {
    export class Vector3 {
        constructor(x?: number, y?: number, z?: number);
        x: number;
        y: number;
        z: number;
        set(x: number, y: number, z: number): this;
        copy(v: Vector3): this;
    }

    export class Color {
        constructor(color?: number | string);
    }

    export class Object3D {
        position: Vector3;
        rotation: any;
        scale: Vector3;
        add(...object: Object3D[]): this;
        remove(...object: Object3D[]): this;
    }

    export class Scene extends Object3D {
        constructor();
        background: any;
    }

    export class Camera extends Object3D { }

    export class PerspectiveCamera extends Camera {
        constructor(fov?: number, aspect?: number, near?: number, far?: number);
        aspect: number;
        lookAt(x: number | Vector3, y?: number, z?: number): void;
        updateProjectionMatrix(): void;
    }

    export class WebGLRenderer {
        constructor(parameters?: any);
        domElement: HTMLCanvasElement;
        shadowMap: { enabled: boolean; type?: any };
        setSize(width: number, height: number): void;
        setPixelRatio(value: number): void;
        render(scene: Scene, camera: Camera): void;
        dispose(): void;
    }

    export class Clock {
        constructor(autoStart?: boolean);
        getDelta(): number;
    }

    export class Group extends Object3D {
        constructor();
    }

    export class Mesh extends Object3D {
        constructor(geometry?: any, material?: any);
        castShadow: boolean;
        receiveShadow: boolean;
    }

    // Geometry classes
    export class CylinderGeometry {
        constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number);
    }

    export class SphereGeometry {
        constructor(radius?: number, widthSegments?: number, heightSegments?: number);
    }

    export class CapsuleGeometry {
        constructor(radius?: number, length?: number, capSegments?: number, radialSegments?: number);
    }

    export class BoxGeometry {
        constructor(width?: number, height?: number, depth?: number);
    }

    export class PlaneGeometry {
        constructor(width?: number, height?: number);
    }

    // Material classes
    export class MeshPhongMaterial {
        constructor(parameters?: any);
    }

    export class MeshStandardMaterial {
        constructor(parameters?: any);
    }

    // Light classes
    export class Light extends Object3D {
        intensity: number;
        color: Color;
    }

    export class AmbientLight extends Light {
        constructor(color?: number | string, intensity?: number);
    }

    export class DirectionalLight extends Light {
        constructor(color?: number | string, intensity?: number);
        target: Object3D;
        castShadow: boolean;
    }

    export class SpotLight extends Light {
        constructor(color?: any, intensity?: number, distance?: number, angle?: number, penumbra?: number, decay?: number);
        target: Object3D;
        angle: number;
        penumbra: number;
        castShadow: boolean;
    }
}
