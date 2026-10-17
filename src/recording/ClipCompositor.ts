import { CaptionTrack, wrapCaption, type TitleCardInfo } from './captions'

export const CLIP_WIDTH = 1280
export const CLIP_HEIGHT = 720
export const CLIP_FPS = 30
/** How long the full-screen title card shows when a scene starts. */
export const TITLE_CARD_MS = 3000

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/**
 * Composites the stage canvas with burned-in captions and the show title into a fixed 16:9
 * canvas that the recorders capture. Drawn right after Stage renders (same task), so the WebGL
 * drawing buffer is still valid without `preserveDrawingBuffer`.
 */
export class ClipCompositor {
  readonly canvas: HTMLCanvasElement
  readonly captions = new CaptionTrack()
  private readonly ctx: CanvasRenderingContext2D
  private title: TitleCardInfo = { show: 'THE JOKESTERS', episode: '' }
  private titleCardUntilMs = 0
  private lastDrawMs = -Infinity

  constructor(doc: Document = document) {
    this.canvas = doc.createElement('canvas')
    this.canvas.width = CLIP_WIDTH
    this.canvas.height = CLIP_HEIGHT
    const ctx = this.canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2D canvas unavailable — cannot composite clips')
    this.ctx = ctx
  }

  setTitle(title: TitleCardInfo): void {
    this.title = title
  }

  /** Show the big title card (scene start). */
  flashTitleCard(nowMs: number): void {
    this.titleCardUntilMs = nowMs + TITLE_CARD_MS
  }

  /**
   * Draw one composited frame if at least 1/CLIP_FPS has elapsed.
   * @returns true when a frame was produced (callers can push it to a WebCodecs encoder).
   */
  draw(source: HTMLCanvasElement, nowMs: number): boolean {
    if (nowMs - this.lastDrawMs < 1000 / CLIP_FPS - 1) return false
    if (source.width === 0 || source.height === 0) return false
    this.lastDrawMs = nowMs

    const { ctx } = this
    // "Cover" crop of the stage into 16:9 so a tall or ultrawide window still frames the cast.
    const targetAspect = CLIP_WIDTH / CLIP_HEIGHT
    const srcAspect = source.width / source.height
    let sx = 0, sy = 0, sw = source.width, sh = source.height
    if (srcAspect > targetAspect) {
      sw = source.height * targetAspect
      sx = (source.width - sw) / 2
    } else {
      sh = source.width / targetAspect
      sy = (source.height - sh) / 2
    }
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, CLIP_WIDTH, CLIP_HEIGHT)
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, CLIP_WIDTH, CLIP_HEIGHT)

    this.drawShowBug()
    this.drawCaption(nowMs)
    this.drawTitleCard(nowMs)
    return true
  }

  private drawShowBug(): void {
    const { ctx } = this
    ctx.save()
    ctx.font = `800 22px ${FONT}`
    const show = this.title.show
    const w = ctx.measureText(show).width + 28
    ctx.fillStyle = 'rgba(10,10,26,0.62)'
    roundRect(ctx, 24, 24, w, 40, 8)
    ctx.fill()
    ctx.fillStyle = '#ffd700'
    ctx.textBaseline = 'middle'
    ctx.fillText(show, 38, 45)
    ctx.restore()
  }

  private drawCaption(nowMs: number): void {
    const entry = this.captions.at(nowMs)
    if (!entry) return
    const { ctx } = this
    ctx.save()
    const fontPx = 32
    ctx.font = `600 ${fontPx}px ${FONT}`
    const maxWidth = CLIP_WIDTH - 200
    const lines = wrapCaption(entry.text, maxWidth, (s) => ctx.measureText(s).width, 3)
    const lineH = fontPx * 1.3
    const boxH = lines.length * lineH + 26 + 30
    const boxY = CLIP_HEIGHT - boxH - 34
    ctx.fillStyle = 'rgba(10,10,26,0.74)'
    roundRect(ctx, 80, boxY, CLIP_WIDTH - 160, boxH, 14)
    ctx.fill()

    ctx.textBaseline = 'top'
    ctx.font = `800 ${fontPx - 8}px ${FONT}`
    ctx.fillStyle = entry.color
    ctx.fillText(entry.speaker.toUpperCase(), 104, boxY + 14)

    ctx.font = `600 ${fontPx}px ${FONT}`
    ctx.fillStyle = '#ffffff'
    lines.forEach((line, i) => ctx.fillText(line, 104, boxY + 14 + 30 + i * lineH))
    ctx.restore()
  }

  private drawTitleCard(nowMs: number): void {
    if (nowMs >= this.titleCardUntilMs) return
    const remaining = this.titleCardUntilMs - nowMs
    // Quick fade-in, hold, fade-out over the last 600 ms.
    const alpha = Math.min(1, (TITLE_CARD_MS - remaining) / 300, remaining / 600)
    const { ctx } = this
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    const g = ctx.createLinearGradient(0, 0, 0, CLIP_HEIGHT)
    g.addColorStop(0, 'rgba(10,10,26,0.88)')
    g.addColorStop(1, 'rgba(26,26,46,0.92)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, CLIP_WIDTH, CLIP_HEIGHT)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffd700'
    ctx.font = `900 84px ${FONT}`
    ctx.fillText(this.title.show, CLIP_WIDTH / 2, CLIP_HEIGHT / 2 - 30)
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 38px ${FONT}`
    ctx.fillText(this.title.episode, CLIP_WIDTH / 2, CLIP_HEIGHT / 2 + 40)
    ctx.restore()
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
