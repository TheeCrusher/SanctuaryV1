// ============================================================
// WALK ON WATER — A Sanctuary Mini-Game
// ============================================================
// Based on Matthew 14:22-33 (Walking on Water)
// & the Feeding of the 5,000 (Matthew 14:13-21)
//
// All game code is self-contained in this single file.
// No external assets, CSS files, or backend changes needed.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// ======================== CONSTANTS ========================

const JESUS_Y_RATIO = 0.72        // Jesus vertical position (72% from top — near bottom, back-view)
const SNAKE_BASE_INTERVAL = 2500   // ms between snake spawns at start
const SNAKE_MIN_INTERVAL = 700     // fastest snake spawn rate
const SNAKE_BASE_SPEED = 140       // px/s at start
const SNAKE_MAX_SPEED = 400        // cap snake speed
const FISH_MIN_INTERVAL = 4000     // min ms between fish
const FISH_MAX_INTERVAL = 7000     // max ms between fish
const BUBBLE_DURATION = 1200       // ms bubbles show before fish
const FISH_VISIBLE_DURATION = 1800 // ms fish is catchable
const FISH_SPLASH_DURATION = 400   // ms fish splash animation
const THROW_DURATION = 0.6         // seconds for throw arc
const SWIPE_THRESHOLD = 5          // px minimum for swipe
const TAP_MAX_MOVE = 15            // px max movement for a tap
const TAP_MAX_DURATION = 250       // ms max for a tap
const DOUBLE_TAP_WINDOW = 350      // ms between taps for double-tap
const CROWD_FLASH_DURATION = 0.5   // seconds crowd highlights

// ======================== DRAWING HELPERS ========================

