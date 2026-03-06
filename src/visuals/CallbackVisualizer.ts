
import * as THREE from 'three';

export interface CallbackVisualState {
  count: number;
  status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead';
}

/**
 * CallbackVisualizer - Visual feedback system for running gag callbacks
 * 
 * Displays:
 * - Subtle counter above actor head (x2, x3, x4, x5)
 * - Golden glow on 3rd callback (peak funny)
 * - Awkward silence animation on 5th callback (overdone)
 * 
 * Comedy theory: Callbacks peak at 3rd use, then decline
 */
export class CallbackVisualizer {
  private group: THREE.Group;
  private counterSprite: any | null = null;
  private glowLight: THREE.PointLight | null = null;
  private actorMesh: THREE.Mesh;
  
  // Animation state
  private isAwkwardSilence: boolean = false;
  private awkwardSilenceTime: number = 0;
  private baseY: number = 0;
  
  // Constants
  private readonly COUNTER_OFFSET_Y = 1.3; // Above actor head
  private readonly GLOW_COLOR_PEAK = 0xffd700; // Gold
  private readonly GLOW_COLOR_DECLINE = 0xff6b6b; // Red-ish
  private readonly GLOW_COLOR_DEAD = 0x666666; // Gray

  constructor(actorGroup: THREE.Group, actorMesh: THREE.Mesh) {
    this.group = actorGroup;
    this.actorMesh = actorMesh;
    this.baseY = actorMesh.position.y;
  }

  /**
   * Record a callback and update visual feedback
   * @param jokeId - The joke identifier
   * @param count - Current callback count (1st, 2nd, 3rd, etc.)
   * @param status - Callback status from engine
   */
  public recordCallback(_jokeId: string, count: number, status: CallbackVisualState['status']): void {
    
    // Only show counter for 2nd+ callbacks (subtle - don't show x1)
    if (count >= 2) {
      this.showCounter(count, status);
    }
    
    // Apply visual effects based on status
    switch (status) {
      case 'building':
        this.showBuildingEffect();
        break;
      case 'peak':
        this.showPeakEffect();
        break;
      case 'declining':
        this.showDecliningEffect();
        break;
      case 'dead':
        this.triggerAwkwardSilence();
        break;
    }
  }

  /**
   * Update called every frame for animations
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    if (this.isAwkwardSilence) {
      this.updateAwkwardSilence(deltaTime);
    }
    
    // Animate counter bobbing
    if (this.counterSprite) {
      const time = Date.now() * 0.003;
      this.counterSprite.position.y = this.COUNTER_OFFSET_Y + Math.sin(time) * 0.05;
    }
  }

  /**
   * Clear all callback visuals (scene reset)
   */
  public clear(): void {
    this.isAwkwardSilence = false;
    
    if (this.counterSprite) {
      this.group.remove(this.counterSprite);
      this.counterSprite = null;
    }
    
    if (this.glowLight) {
      this.group.remove(this.glowLight);
      this.glowLight = null;
    }
    
    // Reset actor mesh
    this.actorMesh.material = new THREE.MeshPhongMaterial({
      color: (this.actorMesh.material as any).color,
      shininess: 30
    });
  }

  private showCounter(count: number, status: CallbackVisualState['status']): void {
    // Remove existing counter
    if (this.counterSprite) {
      this.group.remove(this.counterSprite);
    }
    
    // Create text texture for counter
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle background circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.getStatusColor(status, 0.8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw counter text
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(`x${count}`, centerX, centerY);
    
    // Create sprite
    const texture = new (THREE as any).CanvasTexture(canvas);
    const material = new (THREE as any).SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    this.counterSprite = new (THREE as any).Sprite(material);
    this.counterSprite.scale.set(0.4, 0.4, 0.4);
    this.counterSprite.position.set(0, this.COUNTER_OFFSET_Y, 0);
    
    // Add fade-in animation
    this.counterSprite.material.opacity = 0;
    this.animateCounterFadeIn();
    
    this.group.add(this.counterSprite);
    
    // Auto-hide counter after 3 seconds (subtle - don't persist too long)
    setTimeout(() => {
      this.hideCounter();
    }, 3000);
  }

  private animateCounterFadeIn(): void {
    if (!this.counterSprite) return;
    
    const duration = 300; // ms
    const start = Date.now();
    
    const fade = () => {
      if (!this.counterSprite) return;
      
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      this.counterSprite.material.opacity = progress * 0.9;
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };
    
    fade();
  }

  private hideCounter(): void {
    if (!this.counterSprite) return;
    
    const duration = 500; // ms
    const start = Date.now();
    const startOpacity = this.counterSprite.material.opacity;
    
    const fade = () => {
      if (!this.counterSprite) return;
      
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      this.counterSprite.material.opacity = startOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        if (this.counterSprite) {
          this.group.remove(this.counterSprite);
          this.counterSprite = null;
        }
      }
    };
    
    fade();
  }

