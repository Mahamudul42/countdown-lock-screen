import type { PaletteId } from './data'
import { palettes } from './data'

export const WALLPAPER_WIDTH = 1440
export const WALLPAPER_HEIGHT = 2560

const sans = '"Instrument Sans", "Segoe UI", Arial, sans-serif'
const mono = '"IBM Plex Mono", Consolas, "Courier New", monospace'

type Milestone = { shortTitle: string; date: string }

export type WallpaperContent = {
  palette: PaletteId
  days: number
  nextMilestone?: Milestone
  completeCount: number
  milestoneCount: number
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  for (const character of text) {
    ctx.fillText(character, x, y)
    x += ctx.measureText(character).width + spacing
  }
}

function stars(ctx: CanvasRenderingContext2D) {
  // Keep the texture repeatable so the preview and download have identical skies.
  let seed = 2912027
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  ctx.fillStyle = '#d8e8f0'
  for (let i = 0; i < 250; i += 1) {
    const x = random() * WALLPAPER_WIDTH
    const y = random() * 1320
    const radius = 0.65 + random() ** 3 * 2.1
    ctx.globalAlpha = (0.12 + random() * 0.56) * (y < 800 ? 0.65 : 1)
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

let moonAsset: Promise<HTMLImageElement | undefined> | undefined

export function loadWallpaperArt() {
  if (!moonAsset) {
    moonAsset = new Promise<HTMLImageElement | undefined>((resolve) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(undefined)
      image.src = `${import.meta.env.BASE_URL}textures/lunar-disc.webp`
    })
  }
  return moonAsset
}

export function loadWallpaperFonts() {
  return Promise.allSettled([
    document.fonts.load(`500 100px ${sans}`),
    document.fonts.load(`600 100px ${sans}`),
    document.fonts.load(`400 60px ${mono}`),
  ])
}

function drawOrbit(ctx: CanvasRenderingContext2D, x: number, y: number, start: number, end: number) {
  ctx.beginPath()
  ctx.ellipse(0, 0, x, y, 0, start, end)
  ctx.stroke()
}

function drawMoon(ctx: CanvasRenderingContext2D, accent: string, moon?: HTMLImageElement) {
  ctx.save()
  ctx.translate(725, 958)
  const light = ctx.createRadialGradient(-75, -65, 12, 0, 0, 635)
  light.addColorStop(0, accent)
  light.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.09
  ctx.fillStyle = light
  ctx.fillRect(-700, -700, 1400, 1400)

  const paths = [
    { x: 570, y: 116, rotation: -0.29, node: 1.77, accented: true },
    { x: 489, y: 151, rotation: 0.16, node: 0.85, accented: false },
    { x: 379, y: 153, rotation: -0.52, node: 1.17, accented: false },
  ]

  // Draw each orbit in two halves so the near and far arcs cross the Moon correctly.
  for (const path of paths) {
    ctx.save()
    ctx.rotate(path.rotation)
    ctx.strokeStyle = path.accented ? accent : '#aebfcf'
    ctx.lineWidth = path.accented ? 2.4 : 1.65
    ctx.globalAlpha = path.accented ? 0.42 : 0.27
    drawOrbit(ctx, path.x, path.y, Math.PI, Math.PI * 2)
    ctx.restore()
  }
  ctx.globalAlpha = 1
  if (moon) {
    ctx.drawImage(moon, -210, -210, 420, 420)
  } else {
    const shade = ctx.createRadialGradient(-112, -132, 26, -100, -90, 346)
    shade.addColorStop(0, '#b8c8d2')
    shade.addColorStop(0.44, '#66798a')
    shade.addColorStop(0.85, '#1e2c3c')
    shade.addColorStop(1, '#121d2b')
    ctx.fillStyle = shade
    ctx.beginPath()
    ctx.arc(0, 0, 210, 0, 2 * Math.PI)
    ctx.fill()
  }

  for (const path of paths) {
    ctx.save()
    ctx.rotate(path.rotation)
    ctx.strokeStyle = path.accented ? accent : '#aebfcf'
    ctx.lineWidth = path.accented ? 2.8 : 1.8
    ctx.globalAlpha = path.accented ? 0.77 : 0.46
    drawOrbit(ctx, path.x, path.y, 0, Math.PI)
    const angle = Math.PI * path.node
    ctx.globalAlpha = 1
    ctx.fillStyle = path.accented ? accent : '#bcccd9'
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * path.x, Math.sin(angle) * path.y, path.accented ? 7 : 4.5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function milestoneDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)))
}

export function drawWallpaper(canvas: HTMLCanvasElement, content: WallpaperContent, moon?: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable')
  const accent = palettes[content.palette].accent
  const margin = 116
  const textWidth = WALLPAPER_WIDTH - 2 * margin

  ctx.save()
  ctx.setTransform(canvas.width / WALLPAPER_WIDTH, 0, 0, canvas.height / WALLPAPER_HEIGHT, 0, 0)
  const sky = ctx.createLinearGradient(0, 0, WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
  sky.addColorStop(0, '#0b1524')
  sky.addColorStop(0.48, '#0b1625')
  sky.addColorStop(1, '#060c16')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
  stars(ctx)
  drawMoon(ctx, accent, moon)

  const textBackdrop = ctx.createLinearGradient(0, 1120, 0, 1340)
  textBackdrop.addColorStop(0, 'rgba(7, 14, 24, 0)')
  textBackdrop.addColorStop(1, '#070e18')
  ctx.fillStyle = textBackdrop
  ctx.fillRect(0, 1120, WALLPAPER_WIDTH, WALLPAPER_HEIGHT - 1120)

  ctx.fillStyle = accent
  ctx.font = `400 62px ${mono}`
  spacedText(ctx, 'UMAP 2027', margin, 1358, 5)
  ctx.fillStyle = '#f5f8fc'
  ctx.font = `600 130px ${sans}`
  ctx.fillText('Research paper', margin - 6, 1500, textWidth)

  ctx.font = `600 220px ${sans}`
  const number = String(Math.max(0, content.days))
  ctx.fillText(number, margin - 8, 1760)
  const numberWidth = ctx.measureText(number).width
  ctx.font = `500 92px ${sans}`
  ctx.fillStyle = '#edf3f8'
  ctx.fillText(content.days === 1 ? 'day left' : 'days left', margin + numberWidth + 24, 1755)
  ctx.font = `500 73px ${sans}`
  ctx.fillStyle = '#dbe6ef'
  ctx.fillText('Due January 29, 2027', margin, 1881, textWidth)

  ctx.strokeStyle = '#526678'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(margin, 1968)
  ctx.lineTo(WALLPAPER_WIDTH - margin, 1968)
  ctx.stroke()

  ctx.fillStyle = accent
  ctx.font = `400 60px ${mono}`
  spacedText(ctx, content.nextMilestone ? 'NEXT MILESTONE' : 'MILESTONES COMPLETE', margin, 2082, 4)
  ctx.fillStyle = '#f5f8fc'
  ctx.font = `600 102px ${sans}`
  ctx.fillText(content.nextMilestone?.shortTitle ?? 'Paper submitted', margin, 2210, textWidth)
  ctx.font = `500 73px ${sans}`
  ctx.fillStyle = '#dbe6ef'
  ctx.fillText(content.nextMilestone ? milestoneDate(content.nextMilestone.date) : `${content.completeCount} of ${content.milestoneCount} complete`, margin, 2315, textWidth)
  ctx.restore()
}
