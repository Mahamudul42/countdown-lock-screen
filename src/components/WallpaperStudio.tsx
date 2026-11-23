import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { getCountdown, milestones, palettes } from '../data'
import type { PaletteId } from '../data'
import { drawWallpaper, loadWallpaperArt, loadWallpaperFonts, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from '../wallpaperDrawing'
import './wallpaper.css'

type WallpaperStudioProps = {
  palette: PaletteId
  setPalette: (id: PaletteId) => void
  completed: string[]
  now: Date
}

const paletteIds: PaletteId[] = ['glacier', 'lilac', 'ember']

export default function WallpaperStudio({ palette, setPalette, completed, now }: WallpaperStudioProps) {
  const preview = useRef<HTMLCanvasElement>(null)
  const [showClock, setShowClock] = useState(true)
  const [exportStatus, setExportStatus] = useState<'idle' | 'busy' | 'ready' | 'error'>('idle')
  const { days } = getCountdown(now)
  const nextMilestone = milestones.find((milestone) => !completed.includes(milestone.id))
  const completeCount = milestones.filter((milestone) => completed.includes(milestone.id)).length

  useEffect(() => {
    let active = true
    const paint = async () => {
      const [moon] = await Promise.all([loadWallpaperArt(), loadWallpaperFonts()])
      if (active && preview.current) {
        drawWallpaper(preview.current, { palette, days, nextMilestone, completeCount, milestoneCount: milestones.length }, moon)
      }
    }
    void paint()
    return () => { active = false }
  }, [palette, days, nextMilestone, completeCount])

  useEffect(() => {
    if (exportStatus !== 'ready') return
    const timeout = window.setTimeout(() => setExportStatus('idle'), 4500)
    return () => window.clearTimeout(timeout)
  }, [exportStatus])

  async function exportWallpaper() {
    setExportStatus('busy')
    try {
      const [moon] = await Promise.all([loadWallpaperArt(), loadWallpaperFonts()])
      const output = document.createElement('canvas')
      output.width = WALLPAPER_WIDTH
      output.height = WALLPAPER_HEIGHT
      drawWallpaper(output, { palette, days, nextMilestone, completeCount, milestoneCount: milestones.length }, moon)
      const png = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, 'image/png'))
      if (!png) throw new Error('PNG could not be encoded')
      const url = URL.createObjectURL(png)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `research-orbit-${palette}-${days}d.png`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
      setExportStatus('ready')
    } catch {
      setExportStatus('error')
    }
  }

  return (
    <section id="wallpaper" className="wallpaper-studio" aria-labelledby="studio-title" style={{ '--studio-accent': palettes[palette].accent } as CSSProperties}>
      <div className="studio-settings">
        <p className="studio-eyebrow"><span aria-hidden="true" /> Lock screen</p>
        <h2 id="studio-title">Wallpaper studio</h2>
        <p className="studio-intro">Choose a palette and save a snapshot of your countdown and next milestone to your lock screen.</p>

        <fieldset className="studio-palette">
          <legend>Color palette</legend>
          <div className="studio-palette-options">
            {paletteIds.map((id) => (
              <label key={id} className="studio-palette-option" style={{ '--swatch-color': palettes[id].accent } as CSSProperties}>
                <input type="radio" name="wallpaper-palette" checked={palette === id} onChange={() => setPalette(id)} />
                <span className="studio-option-face"><i aria-hidden="true" />{palettes[id].name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="studio-clock-control">
          <span><strong>Preview phone clock</strong><small>Check the space for your clock.</small></span>
          <input type="checkbox" role="switch" checked={showClock} onChange={(e) => setShowClock(e.target.checked)} />
          <span className="studio-switch" aria-hidden="true" />
        </label>

        <div className="studio-export">
          <button type="button" onClick={exportWallpaper} disabled={exportStatus === 'busy'}>
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v11m-4-4 4 4 4-4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
            {exportStatus === 'busy' ? 'Preparing PNG…' : 'Download wallpaper'}
          </button>
          <small>PNG · 1440 × 2560 · 9:16</small>
        </div>
        <p className="studio-status" role="status">{exportStatus === 'ready' ? 'Wallpaper is ready. Your download has started.' : exportStatus === 'error' ? 'The PNG could not be saved. Try downloading again.' : ''}</p>
      </div>

      <figure className="studio-preview">
        <div className="studio-phone">
          <div className="studio-screen">
            <canvas ref={preview} width={720} height={1280} role="img" aria-label={`${palettes[palette].name} lock screen, ${days} days until January 29, 2027${nextMilestone ? `, next milestone ${nextMilestone.shortTitle}` : ', all milestones complete'}`} />
            {showClock && <div className="studio-os-clock" aria-hidden="true"><span>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span><strong>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s*[AP]M/i, '')}</strong></div>}
          </div>
        </div>
        <figcaption>Lock screen preview</figcaption>
      </figure>
    </section>
  )
}