  private showBuildingEffect(): void {
    // Subtle scale pulse on building momentum
    this.pulseActor(1.05, 200);
  }

  private showPeakEffect(): void {
    // Golden glow on peak (3rd callback)
    this.addGlowEffect(this.GLOW_COLOR_PEAK, 2.0);
    this.pulseActor(1.1, 300);
    
    // Add sparkle particles effect (could be expanded)
    console.log('[CallbackVisualizer] 🌟 PEAK callback - golden glow!');
  }

  private showDecliningEffect(): void {
    // Diminished glow on decline
    this.addGlowEffect(this.GLOW_COLOR_DECLINE, 0.8);
  }

  private triggerAwkwardSilence(): void {
    // 5th callback - overdone, awkward silence
    this.isAwkwardSilence = true;
    this.awkwardSilenceTime = 0;
    
    // Gray out the actor
    this.addGlowEffect(this.GLOW_COLOR_DEAD, 0.3);
    
    console.log('[CallbackVisualizer] 😬 AWKWARD SILENCE - callback overdone!');
  }

  private updateAwkwardSilence(deltaTime: number): void {
    this.awkwardSilenceTime += deltaTime;
    
    // Awkward silence animation: slow slump/cringe
    const slumpAmount = Math.min(this.awkwardSilenceTime * 0.5, 0.3);
    this.actorMesh.position.y = this.baseY - slumpAmount;
    this.actorMesh.rotation.z = Math.sin(this.awkwardSilenceTime * 3) * 0.05;
    
    // End awkward silence after 2 seconds
    if (this.awkwardSilenceTime > 2.0) {
      this.isAwkwardSilence = false;
      this.actorMesh.position.y = this.baseY;
      this.actorMesh.rotation.z = 0;
      
      // Clear visuals
      if (this.glowLight) {
        this.group.remove(this.glowLight);
        this.glowLight = null;
      }
    }
  }

  private addGlowEffect(color: number, intensity: number): void {
    // Remove existing glow
    if (this.glowLight) {
      this.group.remove(this.glowLight);
    }
    
    // Add point light for glow effect
    this.glowLight = new THREE.PointLight(color, intensity, 3);
    this.glowLight.position.set(0, 0.5, 0.5);
    this.group.add(this.glowLight);
    
    // Also tint the mesh material
    const baseColor = (this.actorMesh.material as any).color;
    const tintFactor = 0.3;
    
    const r = baseColor.r * (1 - tintFactor) + ((color >> 16) & 0xff) / 255 * tintFactor;
    const g = baseColor.g * (1 - tintFactor) + ((color >> 8) & 0xff) / 255 * tintFactor;
    const b = baseColor.b * (1 - tintFactor) + (color & 0xff) / 255 * tintFactor;
    
    (this.actorMesh.material as any).color.setRGB(r, g, b);
    
    // Fade out glow after 2 seconds
    setTimeout(() => {
      this.fadeOutGlow();
    }, 2000);
  }

  private fadeOutGlow(): void {
    if (!this.glowLight) return;
    
    const duration = 1000; // ms
    const start = Date.now();
    const startIntensity = this.glowLight.intensity;
    
    const fade = () => {
      if (!this.glowLight) return;
      
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      this.glowLight.intensity = startIntensity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        if (this.glowLight) {
          this.group.remove(this.glowLight);
          this.glowLight = null;
        }
      }
    };
    
    fade();
  }

  private pulseActor(scaleMultiplier: number, duration: number): void {
    const startScale = this.actorMesh.scale.x;
    const targetScale = startScale * scaleMultiplier;
    const startTime = Date.now();
    
    const pulse = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out back
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * Math.sin(easeProgress * Math.PI);
      
      // Apply uniform scale while preserving volume-ish proportions
      this.actorMesh.scale.set(
        1 / Math.sqrt(currentScale),
        currentScale,
        1 / Math.sqrt(currentScale)
      );
      
      if (progress < 1) {
        requestAnimationFrame(pulse);
      } else {
        // Reset to base scale
        this.actorMesh.scale.set(1, 1, 1);
      }
    };
    
    pulse();
  }

  private getStatusColor(status: CallbackVisualState['status'], alpha: number): string {
    switch (status) {
      case 'fresh':
        return `rgba(78, 205, 196, ${alpha})`; // Teal
      case 'building':
        return `rgba(255, 206, 84, ${alpha})`; // Yellow
      case 'peak':
        return `rgba(255, 215, 0, ${alpha})`; // Gold
      case 'declining':
        return `rgba(255, 107, 107, ${alpha})`; // Red
      case 'dead':
        return `rgba(102, 102, 102, ${alpha})`; // Gray
      default:
        return `rgba(200, 200, 200, ${alpha})`;
    }
  }
}
