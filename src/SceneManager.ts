import * as THREE from 'three'
import type { Agent } from './GroupChatManager'

export class AgentVisual {
  mesh: THREE.Mesh
  agent: Agent
  targetY: number
  currentY: number
  isJumping: boolean

  constructor(agent: Agent, position: THREE.Vector3) {
    this.agent = agent
    this.targetY = position.y
    this.currentY = position.y
    this.isJumping = false

    // Create a capsule shape (cylinder with spheres on ends)
    const capsuleGroup = new THREE.Group()

    // Main cylinder body
    const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16)
    const material = new THREE.MeshPhongMaterial({ color: agent.color })
    const cylinder = new THREE.Mesh(cylinderGeometry, material)

    // Top sphere
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const topSphere = new THREE.Mesh(sphereGeometry, material)
    topSphere.position.y = 0.5

    // Bottom sphere
    const bottomSphere = new THREE.Mesh(sphereGeometry, material)
    bottomSphere.position.y = -0.5

    capsuleGroup.add(cylinder)
    capsuleGroup.add(topSphere)
    capsuleGroup.add(bottomSphere)

    this.mesh = new THREE.Mesh()
    this.mesh.add(capsuleGroup)
    this.mesh.position.copy(position)
  }

  jump(): void {
    if (!this.isJumping) {
      this.isJumping = true
      this.targetY = this.currentY + 1.5
    }
  }

  update(deltaTime: number): void {
    if (this.isJumping) {
      // Smoothly animate to target position
      const speed = 3
      this.mesh.position.y += (this.targetY - this.mesh.position.y) * speed * deltaTime

      // If reached peak, start falling
      if (Math.abs(this.mesh.position.y - this.targetY) < 0.1) {
        this.targetY = this.currentY
      }

      // If back at original position, stop jumping
      if (this.targetY === this.currentY && Math.abs(this.mesh.position.y - this.currentY) < 0.05) {
        this.mesh.position.y = this.currentY
        this.isJumping = false
      }
    }
  }
}

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private agentVisuals: Map<string, AgentVisual>
  private clock: THREE.Clock

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 3, 8)
    this.camera.lookAt(0, 1, 0)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.agentVisuals = new Map()
    this.clock = new THREE.Clock()

    this.setupLights()
    this.setupGround()

    window.addEventListener('resize', () => this.onWindowResize())
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    this.scene.add(directionalLight)
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x0f3460 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    this.scene.add(ground)
  }

  addAgents(agents: Agent[]): void {
    const spacing = 2
    const totalWidth = (agents.length - 1) * spacing
    const startX = -totalWidth / 2

    agents.forEach((agent, index) => {
      const position = new THREE.Vector3(startX + index * spacing, 1, 0)
      const agentVisual = new AgentVisual(agent, position)
      this.agentVisuals.set(agent.id, agentVisual)
      this.scene.add(agentVisual.mesh)
    })
  }

  makeAgentJump(agentId: string): void {
    const agentVisual = this.agentVisuals.get(agentId)
    if (agentVisual) {
      agentVisual.jump()
    }
  }

  animate(): void {
    requestAnimationFrame(() => this.animate())

    const deltaTime = this.clock.getDelta()

    // Update all agent visuals
    this.agentVisuals.forEach((agentVisual) => {
      agentVisual.update(deltaTime)
    })

    this.renderer.render(this.scene, this.camera)
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  dispose(): void {
    window.removeEventListener('resize', () => this.onWindowResize())
    this.renderer.dispose()
  }
}
