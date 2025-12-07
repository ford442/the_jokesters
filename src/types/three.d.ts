declare module 'three' {
    export class Vector3 {
        constructor(x?: number, y?: number, z?: number);
        x: number;
        y: number;
        z: number;
    }

    export class Scene {
        constructor();
        add(...object: Object3D[]): this;
        remove(...object: Object3D[]): this;
        background: any;
    }

    export class PerspectiveCamera {
        constructor(fov?: number, aspect?: number, near?: number, far?: number);
        position: Vector3;
        lookAt(vector: Vector3): void;
    }

    export class WebGLRenderer {
        constructor(parameters?: any);
        domElement: HTMLCanvasElement;
        setSize(width: number, height: number): void;
        render(scene: Scene, camera: Camera): void;
        setPixelRatio(value: number): void;
    }

    export class Clock {
        constructor(autoStart?: boolean);
        getDelta(): number;
    }

    export class Object3D {
        position: Vector3;
        rotation: any;
        scale: Vector3;
        add(...object: Object3D[]): this;
    }

    export class Group extends Object3D {
        constructor();
    }

    export class Mesh extends Object3D {
        constructor(geometry?: any, material?: any);
    }

    export class SpotLight extends Object3D {
        constructor(color?: any, intensity?: number, distance?: number, angle?: number, penumbra?: number, decay?: number);
        target: Object3D;
    }

    export type Camera = PerspectiveCamera;
}
