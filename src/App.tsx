import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { deadline, getCountdown, milestones, palettes, type PaletteId } from './data'
import MilestoneTimeline from './components/MilestoneTimeline'
import WallpaperStudio from './components/WallpaperStudio'

const OrbitalScene = lazy(() => import('./components/OrbitalScene'))
const storageKey = 'research-orbit:umap-2027:v1'

function readPreferences() {
  let palette: PaletteId = 'glacier'
  let completed: string[] = []
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    if (Object.hasOwn(palettes, saved.palette)) palette = saved.palette
    if (Array.isArray(saved.completed)) {
      completed = milestones.filter(m => saved.completed.includes(m.id)).map(m => m.id)
    }
  } catch { /* Storage can be unavailable in private browsing. */ }
  return { palette, completed }
}

function OrbitMark() {
  return <svg viewBox="0 0 36 36" width="36" height="36" fill="none" aria-hidden="true">
    <circle cx="18" cy="18" r="9.1" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="18" cy="18" rx="16.5" ry="5.9" transform="rotate(-34 18 18)" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="30.1" cy="7.8" r="2.3" fill="currentColor" />
  </svg>
}

function PhoneIcon() {
  return <svg width="16" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="4.7" y="1.7" width="10.6" height="16.6" rx="2.5" stroke="currentColor" strokeWidth="1.45" />
    <path d="M8.7 15.7h2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
}

function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.8" y="4.3" width="14.4" height="13.2" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6.5 2.5v3.7m7-3.7v3.7M3 8.7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
}

function SiteHeader({ section }: { section: string }) {
  return <header className="site-header">
    <div className="page-width header-inner flex items-center">
      <a className="brand flex items-center gap-3" href="#overview" aria-label="Research Orbit home"><OrbitMark />Research Orbit</a>
      <nav className="main-nav flex items-center" aria-label="Main navigation">
        <a href="#overview" aria-current={section === 'overview' ? 'location' : undefined}>Overview</a>
        <a href="#milestones" aria-current={section === 'milestones' ? 'location' : undefined}>Milestones</a>
      </nav>
      <a href="#wallpaper" className="studio-shortcut inline-flex items-center gap-2" aria-current={section === 'wallpaper' ? 'location' : undefined}>
        <PhoneIcon /><span>Wallpaper studio</span>
      </a>
    </div>
  </header>
}

function Countdown({ now }: { now: Date }) {
  const remaining = getCountdown(now)
  const units = ['days', 'hours', 'minutes', 'seconds'] as const
  return <div className="countdown" role="timer" aria-label="Time until paper submission">
    {units.map(unit => <div className="count-unit" key={unit}>
      <span className="count-value">{String(remaining[unit]).padStart(2, '0')}</span><span className="count-label">{unit}</span>
    </div>)}
  </div>
}

export default function App() {
  const [preferences, setPreferences] = useState(readPreferences)
  const { palette, completed } = preferences
  const next = milestones.find(m => !completed.includes(m.id))
  const [selected, setSelected] = useState(next?.id ?? milestones[0].id)
  const [now, setNow] = useState(() => new Date())
  const [section, setSection] = useState('overview')
  const reduceMotion = useReducedMotion()
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null)
  const paused = motionOverride ?? Boolean(reduceMotion)

  useEffect(() => {
    const update = () => setNow(new Date())
    const timer = window.setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update) }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)) } catch { /* Progress remains available in this tab. */ }
  }, [preferences])
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setSection(entry.target.id)
    }, { rootMargin: '-12% 0px -54%' })
    for (const id of ['overview', 'milestones', 'wallpaper']) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  function toggleMilestone(id: string) {
    setPreferences(p => ({
      ...p, completed: p.completed.includes(id) ? p.completed.filter(item => item !== id) : [...p.completed, id],
    }))
  }
  const expired = getCountdown(now).totalMs === 0
  return <MotionConfig reducedMotion="user">
    <div className="app-shell" style={{ '--accent': palettes[palette].accent, '--accent-rgb': palettes[palette].rgb } as CSSProperties}>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader section={section} />
      <main id="main">
        <section id="overview" className="overview" aria-labelledby="mission-title">
          <div className="page-width hero-inner">
            <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
              <div className="mission-eyebrow"><span className="eyebrow-line" />Mission control</div>
              <h1 id="mission-title">UMAP 2027<br /><em>Research Paper</em></h1>
              <p className="hero-subtitle">Computer Science PhD <span> / </span> Paper submission</p>
              <div className="clock-block">
                <p className="clock-caption"><i aria-hidden="true" />{expired ? 'Deadline reached' : 'Time to submission'}</p>
                <Countdown now={now} />
              </div>
              <p className="deadline-row"><CalendarIcon /><time dateTime={deadline}>January 29, 2027</time><span className="deadline-divider" aria-hidden="true" /><span>11:59 PM CST</span></p>
            </motion.div>
            <figure className="hero-art">
              <div className="art-window">
                <Suspense fallback={<div className="scene-loading"><img src={import.meta.env.BASE_URL + 'textures/lunar-disc.webp'} alt="" /></div>}>
                  <OrbitalScene selected={selected} onSelect={setSelected} palette={palette} completed={completed} paused={paused} />
                </Suspense>
              </div>
              <figcaption className="orbit-caption">
                <span className="orbit-caption-title"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3" stroke="currentColor"/><ellipse cx="10" cy="10" rx="8.2" ry="4" transform="rotate(-32 10 10)" stroke="currentColor"/></svg>Orbital timeline</span>
                <span className="orbit-help">Select a milestone</span>
                <button className="motion-switch" type="button" aria-label={paused ? 'Play orbital animation' : 'Pause orbital animation'} title={paused ? 'Play orbital animation' : 'Pause orbital animation'} onClick={() => setMotionOverride(!paused)}>
                  {paused ? <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5z" fill="currentColor" /></svg> : <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10m6-10v10" stroke="currentColor" strokeWidth="2" /></svg>}
                </button>
              </figcaption>
            </figure>
          </div>
        </section>
        <div className="focus-band">
          <div className="page-width focus-inner">
            <div className="focus-label"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.1"/><circle cx="11" cy="11" r="2" fill="currentColor"/><path d="M11 1v4m0 12v4M1 11h4m12 0h4" stroke="currentColor" strokeWidth="1.1"/></svg>{next ? 'Next milestone' : 'Mission complete'}</div>
            <strong>{next?.title ?? 'All six milestones complete'}</strong>
            {next && <time dateTime={next.date}>{new Intl.DateTimeFormat('en-US', { month:'short',day:'numeric',year:'numeric',timeZone:'UTC' }).format(new Date(next.date))}</time>}
            <a href="#milestones" onClick={() => next && setSelected(next.id)}>View plan <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
          </div>
        </div>
        <MilestoneTimeline selected={selected} onSelect={setSelected} completed={completed} onToggle={toggleMilestone} palette={palette} />
        <WallpaperStudio now={now} completed={completed} palette={palette} setPalette={palette => setPreferences(p => ({ ...p, palette }))} />
      </main>
      <footer className="site-footer">
        <div className="page-width footer-inner">
          <a href="#overview" className="brand footer-brand"><OrbitMark />Research Orbit</a>
          <span>Handshake Countdown Lock Screen Challenge</span>
          <a href={import.meta.env.BASE_URL + 'research-orbit-cover.png'} download>Download cover <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m-3-3 3 3 3-3M3 11v2h10v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
        </div>
      </footer>
    </div>
  </MotionConfig>
}