function drawWater(ctx, w, h, scrollY, frame) {
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#1B7FA0')
  grad.addColorStop(0.5, '#156B88')
  grad.addColorStop(1, '#0E4F68')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Scrolling wave lines
  ctx.lineWidth = 1.5
  for (let i = 0; i < Math.ceil(h / 35) + 2; i++) {
    const baseY = ((i * 35 + scrollY * 0.6) % (h + 70)) - 35
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + Math.sin(i * 0.5) * 0.02})`
    ctx.beginPath()
    for (let x = 0; x <= w; x += 4) {
      const wy = baseY + Math.sin((x + frame * 1.5 + i * 40) * 0.025) * 3
      if (x === 0) ctx.moveTo(x, wy)
      else ctx.lineTo(x, wy)
    }
    ctx.stroke()
  }

  // Sparkles
  for (let i = 0; i < 6; i++) {
    const sx = (Math.sin(frame * 0.013 + i * 1.8) * 0.5 + 0.5) * w
    const sy = ((Math.cos(frame * 0.01 + i * 2.5) * 0.5 + 0.5) * h + scrollY * 0.3) % h
    const alpha = 0.2 + Math.sin(frame * 0.05 + i) * 0.15
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawJesus(ctx, x, y, s, throwAnim, frame) {
  // Walking animation — sine wave alternates feet
  const walkPhase = Math.sin(frame * 0.12)
  const stepOffset = walkPhase * 3.5 * s
  const robeSway = walkPhase * 1.5 * s

  // --- Expanding water ripples at feet ---
  for (let i = 0; i < 4; i++) {
    const rippleAge = ((frame * 0.03 + i * 0.25) % 1)
    const rippleRadius = (10 + rippleAge * 28) * s
    const rippleAlpha = 0.28 * (1 - rippleAge)
    if (rippleAlpha > 0.02) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha})`
      ctx.lineWidth = (1.4 - rippleAge) * s * 0.8
      ctx.beginPath()
      ctx.ellipse(x, y + 22 * s, rippleRadius, rippleRadius * 0.22, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Step splash droplets at foot impact
  const stepImpact = Math.abs(walkPhase)
  if (stepImpact < 0.15) {
    const splashForce = 1 - stepImpact / 0.15
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + frame * 0.05
      const dist = (1 - splashForce) * 8 * s
      const dropX = x + Math.cos(angle) * dist
      const dropY = y + 19 * s - splashForce * 6 * s + Math.sin(angle) * dist * 0.3
      ctx.fillStyle = `rgba(200, 230, 255, ${splashForce * 0.5})`
      ctx.beginPath()
      ctx.arc(dropX, dropY, (1 + splashForce) * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.beginPath()
  ctx.ellipse(x, y + 20 * s, 10 * s, 3 * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // Feet — alternating step positions
  ctx.fillStyle = '#8B6B47'
  ctx.fillRect(x - 5 * s, y + 15 * s - stepOffset, 3.5 * s, 4 * s)
  ctx.fillRect(x + 1.5 * s, y + 15 * s + stepOffset, 3.5 * s, 4 * s)

  // Robe (back view — hem sways with walk)
  ctx.fillStyle = '#F5F0E6'
  ctx.beginPath()
  ctx.moveTo(x - 9 * s, y - 8 * s)
  ctx.lineTo(x + 9 * s, y - 8 * s)
  ctx.lineTo(x + 13 * s + robeSway, y + 16 * s)
  ctx.lineTo(x - 13 * s + robeSway, y + 16 * s)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#C8B89A'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Back robe fold lines
  ctx.strokeStyle = 'rgba(180, 165, 140, 0.25)'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(x - 2 * s, y - 6 * s)
  ctx.quadraticCurveTo(x - 3 * s + robeSway * 0.3, y + 5 * s, x - 3 * s, y + 15 * s)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + 3 * s, y - 6 * s)
  ctx.quadraticCurveTo(x + 4 * s + robeSway * 0.3, y + 5 * s, x + 4 * s, y + 15 * s)
  ctx.stroke()

  // Belt
  ctx.fillStyle = '#B8860B'
  ctx.fillRect(x - 9 * s, y + 1 * s, 18 * s, 2.5 * s)

  // Arms (swing opposite to legs — natural walk)
  ctx.strokeStyle = '#D4A574'
  ctx.lineWidth = 2.5 * s
  ctx.lineCap = 'round'
  // Left arm
  ctx.beginPath()
  ctx.moveTo(x - 9 * s, y - 4 * s)
  if (throwAnim === 'left' || throwAnim === 'both') {
    ctx.lineTo(x - 22 * s, y - 10 * s)
  } else {
    ctx.lineTo(x - 13 * s, y + 4 * s + stepOffset * 0.6)
  }
  ctx.stroke()
  // Right arm
  ctx.beginPath()
  ctx.moveTo(x + 9 * s, y - 4 * s)
  if (throwAnim === 'right' || throwAnim === 'both') {
    ctx.lineTo(x + 22 * s, y - 10 * s)
  } else {
    ctx.lineTo(x + 13 * s, y + 4 * s - stepOffset * 0.6)
  }
  ctx.stroke()

  // Head
  ctx.fillStyle = '#D4A574'
  ctx.beginPath()
  ctx.arc(x, y - 15 * s, 6.5 * s, 0, Math.PI * 2)
  ctx.fill()

  // Hair (BACK VIEW — full coverage, drapes down to shoulders)
  ctx.fillStyle = '#4A2810'
  // Full hair cap covering back of head
  ctx.beginPath()
  ctx.arc(x, y - 16 * s, 7 * s, 0, Math.PI * 2)
  ctx.fill()
  // Hair draping down sides
  ctx.fillRect(x - 7 * s, y - 16 * s, 2.8 * s, 11 * s)
  ctx.fillRect(x + 4.2 * s, y - 16 * s, 2.8 * s, 11 * s)
  // Back center hair flowing down
  ctx.beginPath()
  ctx.moveTo(x - 4.5 * s, y - 12 * s)
  ctx.lineTo(x - 4 * s, y - 3 * s + robeSway * 0.4)
  ctx.quadraticCurveTo(x, y - 1 * s + robeSway * 0.3, x + 4 * s, y - 3 * s - robeSway * 0.4)
  ctx.lineTo(x + 4.5 * s, y - 12 * s)
  ctx.closePath()
  ctx.fill()

  // No beard — back view, can't see face

  // Halo glow
  const haloAlpha = 0.2 + Math.sin(frame * 0.04) * 0.08
  ctx.beginPath()
  ctx.arc(x, y - 17 * s, 12 * s, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 215, 0, ${haloAlpha})`
  ctx.fill()
  // Halo ring
  ctx.beginPath()
  ctx.arc(x, y - 17 * s, 11 * s, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawSnake(ctx, x, y, s, frame) {
  const segments = 7
  const segLen = 5.5 * s

  // Body — sine wave segments (trail upward from head)
  ctx.lineWidth = 4.5 * s
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#2D6B16'
  ctx.beginPath()
  for (let i = 0; i < segments; i++) {
    const sx = x + Math.sin(frame * 0.12 + i * 0.9) * 7 * s
    const sy = y - i * segLen
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()

  // Darker belly line
  ctx.lineWidth = 2 * s
  ctx.strokeStyle = '#1A4A0A'
  ctx.beginPath()
  for (let i = 0; i < segments; i++) {
    const sx = x + Math.sin(frame * 0.12 + i * 0.9) * 7 * s
    const sy = y - i * segLen
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.stroke()

  // Head (faces downward toward Jesus)
  const headX = x + Math.sin(frame * 0.12) * 7 * s
  ctx.fillStyle = '#1F5010'
  ctx.beginPath()
  ctx.arc(headX, y + 2 * s, 4.5 * s, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#FF3333'
  ctx.beginPath()
  ctx.arc(headX - 2 * s, y + 3.5 * s, 1.2 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(headX + 2 * s, y + 3.5 * s, 1.2 * s, 0, Math.PI * 2)
  ctx.fill()

  // Tongue (flicks downward)
  const tongueWag = Math.sin(frame * 0.2) * 2 * s
  ctx.strokeStyle = '#FF3333'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(headX, y + 6 * s)
  ctx.lineTo(headX + tongueWag, y + 10 * s)
  ctx.moveTo(headX, y + 6 * s)
  ctx.lineTo(headX - tongueWag, y + 10 * s)
  ctx.stroke()
}

function drawBubbles(ctx, x, y, s, progress) {
  // progress: 0 → 1 over BUBBLE_DURATION
  for (let i = 0; i < 4; i++) {
    const bx = x + (Math.sin(i * 2.3) * 10) * s
    const by = y - progress * 20 * s - i * 6 * s
    const r = (1.5 + Math.sin(i + progress * 5) * 0.5) * s
    const alpha = 0.3 + (1 - progress) * 0.3
    ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawFish(ctx, x, y, s, jumpProgress) {
  // jumpProgress: 0 → 1 (parabolic arc)
  const jumpY = y - Math.sin(jumpProgress * Math.PI) * 30 * s
  const angle = jumpProgress < 0.5 ? -0.3 : 0.3

  ctx.save()
  ctx.translate(x, jumpY)
  ctx.rotate(angle)

  // Body
  ctx.fillStyle = '#E8963E'
  ctx.beginPath()
  ctx.ellipse(0, 0, 8 * s, 4.5 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#C67A28'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Tail
  ctx.fillStyle = '#D47F28'
  ctx.beginPath()
  ctx.moveTo(8 * s, 0)
  ctx.lineTo(13 * s, -4 * s)
  ctx.lineTo(13 * s, 4 * s)
  ctx.closePath()
  ctx.fill()

  // Eye
  ctx.fillStyle = '#222'
  ctx.beginPath()
  ctx.arc(-3 * s, -1 * s, 1.2 * s, 0, Math.PI * 2)
  ctx.fill()

  // Fin
  ctx.fillStyle = '#D4882E'
  ctx.beginPath()
  ctx.moveTo(0, -4 * s)
  ctx.lineTo(-2 * s, -8 * s)
  ctx.lineTo(3 * s, -4 * s)
  ctx.closePath()
  ctx.fill()

  ctx.restore()

  // Splash rings at water surface when jumping
  if (jumpProgress > 0.05 && jumpProgress < 0.95) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(x, y, (6 + jumpProgress * 8) * s, 2 * s, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawCrowd(ctx, side, w, h, s, flashTimer) {
  const crowdX = side === 'left' ? 12 * s : w - 12 * s
  const figures = 5
  const startY = h * 0.15

  for (let i = 0; i < figures; i++) {
    const fy = startY + i * 28 * s
    const alpha = 0.25

    // Flash effect when receiving food
    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${flashTimer * 0.4})`
      ctx.beginPath()
      ctx.arc(crowdX, fy, 12 * s, 0, Math.PI * 2)
      ctx.fill()
    }

    // Head
    ctx.fillStyle = `rgba(180, 160, 130, ${alpha})`
    ctx.beginPath()
    ctx.arc(crowdX, fy - 5 * s, 3.5 * s, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.fillStyle = `rgba(160, 140, 110, ${alpha})`
    ctx.beginPath()
    ctx.moveTo(crowdX - 4 * s, fy - 1 * s)
    ctx.lineTo(crowdX + 4 * s, fy - 1 * s)
    ctx.lineTo(crowdX + 5 * s, fy + 8 * s)
    ctx.lineTo(crowdX - 5 * s, fy + 8 * s)
    ctx.closePath()
    ctx.fill()

    // Raised arms (when flash active)
    if (flashTimer > 0.2) {
      ctx.strokeStyle = `rgba(180, 160, 130, ${alpha + 0.1})`
      ctx.lineWidth = 1.5 * s
      ctx.beginPath()
      ctx.moveTo(crowdX - 4 * s, fy)
      ctx.lineTo(crowdX - 7 * s, fy - 6 * s)
      ctx.moveTo(crowdX + 4 * s, fy)
      ctx.lineTo(crowdX + 7 * s, fy - 6 * s)
      ctx.stroke()
    }
  }
}

function drawThrowArc(ctx, startX, startY, side, w, h, progress, isBread, s) {
  const endX = side === 'left' ? 14 * s : w - 14 * s
  const endY = h * 0.12
  const x = startX + (endX - startX) * progress
  const y = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 50 * s

  if (progress >= 1) return

  ctx.save()
  if (isBread) {
    // Bread loaf
    ctx.fillStyle = '#C4954A'
    ctx.beginPath()
    ctx.ellipse(x, y, 5 * s, 3.5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#A07838'
    ctx.lineWidth = 0.8
    ctx.stroke()
    // Score line on bread
    ctx.strokeStyle = '#8B6528'
    ctx.beginPath()
    ctx.moveTo(x - 3 * s, y)
    ctx.lineTo(x + 3 * s, y)
    ctx.stroke()
  } else {
    // Small fish
    ctx.fillStyle = '#E8963E'
    ctx.beginPath()
    ctx.ellipse(x, y, 5 * s, 2.5 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#D47F28'
    ctx.beginPath()
    ctx.moveTo(x + 5 * s, y)
    ctx.lineTo(x + 8 * s, y - 2 * s)
    ctx.lineTo(x + 8 * s, y + 2 * s)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawScoreHUD(ctx, w, s, distance, peopleFed) {
  const total = Math.floor(distance) + peopleFed * 5
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(0, 0, w, 36 * s)

  ctx.fillStyle = '#FFD700'
  ctx.font = `bold ${11 * s}px system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`Distance: ${Math.floor(distance)}`, 10 * s, 15 * s)
  ctx.fillText(`Fed: ${peopleFed}`, 10 * s, 30 * s)

  ctx.textAlign = 'right'
  ctx.font = `bold ${14 * s}px system-ui, sans-serif`
  ctx.fillText(`Score: ${total}`, w - 10 * s, 23 * s)
  ctx.textAlign = 'left'
}

function drawTapHint(ctx, x, y, s, frame) {
  const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7
  ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.8})`
  ctx.font = `bold ${10 * s}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('TAP! TAP!', x, y - 35 * s)
  ctx.textAlign = 'left'
}

// ======================== COMPONENT ========================

export default function WalkOnWater() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('title') // title | playing | gameover
  const [finalScore, setFinalScore] = useState({ distance: 0, peopleFed: 0, total: 0 })

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animRef = useRef(null)
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, lastTapTime: 0, swiped: false })

  // Mutable game state — not in React state to avoid re-renders during game loop
  const gs = useRef({
    jesus: { lane: 1, x: 0, targetX: 0 },
    snakes: [],
    fish: null,       // { lane, state, timer, jumpProgress }
    throws: [],       // { side, isBread, progress }
    lastFeedSide: 'left',
    crowdFlash: { left: 0, right: 0 },
    distance: 0,
    peopleFed: 0,
    difficulty: 1,
    snakeTimer: 2000,
    fishTimer: 5000,
    scrollY: 0,
    frame: 0,
    lastTime: 0,
    running: false,
  })

  // ---------- Canvas Setup ----------
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function resize() {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ---------- Game Loop ----------
  const gameLoop = useCallback((timestamp) => {
    const g = gs.current
    if (!g.running) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const s = w / 400 // scale unit

    // Delta time
    if (g.lastTime === 0) g.lastTime = timestamp
    const dt = Math.min((timestamp - g.lastTime) / 1000, 0.05) // cap at 50ms
    g.lastTime = timestamp
    g.frame++

    // Lane positions
    const laneW = w / 3
    const laneCenter = (lane) => laneW * lane + laneW / 2
    const jesusY = h * JESUS_Y_RATIO

    // Update Jesus position (smooth slide)
    g.jesus.targetX = laneCenter(g.jesus.lane)
    if (g.jesus.x === 0) g.jesus.x = g.jesus.targetX // first frame
    g.jesus.x += (g.jesus.targetX - g.jesus.x) * 0.18

    // Update scroll & distance
    g.scrollY += 120 * dt
    g.distance += dt * 12

    // Difficulty ramp
    g.difficulty = 1 + g.distance / 250

    // --- Spawn Snakes ---
    // ONE snake per cycle, purely random lane. With only 1 snake spawning
    // at a time, only 1 lane is ever blocked at any given height — Jesus
    // always has 2 free lanes to dodge into. Difficulty = speed, not patterns.
    g.snakeTimer -= dt * 1000
    if (g.snakeTimer <= 0) {
      const speed = Math.min(SNAKE_BASE_SPEED * g.difficulty, SNAKE_MAX_SPEED)
      const lane = Math.floor(Math.random() * 3)
      g.snakes.push({ lane, y: -30 * s, speed })

      // Spawn rate stays steady — speed is what ramps up
      g.snakeTimer = Math.max(SNAKE_MIN_INTERVAL, SNAKE_BASE_INTERVAL / Math.sqrt(g.difficulty))
    }

    // --- Spawn Fish ---
    g.fishTimer -= dt * 1000
    if (g.fishTimer <= 0 && !g.fish) {
      const fishLane = Math.floor(Math.random() * 3)
      g.fish = {
        lane: fishLane,
        state: 'bubbling',
        timer: BUBBLE_DURATION,
        jumpProgress: 0,
      }
      g.fishTimer = FISH_MIN_INTERVAL + Math.random() * (FISH_MAX_INTERVAL - FISH_MIN_INTERVAL)
    }

    // --- Update Snakes ---
    for (const snake of g.snakes) {
      snake.y += snake.speed * dt

      // Collision with Jesus
      const snakeX = laneCenter(snake.lane)
      const dx = Math.abs(snakeX - g.jesus.x)
      const dy = Math.abs(snake.y - jesusY)
      if (dx < laneW * 0.35 && dy < 18 * s) {
        g.running = false
        const total = Math.floor(g.distance) + g.peopleFed * 5
        setFinalScore({ distance: Math.floor(g.distance), peopleFed: g.peopleFed, total })
        setScreen('gameover')
        return
      }
    }
    g.snakes = g.snakes.filter(sn => sn.y < h + 40 * s)

    // --- Update Fish ---
    if (g.fish) {
      g.fish.timer -= dt * 1000
      if (g.fish.state === 'bubbling' && g.fish.timer <= 0) {
        g.fish.state = 'visible'
        g.fish.timer = FISH_VISIBLE_DURATION
        g.fish.jumpProgress = 0
      } else if (g.fish.state === 'visible') {
        g.fish.jumpProgress = 1 - (g.fish.timer / FISH_VISIBLE_DURATION)
        if (g.fish.timer <= 0) {
          g.fish.state = 'missed'
          g.fish.timer = FISH_SPLASH_DURATION
        }
      } else if (g.fish.state === 'caught') {
        g.fish.timer -= dt * 1000
        if (g.fish.timer <= 0) g.fish = null
      } else if (g.fish.state === 'missed') {
        if (g.fish.timer <= 0) g.fish = null
      }
    }

    // --- Update Throws ---
    for (const t of g.throws) {
      t.progress += dt / THROW_DURATION
    }
    // When throw arrives, flash the crowd
    g.throws = g.throws.filter(t => {
      if (t.progress >= 1) {
        g.crowdFlash[t.side] = CROWD_FLASH_DURATION
        return false
      }
      return true
    })

    // Update crowd flash
    if (g.crowdFlash.left > 0) g.crowdFlash.left -= dt
    if (g.crowdFlash.right > 0) g.crowdFlash.right -= dt

    // ========== DRAW ==========
    ctx.clearRect(0, 0, w, h)

    // Water background
    drawWater(ctx, w, h, g.scrollY, g.frame)

    // Lane dividers (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 12])
    ctx.beginPath()
    ctx.moveTo(laneW, 0); ctx.lineTo(laneW, h)
    ctx.moveTo(laneW * 2, 0); ctx.lineTo(laneW * 2, h)
    ctx.stroke()
    ctx.setLineDash([])

    // Crowd on sides
    drawCrowd(ctx, 'left', w, h, s, g.crowdFlash.left)
    drawCrowd(ctx, 'right', w, h, s, g.crowdFlash.right)

    // Snakes
    for (const snake of g.snakes) {
      drawSnake(ctx, laneCenter(snake.lane), snake.y, s, g.frame)
    }

    // Fish + Bubbles
    if (g.fish) {
      const fishX = laneCenter(g.fish.lane)
      const fishBaseY = h * 0.40
      if (g.fish.state === 'bubbling') {
        const bp = 1 - g.fish.timer / BUBBLE_DURATION
        drawBubbles(ctx, fishX, fishBaseY, s, bp)
      } else if (g.fish.state === 'visible') {
        drawFish(ctx, fishX, fishBaseY, s, g.fish.jumpProgress)
        drawTapHint(ctx, fishX, fishBaseY, s, g.frame)
      } else if (g.fish.state === 'missed') {
        // Splash
        const sp = 1 - g.fish.timer / FISH_SPLASH_DURATION
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - sp)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(fishX, fishBaseY, (10 + sp * 15) * s, (3 + sp * 4) * s, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Throw arcs
    for (const t of g.throws) {
      drawThrowArc(ctx, g.jesus.x, jesusY, t.side, w, h, t.progress, t.isBread, s)
    }

    // Jesus — determine throw animation state
    let throwAnim = null
    if (g.throws.length > 0 && g.throws[0].progress < 0.3) {
      throwAnim = 'both'
    }
    drawJesus(ctx, g.jesus.x, jesusY, s, throwAnim, g.frame)

    // Score HUD
    drawScoreHUD(ctx, w, s, g.distance, g.peopleFed)

    // Continue loop
    animRef.current = requestAnimationFrame(gameLoop)
  }, [])

  // ---------- Start / Stop ----------
  function startGame() {
    const g = gs.current
    g.jesus = { lane: 1, x: 0, targetX: 0 }
    g.snakes = []
    g.fish = null
    g.throws = []
    g.lastFeedSide = 'left'
    g.crowdFlash = { left: 0, right: 0 }
    g.distance = 0
    g.peopleFed = 0
    g.difficulty = 1
    g.snakeTimer = 2000
    g.fishTimer = 3000
    g.scrollY = 0
    g.frame = 0
    g.lastTime = 0
    g.running = true

    setScreen('playing')
    animRef.current = requestAnimationFrame(gameLoop)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gs.current.running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // ---------- Input: Lane Movement ----------
  function moveLeft() {
    const g = gs.current
    if (g.jesus.lane > 0) g.jesus.lane--
  }

  function moveRight() {
    const g = gs.current
    if (g.jesus.lane < 2) g.jesus.lane++
  }

  // ---------- Input: Catch Fish ----------
  function catchFish() {
    const g = gs.current
    if (g.fish && g.fish.state === 'visible') {
      g.fish.state = 'caught'
      g.fish.timer = 300
      g.peopleFed += 2 // fish + bread = 2 people fed

      // Determine throw sides (alternating)
      const fishSide = g.lastFeedSide
      const breadSide = fishSide === 'left' ? 'right' : 'left'

      g.throws.push({ side: fishSide, isBread: false, progress: 0 })
      g.throws.push({ side: breadSide, isBread: true, progress: 0 })

      // Alternate for next catch
      g.lastFeedSide = g.lastFeedSide === 'left' ? 'right' : 'left'
    }
  }

  // ---------- Touch Events ----------
  // THREE ways to move: swipe, flick, or tap left/right side of screen.
  // Double-tap anywhere catches fish.
  // Tap zones: left 1/3 = move left, right 1/3 = move right, middle 1/3 = no move.
  useEffect(() => {
    const el = containerRef.current
    if (!el || screen !== 'playing') return

    function onTouchStart(e) {
      e.preventDefault()
      const touch = e.touches[0]
      touchRef.current.startX = touch.clientX
      touchRef.current.startY = touch.clientY
      touchRef.current.startTime = Date.now()
      touchRef.current.swiped = false
    }

    function onTouchMove(e) {
      e.preventDefault()
      if (touchRef.current.swiped) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchRef.current.startX
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        touchRef.current.swiped = true
        if (dx > 0) moveRight()
        else moveLeft()
      }
    }

    function onTouchEnd(e) {
      e.preventDefault()
      if (touchRef.current.swiped) return

      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY
      const elapsed = Date.now() - touchRef.current.startTime

      // Fallback: catch quick flick swipes
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) moveRight()
        else moveLeft()
        return
      }

      // Tap detection (finger barely moved)
      if (Math.abs(dx) < TAP_MAX_MOVE && Math.abs(dy) < TAP_MAX_MOVE && elapsed < TAP_MAX_DURATION) {
        const now = Date.now()

        // Double-tap → catch fish
        if (now - touchRef.current.lastTapTime < DOUBLE_TAP_WINDOW) {
          catchFish()
          touchRef.current.lastTapTime = 0
          return
        }

        touchRef.current.lastTapTime = now
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [screen])

  // ---------- Keyboard Events ----------
  useEffect(() => {
    if (screen !== 'playing') return

    function onKeyDown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft()
      else if (e.key === 'ArrowRight' || e.key === 'd') moveRight()
      else if (e.key === ' ') { e.preventDefault(); catchFish() }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen])

  // ======================== RENDER ========================

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Canvas — always rendered */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* ---- Title Screen ---- */}
      {screen === 'title' && (
        <div style={styles.overlay}>
          <button style={styles.backBtn} onClick={() => navigate('/more')}>
            <ArrowLeft size={22} />
          </button>

          <div style={styles.titleContent}>
            <div style={styles.titleHalo}>
              <div style={styles.titleIcon}>🌊</div>
            </div>
            <h1 style={styles.titleText}>Walk on Water</h1>
            <p style={styles.verse}>Matthew 14:22-33</p>
            <p style={styles.subtitle}>
              Swipe left & right to dodge the serpents.{'\n'}
              Double-tap to catch fish & feed the crowd!{'\n'}
              Score = distance walked + people fed.
            </p>

            <button style={styles.playBtn} onClick={startGame}>
              Play
            </button>

            <div style={styles.controls}>
              <div style={styles.controlRow}>
                <span style={styles.controlKey}>← →</span>
                <span style={styles.controlLabel}>Dodge</span>
              </div>
              <div style={styles.controlRow}>
                <span style={styles.controlKey}>Tap Tap</span>
                <span style={styles.controlLabel}>Catch Fish</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Game Over Screen ---- */}
      {screen === 'gameover' && (
        <div style={styles.overlay}>
          <div style={styles.gameOverContent}>
            <h1 style={styles.gameOverTitle}>Game Over</h1>

            <div style={styles.scoreCard}>
              <div style={styles.scoreRow}>
                <span style={styles.scoreLabel}>Distance</span>
                <span style={styles.scoreValue}>{finalScore.distance}</span>
              </div>
              <div style={styles.scoreRow}>
                <span style={styles.scoreLabel}>People Fed</span>
                <span style={styles.scoreValue}>{finalScore.peopleFed}</span>
              </div>
              <div style={{ ...styles.scoreRow, ...styles.scoreDivider }}>
                <span style={{ ...styles.scoreLabel, ...styles.totalLabel }}>Total Score</span>
                <span style={{ ...styles.scoreValue, ...styles.totalValue }}>{finalScore.total}</span>
              </div>
            </div>

            <button style={styles.playBtn} onClick={startGame}>
              Play Again
            </button>
            <button style={styles.menuBtn} onClick={() => navigate('/more')}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================== INLINE STYLES ========================

const styles = {
  container: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: '#0E4F68',
    overflow: 'hidden',
    zIndex: 100,
  },
  canvas: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 60, 85, 0.88)',
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    top: 16, left: 16,
    background: 'rgba(255,255,255,0.12)',
    border: 'none',
    borderRadius: '50%',
    width: 40, height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
  },
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '0 32px',
  },
  titleHalo: {
    width: 80, height: 80,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,215,0,0.25), transparent 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    fontSize: 40,
  },
  titleText: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 2px 12px rgba(255,215,0,0.3)',
  },
  verse: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontStyle: 'italic',
    margin: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '8px 0 16px',
    whiteSpace: 'pre-line',
  },
  playBtn: {
    background: 'linear-gradient(135deg, #DAA520, #B8860B)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 48px',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 8,
    boxShadow: '0 4px 16px rgba(218,165,32,0.35)',
  },
  menuBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '12px 32px',
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 8,
  },
  controls: {
    marginTop: 20,
    display: 'flex',
    gap: 24,
  },
  controlRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  controlKey: {
    background: 'rgba(255,255,255,0.12)',
    color: '#FFD700',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  gameOverContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '0 32px',
  },
  gameOverTitle: {
    color: '#FF6B6B',
    fontSize: 28,
    fontWeight: 'bold',
    margin: '0 0 8px',
  },
  scoreCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '16px 24px',
    minWidth: 200,
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreDivider: {
    borderTop: '1px solid rgba(255,255,255,0.15)',
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#FFD700',
    fontSize: 20,
  },
}
