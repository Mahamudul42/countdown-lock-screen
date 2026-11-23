import { Component, memo, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { milestones, palettes, type PaletteId } from '../data'
import './orbit.css'

type SceneProps = {
  selected: string
  onSelect: (id: string) => void
  palette: PaletteId
  paused?: boolean
  completed: string[]
}

const width = 640
const height = 440
const center = { x: 321, y: 218 }
const moonRadius = 111
const textureBase = `${import.meta.env.BASE_URL}textures/`
const tracks = [
  { radius: 162, inclination: 0.35, tilt: -14, opacity: 0.44 },
  { radius: 218, inclination: 0.39, tilt: -18, opacity: 0.55 },
  { radius: 290, inclination: 0.43, tilt: -22, opacity: 0.66 },
]

const markers = [
  { track: 2, angle: -145, align: 'right' },
  { track: 1, angle: -128, align: 'right' },
  { track: 2, angle: -39, align: 'left' },
  { track: 0, angle: 8, align: 'right' },
  { track: 1, angle: 72, align: 'right' },
  { track: 2, angle: 122, align: 'right' },
]

function pointOnTrack(index: number, radians: number) {
  const { radius, inclination, tilt } = tracks[index]
  const angle = THREE.MathUtils.degToRad(tilt)
  const x = radius * Math.cos(radians)
  const y = radius * Math.sin(radians) * inclination
  return {
    x: center.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: center.y + x * Math.sin(angle) + y * Math.cos(angle),
    z: radius * Math.sin(radians) * Math.sqrt(1 - inclination ** 2),
  }
}

function worldPosition(point: { x: number; y: number; z: number }) {
  return [point.x - width / 2, height / 2 - point.y, point.z]
}

const trackPositions = tracks.map((_, index) =>
  new Float32Array(Array.from({ length: 320 }, (_, n) =>
    worldPosition(pointOnTrack(index, (n * Math.PI * 2) / 320))
  ).flat())
)

const markerPositions = markers.map(({ track, angle }) => pointOnTrack(track, THREE.MathUtils.degToRad(angle)))

function makePath(index: number, start: number, end: number) {
  return Array.from({ length: 101 }, (_, n) => {
    const { x, y } = pointOnTrack(index, start + ((end - start) * n) / 100)
    return `${n === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

const fallbackTracks = tracks.map((_, i) => ({
  back: makePath(i, Math.PI, 2 * Math.PI),
  front: makePath(i, 0, Math.PI),
}))

function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return n - Math.floor(n)
}

const stars = Array.from({ length: 150 }, (_, i) => ({
  x: noise(i + 1) * width,
  y: noise(i + 156) * height,
  r: 0.32 + noise(i + 360) ** 3 * 0.85,
  opacity: 0.2 + noise(i + 600) * 0.56,
}))

const vertexShader = `
  varying vec3 globeNormal;
  void main() {
    globeNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D colorMap;
  uniform sampler2D reliefMap;
  uniform float longitude;
  varying vec3 globeNormal;
  const float PI = 3.14159265;

  void main() {
    vec3 n = normalize(globeNormal);
    vec2 uv = vec2(fract(atan(n.x, n.z) / (2.0 * PI) + longitude), 0.5 + asin(n.y) / PI);
    float albedo = dot(texture2D(colorMap, uv).rgb, vec3(0.299, 0.587, 0.114));
    vec3 east = normalize(vec3(n.z, 0.0, -n.x) + vec3(0.000001, 0.0, 0.0));
    vec3 north = cross(n, east);
    vec2 stepSize = vec2(1.0 / 1024.0, 1.0 / 512.0);
    float slopeX = texture2D(reliefMap, uv + vec2(stepSize.x, 0)).r - texture2D(reliefMap, uv - vec2(stepSize.x, 0)).r;
    float slopeY = texture2D(reliefMap, uv + vec2(0, stepSize.y)).r - texture2D(reliefMap, uv - vec2(0, stepSize.y)).r;
    vec3 bumped = normalize(n - 1.3 * (east * slopeX + north * slopeY));
    float sunlight = pow(max(dot(bumped, normalize(vec3(-0.76, 0.69, 0.37))), 0.0), 0.78);
    float albedoTone = clamp((albedo - 0.32) * 1.55 + 0.25, 0.04, 1.03);
    float edge = pow(1.0 - max(n.z, 0.0), 3.1);
    vec3 color = vec3(0.02, 0.033, 0.055) + albedoTone *
      (vec3(0.035, 0.046, 0.068) + sunlight * vec3(1.05, 1.12, 1.22));
    color += (0.008 + 0.07 * sunlight) * edge * vec3(0.5, 0.8, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function LunarSystem({ accent, active, onReady }: { accent: string; active: boolean; onReady: () => void }) {
  const { camera, invalidate, size } = useThree()
  const [colorMap, reliefMap] = useLoader(THREE.TextureLoader, [
    textureBase + 'lroc_color_2k.jpg',
    textureBase + 'ldem_3_8bit.jpg',
  ])
  const material = useRef<THREE.ShaderMaterial>(null)
  const satellite = useRef<THREE.Mesh>(null)
  const elapsed = useRef(0)
  const [uniforms] = useState(() => ({
    colorMap: { value: colorMap },
    reliefMap: { value: reliefMap },
    longitude: { value: 0.525 },
  }))

  useLayoutEffect(() => {
    const ortho = camera as THREE.OrthographicCamera
    ortho.zoom = size.width / width
    ortho.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, invalidate])

  useEffect(() => {
    onReady()
    if (!active) return
    const interval = window.setInterval(invalidate, 1000 / 24)
    return () => window.clearInterval(interval)
  }, [active, invalidate, onReady])

  useFrame((_, delta) => {
    if (active) elapsed.current += Math.min(delta, 0.1)
    if (material.current) material.current.uniforms.longitude.value = 0.525 + elapsed.current * 0.0006
    if (satellite.current) {
      const point = pointOnTrack(1, 2.7 + elapsed.current * 0.048)
      satellite.current.position.set(point.x - width / 2, height / 2 - point.y, point.z)
    }
  })

  return (
    <>
      <mesh position={[center.x - width / 2, height / 2 - center.y, 0]}>
        <sphereGeometry args={[moonRadius, 112, 80]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>
      {trackPositions.map((positions, i) => (
        <lineLoop key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={i === 0 ? '#a6afc3' : accent} transparent opacity={tracks[i].opacity} depthWrite={false} toneMapped={false} />
        </lineLoop>
      ))}
      <mesh ref={satellite}>
        <sphereGeometry args={[1.65, 8, 8]} />
        <meshBasicMaterial color="#f0f8ff" toneMapped={false} />
      </mesh>
    </>
  )
}

function OrbitalScene({ selected, onSelect, palette, completed, paused }: SceneProps) {
  const stage = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [visible, setVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(false)
  const [prefersReducedMotion, setReducedMotion] = useState(true)
  const accent = palettes[palette].accent
  const markReady = useRef(() => setReady(true)).current
  const [webGL] = useState(() => typeof window !== 'undefined' && 'WebGL2RenderingContext' in window)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setTabVisible(!document.hidden)
      setReducedMotion(preference.matches)
    }
    update()
    preference.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    if (stage.current) observer.observe(stage.current)
    return () => {
      preference.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="orbital-scene" ref={stage} role="group" aria-label="Interactive orbital milestone map" style={{ '--orbit-accent': accent } as CSSProperties}>
      <svg className="orbit-stars" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {stars.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#c8ddf8" opacity={star.opacity} />)}
        {[[60, 75], [584, 59], [97, 347], [541, 359]].map(([x, y]) =>
          <path key={x} d={`M${x-2.4} ${y}h4.8m-2.4 -2.4v4.8`} fill="none" stroke="#afc1d7" strokeWidth=".65" opacity=".65" />
        )}
      </svg>
      {(!ready || contextLost) && (
        <svg className="orbit-static" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {fallbackTracks.map((path, i) =>
            <path key={i} d={path.back} fill="none" stroke={i === 0 ? '#a6afc3' : accent} strokeOpacity={tracks[i].opacity} />
          )}
          <image href={textureBase + 'lunar-disc.webp'} x={center.x - moonRadius} y={center.y - moonRadius} width={moonRadius*2} height={moonRadius*2} />
          {fallbackTracks.map((path, i) =>
            <path key={i} d={path.front} fill="none" stroke={i === 0 ? '#a6afc3' : accent} strokeOpacity={tracks[i].opacity} />
          )}
        </svg>
      )}
      {webGL && !contextLost && (
        <div className="orbit-webgl" aria-hidden="true">
          <SceneBoundary>
            <Canvas orthographic camera={{ position: [0, 0, 650], near: 1, far: 1300 }} frameloop="demand" dpr={[1, 1.65]}
              gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
              onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true), { once: true })}>
              <Suspense fallback={null}>
                <LunarSystem accent={accent} active={visible && tabVisible && !(paused ?? prefersReducedMotion)} onReady={markReady} />
              </Suspense>
            </Canvas>
          </SceneBoundary>
        </div>
      )}
      {milestones.map((milestone, i) => {
        const point = markerPositions[i]
        const active = milestone.id === selected
        const done = completed.includes(milestone.id)
        return (
          <button key={milestone.id} type="button" className={`orbit-node${active ? ' is-selected' : ''}${done ? ' is-done' : ''}`}
            style={{ left: `${(point.x / width) * 100}%`, top: `${(point.y / height) * 100}%` }}
            onClick={() => onSelect(milestone.id)} aria-pressed={active} aria-label={`Milestone ${i + 1}: ${milestone.title}${done ? ', complete' : ''}`}>
            <span className="orbit-pin" aria-hidden="true" />
            <span className={`orbit-callout align-${markers[i].align}`} aria-hidden="true">
              <span className="orbit-node-code">M{String(i + 1).padStart(2, '0')}</span>
              {active && <span className="orbit-node-title">{milestone.shortTitle}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default memo(OrbitalScene)
