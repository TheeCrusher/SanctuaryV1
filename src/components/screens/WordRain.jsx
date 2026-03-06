// =============================================================================
// WORD RAIN GAME SCREEN
// =============================================================================
// Tetris-inspired Bible verse game. Words from a verse rain down and the player
// taps the correct next word before it exits the screen. Passive learning:
// the full verse is always visible at the top.
//
// Flow: Source Select → [boss_intro] → Playing → [verse_reveal on fail] → Results
// Route: /word-rain

import './WordRain.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Flame, RotateCcw, Heart, Pause, Play } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

const VERSES_PER_ROUND = 5
const BUBBLE_WIDTH = 90

const DIFF_CONFIG = {
  easy:   { bubbles: 3, speed: 0.5, speedMult: 0.10, hearts: 3, label: 'Easy',         desc: '3 bubbles · slower' },
  normal: { bubbles: 4, speed: 0.7, speedMult: 0.18, hearts: 3, label: 'Normal',        desc: '4 bubbles · steady' },
  hard:   { bubbles: 5, speed: 1.0, speedMult: 0.22, hearts: 2, label: 'Hard',          desc: '5 bubbles · 2 hearts' },
  sudden: { bubbles: 4, speed: 0.9, speedMult: 0.20, hearts: 1, label: 'Sudden Death',  desc: '1 heart · no mercy' },
}

const BOSS_VERSE_REFS = [
  'John 3:16', 'Psalm 23:1', 'Philippians 4:13',
  'Romans 8:28', 'Jeremiah 29:11', 'Matthew 6:33', 'Isaiah 40:31',
]

const FEEDBACK_WORDS = ['Nice!', 'Great!', 'Yes!', 'Right!']

// ── Module-level counters (stable across renders) ──────────────────────────────

let bubbleIdCounter = 0
let feedbackIdCounter = 0
function nextBubbleId() { return ++bubbleIdCounter }
function nextFeedbackId() { return ++feedbackIdCounter }

// ── Pure helpers ───────────────────────────────────────────────────────────────

function shuffleArray(arr) {
  const s = [...arr]
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]]
  }
  return s
}

function tokenize(text) {
  return text.split(/\s+/).map((raw, index) => ({
    index,
    raw,
    display: raw.replace(/[^a-zA-Z'-]/g, ''),
  }))
}

// ── Component ──────────────────────────────────────────────────────────────────

function WordRain() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { scriptureVerses, scriptureBookmarkIds, recordGameRound, memorizationStats } = useApp()

  // ── Game flow ────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('source_select')
  const [source, setSource] = useState(null)
  const [difficulty, setDifficulty] = useState('normal')

  // ── Round data ───────────────────────────────────────────────────────────────
  const [gameVerses, setGameVerses] = useState([])
  const [verseIndex, setVerseIndex] = useState(0)

  // ── Per-verse play state ─────────────────────────────────────────────────────
  const [tokens, setTokens] = useState([])
  const [targetIdx, setTargetIdx] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [bubbles, setBubbles] = useState([])
  const [combo, setCombo] = useState(0)
  const [feedbackPops, setFeedbackPops] = useState([])
  const [versePanelFlash, setVersePanelFlash] = useState(false)
  const [paused, setPaused] = useState(false)

  // ── Verse reveal (after failure) ─────────────────────────────────────────────
  const [revealVerse, setRevealVerse] = useState(null)
  const [revealCountdown, setRevealCountdown] = useState(3)

  // ── Score / results ──────────────────────────────────────────────────────────
  const [score, setScore] = useState(0)
  const [roundResults, setRoundResults] = useState([])
  const [latestStreak, setLatestStreak] = useState(memorizationStats.streak)
  const [isNewBest, setIsNewBest] = useState(false)

  // ── High scores (localStorage) ───────────────────────────────────────────────
  const [highScores, setHighScores] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wr_highScores') || '{}') }
    catch { return {} }
  })

  // ── Refs for RAF closure ─────────────────────────────────────────────────────
  const rafRef = useRef(null)
  const phaseRef = useRef('source_select')
  const pausedRef = useRef(false)
  const sourceRef = useRef(null)
  const difficultyRef = useRef('normal')
  const gameVersesRef = useRef([])
  const verseIndexRef = useRef(0)
  const tokensRef = useRef([])
  const targetIdxRef = useRef(0)
  const heartsRef = useRef(3)
  const comboRef = useRef(0)
  const scoreRef = useRef(0)
  const roundResultsRef = useRef([])
  const speedRef = useRef(0.7)
  const wordsCorrectRef = useRef(0)
  const gameAreaRef = useRef(null)
  const gameAreaHeightRef = useRef(600)

  // Keep refs in sync
  phaseRef.current = phase
  pausedRef.current = paused
  difficultyRef.current = difficulty
  gameVersesRef.current = gameVerses
  verseIndexRef.current = verseIndex
  tokensRef.current = tokens
  targetIdxRef.current = targetIdx
  heartsRef.current = hearts
  comboRef.current = combo
  scoreRef.current = score
  roundResultsRef.current = roundResults

  // ── Categories ───────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(scriptureVerses.map(v => v.category))
    return [...cats].sort()
  }, [scriptureVerses])

  const bookmarkCount = scriptureBookmarkIds.size

  // ── High score helpers ───────────────────────────────────────────────────────
  function hsKey(src, diff) { return `${src}__${diff}` }
  function getHighScore(src, diff) { return highScores[hsKey(src, diff)] || 0 }
  function saveHighScore(src, diff, newScore) {
    const updated = { ...highScores, [hsKey(src, diff)]: newScore }
    setHighScores(updated)
    localStorage.setItem('wr_highScores', JSON.stringify(updated))
  }

  // ── Feedback pops ────────────────────────────────────────────────────────────
  function spawnFeedback(text, x, y) {
    const id = nextFeedbackId()
    setFeedbackPops(prev => [...prev, { id, text, x, y }])
    setTimeout(() => setFeedbackPops(prev => prev.filter(p => p.id !== id)), 900)
  }

  // ── Decoy / wave builders ────────────────────────────────────────────────────
  function getDecoyWords(correctWord, currentVerseId, bubbleCount) {
    const needed = bubbleCount - 1
    const otherVerses = scriptureVerses.filter(v => v.id !== currentVerseId)
    const pool = []
    otherVerses.forEach(v => {
      v.text.split(/\s+/).forEach(w => {
        const d = w.replace(/[^a-zA-Z'-]/g, '')
        if (d && d.toLowerCase() !== correctWord.toLowerCase() && d.length > 2) pool.push(d)
      })
    })
    const shuffled = shuffleArray(pool)
    const decoys = []
    const seen = new Set([correctWord.toLowerCase()])
    for (const w of shuffled) {
      if (!seen.has(w.toLowerCase())) {
        seen.add(w.toLowerCase())
        decoys.push(w)
        if (decoys.length === needed) break
      }
    }
    const fallbacks = ['faith', 'grace', 'peace', 'mercy', 'truth', 'hope', 'love']
    let fi = 0
    while (decoys.length < needed) decoys.push(fallbacks[fi++ % fallbacks.length])
    return decoys
  }

  function buildWave(correctDisplay, verseId, areaWidth, bubbleCount) {
    const decoys = getDecoyWords(correctDisplay, verseId, bubbleCount)
    const allWords = shuffleArray([
      { display: correctDisplay, isCorrect: true },
      ...decoys.map(d => ({ display: d, isCorrect: false })),
    ])
    const w = areaWidth || 320
    const laneWidth = w / allWords.length
    return allWords.map((wrd, i) => {
      const rawX = laneWidth * i + laneWidth / 2 - BUBBLE_WIDTH / 2 + (Math.random() - 0.5) * 16
      const clampedX = Math.max(2, Math.min(w - BUBBLE_WIDTH - 2, rawX))
      return {
        id: nextBubbleId(),
        display: wrd.display,
        isCorrect: wrd.isCorrect,
        x: clampedX,
        y: -60 - Math.random() * 40,
        status: 'falling',
      }
    })
  }

  // ── Game start ───────────────────────────────────────────────────────────────
  function startGame() {
    const cfg = DIFF_CONFIG[difficulty]
    let pool = source === 'bookmarks'
      ? scriptureVerses.filter(v => scriptureBookmarkIds.has(v.id))
      : scriptureVerses.filter(v => v.category === source)

    if (pool.length === 0) { showToast('No verses available for this selection', 'error'); return }

    const short = pool.filter(v => v.text.split(/\s+/).length <= 20)
    if (short.length >= 3) pool = short

    const selected = shuffleArray(pool).slice(0, VERSES_PER_ROUND)

    // Pad to VERSES_PER_ROUND if pool was smaller (cycle through existing)
    while (selected.length < VERSES_PER_ROUND) {
      selected.push(selected[selected.length % pool.length])
    }

    // Boss verse: replace slot 4 with a famous verse if available
    const bossRef = BOSS_VERSE_REFS[Math.floor(Math.random() * BOSS_VERSE_REFS.length)]
    const bossVerse = scriptureVerses.find(v => v.reference === bossRef)
    if (bossVerse && !selected.slice(0, 4).some(v => v.id === bossVerse.id)) {
      selected[4] = bossVerse
    }

    sourceRef.current = source
    setGameVerses(selected)
    gameVersesRef.current = selected
    setVerseIndex(0)
    verseIndexRef.current = 0
    setScore(0)
    scoreRef.current = 0
    setRoundResults([])
    roundResultsRef.current = []
    setIsNewBest(false)
    setCombo(0)
    comboRef.current = 0

    setPhase('playing')
    phaseRef.current = 'playing'
    initVerse(selected[0], 0)
  }

  function initVerse(verse, vIdx) {
    cancelAnimationFrame(rafRef.current)

    const cfg = DIFF_CONFIG[difficultyRef.current]
    const isBoss = vIdx === VERSES_PER_ROUND - 1

    const t = tokenize(verse.text)
    setTokens(t)
    tokensRef.current = t
    setTargetIdx(0)
    targetIdxRef.current = 0

    const maxH = cfg.hearts
    setHearts(maxH)
    heartsRef.current = maxH

    setCombo(0)
    comboRef.current = 0

    wordsCorrectRef.current = 0

    speedRef.current = cfg.speed + vIdx * cfg.speedMult * (isBoss ? 1.5 : 1) + (isBoss ? 0.2 : 0)

    const areaWidth = gameAreaRef.current?.clientWidth || 320
    gameAreaHeightRef.current = gameAreaRef.current?.clientHeight || 600

    const bubbleCount = isBoss ? Math.min(cfg.bubbles + 2, 6) : cfg.bubbles
    const wave = buildWave(t[0].display, verse.id, areaWidth, bubbleCount)
    setBubbles(wave)
    setFeedbackPops([])
    setVersePanelFlash(false)
    setPaused(false)
    pausedRef.current = false

    setPhase('playing')
    phaseRef.current = 'playing'

    rafRef.current = requestAnimationFrame(tick)
  }

  // ── Animation loop ───────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (phaseRef.current !== 'playing' || pausedRef.current) return

    const areaHeight = gameAreaHeightRef.current
    const speed = speedRef.current
    const cfg = DIFF_CONFIG[difficultyRef.current]
    const isBoss = verseIndexRef.current === VERSES_PER_ROUND - 1
    const bubbleCount = isBoss ? Math.min(cfg.bubbles + 2, 6) : cfg.bubbles

    setBubbles(prev => {
      const updated = prev.map(b => b.status !== 'falling' ? b : { ...b, y: b.y + speed })
      const exited = updated.filter(b => b.status === 'falling' && b.y > areaHeight)

      if (exited.length > 0) {
        const correctExited = exited.find(b => b.isCorrect)
        if (correctExited) {
          const newHearts = Math.max(0, heartsRef.current - 1)
          heartsRef.current = newHearts
          setHearts(newHearts)
          // Correct word missed — reset combo
          comboRef.current = 0
          setCombo(0)

          if (newHearts <= 0) {
            const cleaned = updated.map(b => ({ ...b, status: 'missed' }))
            setTimeout(() => endVerse(false), 600)
            return cleaned
          }

          const verse = gameVersesRef.current[verseIndexRef.current]
          const target = tokensRef.current[targetIdxRef.current]
          const areaWidth = gameAreaRef.current?.clientWidth || 320
          return buildWave(target.display, verse.id, areaWidth, bubbleCount)
        } else {
          const withMissed = updated.map(b =>
            b.status === 'falling' && b.y > areaHeight ? { ...b, status: 'missed' } : b
          )
          if (!withMissed.some(b => b.status === 'falling')) {
            const verse = gameVersesRef.current[verseIndexRef.current]
            const target = tokensRef.current[targetIdxRef.current]
            const areaWidth = gameAreaRef.current?.clientWidth || 320
            return buildWave(target.display, verse.id, areaWidth, bubbleCount)
          }
          return withMissed
        }
      }
      return updated
    })

    rafRef.current = requestAnimationFrame(tick)
  }, []) // eslint-disable-line

  // ── Tap handler ──────────────────────────────────────────────────────────────
  function handleBubbleTap(bubble) {
    if (bubble.status !== 'falling') return

    if (bubble.isCorrect) {
      setBubbles(prev => prev.map(b => ({ ...b, status: b.id === bubble.id ? 'correct' : 'missed' })))

      // Combo
      const newCombo = comboRef.current + 1
      setCombo(newCombo)
      comboRef.current = newCombo

      // Points with multiplier
      const mult = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1
      const pts = 10 * mult
      const newScore = scoreRef.current + pts
      setScore(newScore)
      scoreRef.current = newScore

      wordsCorrectRef.current += 1

      // Verse panel flash
      setVersePanelFlash(true)
      setTimeout(() => setVersePanelFlash(false), 300)

      // Feedback pop
      let feedbackText
      if (newCombo === 5) feedbackText = 'ON FIRE! x3'
      else if (newCombo === 3) feedbackText = 'COMBO! x2'
      else feedbackText = FEEDBACK_WORDS[Math.floor(Math.random() * FEEDBACK_WORDS.length)]
      spawnFeedback(feedbackText, bubble.x + BUBBLE_WIDTH / 2, bubble.y)

      const nextTargetIdx = targetIdxRef.current + 1
      setTargetIdx(nextTargetIdx)
      targetIdxRef.current = nextTargetIdx

      if (nextTargetIdx >= tokensRef.current.length) {
        cancelAnimationFrame(rafRef.current)
        const cfg = DIFF_CONFIG[difficultyRef.current]
        const bonus = heartsRef.current === cfg.hearts ? 50 : 0
        if (bonus > 0) {
          spawnFeedback('PERFECT! +50', bubble.x + BUBBLE_WIDTH / 2, bubble.y - 30)
          const finalScore = newScore + bonus
          setScore(finalScore)
          scoreRef.current = finalScore
        }
        setTimeout(() => endVerse(true), 500)
      } else {
        setTimeout(() => {
          if (phaseRef.current !== 'playing') return
          const verse = gameVersesRef.current[verseIndexRef.current]
          const nextTarget = tokensRef.current[nextTargetIdx]
          const cfg = DIFF_CONFIG[difficultyRef.current]
          const isBoss = verseIndexRef.current === VERSES_PER_ROUND - 1
          const bubbleCount = isBoss ? Math.min(cfg.bubbles + 2, 6) : cfg.bubbles
          const areaWidth = gameAreaRef.current?.clientWidth || 320
          const newWave = buildWave(nextTarget.display, verse.id, areaWidth, bubbleCount)
          setBubbles(newWave)
        }, 350)
      }
    } else {
      // Wrong tap
      const newHearts = Math.max(0, heartsRef.current - 1)
      setHearts(newHearts)
      heartsRef.current = newHearts

      // Reset combo on wrong tap
      setCombo(0)
      comboRef.current = 0

      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, status: 'wrong' } : b))

      if (newHearts <= 0) {
        cancelAnimationFrame(rafRef.current)
        setTimeout(() => endVerse(false), 600)
      } else {
        // Only reset bubble to falling if the verse hasn't ended
        setTimeout(() => {
          setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, status: 'falling' } : b))
        }, 400)
      }
    }
  }

  // ── End verse ────────────────────────────────────────────────────────────────
  function endVerse(completed) {
    cancelAnimationFrame(rafRef.current)

    const verse = gameVersesRef.current[verseIndexRef.current]
    const newResult = {
      verse,
      completed,
      heartsLeft: heartsRef.current,
      wordsCorrect: wordsCorrectRef.current,
      totalWords: tokensRef.current.length,
    }

    const newResults = [...roundResultsRef.current, newResult]
    setRoundResults(newResults)
    roundResultsRef.current = newResults

    recordGameRound(verse.id, 'word_rain', completed)
      .then(data => setLatestStreak(data.streak))
      .catch(() => {})

    if (!completed) {
      setRevealVerse(verse)
      setPhase('verse_reveal')
      phaseRef.current = 'verse_reveal'
    } else {
      proceedToNextVerse()
    }
  }

  // ── Proceed to next verse ────────────────────────────────────────────────────
  function proceedToNextVerse() {
    const nextIdx = verseIndexRef.current + 1
    if (nextIdx >= VERSES_PER_ROUND) {
      setPhase('results')
      phaseRef.current = 'results'
      return
    }
    setVerseIndex(nextIdx)
    verseIndexRef.current = nextIdx

    if (nextIdx === VERSES_PER_ROUND - 1) {
      // Boss verse intro
      setPhase('boss_intro')
      phaseRef.current = 'boss_intro'
      setBubbles([])
      setTimeout(() => {
        initVerse(gameVersesRef.current[nextIdx], nextIdx)
      }, 1800)
    } else {
      initVerse(gameVersesRef.current[nextIdx], nextIdx)
    }
  }

  // ── Verse reveal countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'verse_reveal') return
    setRevealCountdown(3)
    let count = 3
    const timer = setInterval(() => {
      count--
      setRevealCountdown(count)
      if (count <= 0) {
        clearInterval(timer)
        proceedToNextVerse()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [phase]) // eslint-disable-line

  // ── Check high score on results ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return
    const src = sourceRef.current
    const diff = difficultyRef.current
    const finalScore = scoreRef.current
    const best = getHighScore(src, diff)
    if (finalScore > 0 && finalScore > best) {
      saveHighScore(src, diff, finalScore)
      setIsNewBest(true)
    }
  }, [phase]) // eslint-disable-line

  // ── Pause / resume ───────────────────────────────────────────────────────────
  function handlePause() {
    cancelAnimationFrame(rafRef.current)
    setPaused(true)
    pausedRef.current = true
  }

  function handleResume() {
    setPaused(false)
    pausedRef.current = false
    rafRef.current = requestAnimationFrame(tick)
  }

  // ── Visibility change ────────────────────────────────────────────────────────
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current)
      } else if (phaseRef.current === 'playing' && !pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [tick])

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // ── Play again ───────────────────────────────────────────────────────────────
  function playAgain() {
    cancelAnimationFrame(rafRef.current)
    setPhase('source_select')
    phaseRef.current = 'source_select'
    setSource(null)
    sourceRef.current = null
    setGameVerses([])
    setBubbles([])
    setRoundResults([])
    setCombo(0)
    comboRef.current = 0
    setFeedbackPops([])
    setPaused(false)
    pausedRef.current = false
    setRevealVerse(null)
    setIsNewBest(false)
    wordsCorrectRef.current = 0
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentVerse = gameVerses[verseIndex]
  const isBossVerse = verseIndex === VERSES_PER_ROUND - 1
  const cfg = DIFF_CONFIG[difficulty]
  const completedCount = roundResults.filter(r => r.completed).length
  const multiplier = combo >= 5 ? 3 : combo >= 3 ? 2 : 1

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="wr-container">

      {/* ── Header ── */}
      <div className="wr-header">
        <button className="wr-back-btn" onClick={() => { cancelAnimationFrame(rafRef.current); navigate(-1) }}>
          <ArrowLeft size={20} />
        </button>
        <span className="wr-title">{isBossVerse && phase === 'playing' ? '⚡ Boss Verse' : 'Word Rain'}</span>
        <div className="wr-header-right">
          {phase === 'playing' && (
            <>
              <span className="wr-score">{score} pts</span>
              <button className="wr-pause-btn" onClick={handlePause}>
                <Pause size={18} />
              </button>
            </>
          )}
          {phase !== 'playing' && <span className="wr-header-spacer" />}
        </div>
      </div>

      {/* ================================================================== */}
      {/* SOURCE SELECT                                                        */}
      {/* ================================================================== */}
      {phase === 'source_select' && (
        <div className="wr-source-wrap">
          <p className="wr-source-subtitle">Choose your verses</p>

          {/* Difficulty pills */}
          <div className="wr-difficulty-pills">
            {Object.entries(DIFF_CONFIG).map(([key, val]) => (
              <button
                key={key}
                className={`wr-difficulty-pill ${difficulty === key ? 'active' : ''}`}
                onClick={() => setDifficulty(key)}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* How to Play */}
          <div className="wr-how-to">
            <div className="wr-how-to-title">How to Play</div>
            <div className="wr-how-to-row">
              <span className="wr-how-to-icon">📖</span>
              <span>The full verse appears at the top. One word is highlighted — that's your target.</span>
            </div>
            <div className="wr-how-to-row">
              <span className="wr-how-to-icon">🌧️</span>
              <span>{cfg.bubbles} words rain down — one is correct, the rest are decoys. Tap the right one!</span>
            </div>
            <div className="wr-how-to-row">
              <span className="wr-how-to-icon">❤️</span>
              <span>You have {cfg.hearts} heart{cfg.hearts !== 1 ? 's' : ''} per verse. Wrong taps or missed words cost a heart.</span>
            </div>
            <div className="wr-how-to-row">
              <span className="wr-how-to-icon">🔥</span>
              <span>Chain correct taps for a combo multiplier — hit 3 in a row for x2, 5 for x3!</span>
            </div>
            <div className="wr-how-to-row">
              <span className="wr-how-to-icon">⚡</span>
              <span>The 5th verse is always a Boss Verse — harder, faster, and more decoys!</span>
            </div>
          </div>

          {/* Category cards */}
          <div className="game-source-grid">
            {bookmarkCount > 0 && (
              <div
                className={`game-source-card ${source === 'bookmarks' ? 'selected' : ''}`}
                onClick={() => setSource('bookmarks')}
              >
                <div className="game-source-title">My Bookmarks</div>
                <div className="game-source-desc">{bookmarkCount} saved verse{bookmarkCount !== 1 ? 's' : ''}</div>
                {getHighScore('bookmarks', difficulty) > 0 && (
                  <div className="wr-card-best">Best: {getHighScore('bookmarks', difficulty)} pts</div>
                )}
              </div>
            )}
            {categories.map(cat => {
              const count = scriptureVerses.filter(v => v.category === cat).length
              const best = getHighScore(cat, difficulty)
              return (
                <div
                  key={cat}
                  className={`game-source-card ${source === cat ? 'selected' : ''}`}
                  onClick={() => setSource(cat)}
                >
                  <div className="game-source-title">{cat}</div>
                  <div className="game-source-desc">{count} verse{count !== 1 ? 's' : ''}</div>
                  {best > 0 && <div className="wr-card-best">Best: {best} pts</div>}
                </div>
              )
            })}
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={startGame}
            disabled={!source}
          >
            Start Game
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* BOSS INTRO                                                           */}
      {/* ================================================================== */}
      {phase === 'boss_intro' && (
        <div className="wr-boss-intro">
          <div className="wr-boss-icon">⚡</div>
          <div className="wr-boss-title">BOSS VERSE</div>
          <div className="wr-boss-ref">{gameVerses[verseIndex]?.reference}</div>
          <div className="wr-boss-subtitle">More decoys. Faster drops. Good luck.</div>
        </div>
      )}

      {/* ================================================================== */}
      {/* VERSE REVEAL (after failure)                                         */}
      {/* ================================================================== */}
      {phase === 'verse_reveal' && revealVerse && (
        <div className="wr-reveal">
          <div className="wr-reveal-label">Keep practicing!</div>
          <div className="wr-reveal-ref">{revealVerse.reference}</div>
          <div className="wr-reveal-text">"{revealVerse.text}"</div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={proceedToNextVerse}>
            Got it
          </button>
          <div className="wr-reveal-countdown">Continuing in {revealCountdown}…</div>
        </div>
      )}

      {/* ================================================================== */}
      {/* PLAYING                                                              */}
      {/* ================================================================== */}
      {phase === 'playing' && currentVerse && (
        <div className="wr-playing">
          {/* Status bar */}
          <div className="wr-status-bar">
            <div className="wr-hearts">
              {Array.from({ length: cfg.hearts }).map((_, i) => (
                <Heart
                  key={i}
                  size={18}
                  className={`wr-heart ${i < hearts ? 'wr-heart-full' : 'wr-heart-empty'}`}
                  fill={i < hearts ? 'var(--accent-burgundy)' : 'none'}
                />
              ))}
              {combo >= 3 && (
                <span className="wr-combo-badge">🔥 x{multiplier}</span>
              )}
            </div>
            <div className="wr-progress">
              {gameVerses.map((_, i) => (
                <div
                  key={i}
                  className={`wr-progress-dot ${i === verseIndex ? 'active' : i < verseIndex ? 'done' : ''} ${i === VERSES_PER_ROUND - 1 ? 'boss' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Verse panel */}
          <div className={`wr-verse-panel ${versePanelFlash ? 'flash' : ''} ${isBossVerse ? 'boss' : ''}`}>
            <div className="wr-verse-ref">{currentVerse.reference}</div>
            <div className="wr-verse-text">
              {tokens.map((tok, i) => {
                let cls = 'wr-word'
                if (i < targetIdx) cls += ' wr-word-done'
                else if (i === targetIdx) cls += ' wr-word-target'
                return <span key={i} className={cls}>{tok.raw} </span>
              })}
            </div>
          </div>

          {/* Falling area */}
          <div className="wr-game-area" ref={gameAreaRef}>
            {bubbles.map(bubble => (
              <button
                key={bubble.id}
                className={`wr-bubble wr-bubble-${bubble.status}`}
                style={{ left: bubble.x, top: bubble.y }}
                onClick={() => handleBubbleTap(bubble)}
                disabled={bubble.status !== 'falling'}
              >
                {bubble.display}
              </button>
            ))}

            {feedbackPops.map(pop => (
              <div
                key={pop.id}
                className="wr-feedback-pop"
                style={{ left: pop.x, top: pop.y }}
              >
                {pop.text}
              </div>
            ))}
          </div>

          {/* Pause overlay */}
          {paused && (
            <div className="wr-pause-overlay">
              <div className="wr-pause-title">Paused</div>
              <button className="btn-primary" onClick={handleResume}>
                <Play size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Resume
              </button>
              <button className="btn-secondary" onClick={() => { cancelAnimationFrame(rafRef.current); navigate(-1) }}>
                Quit Game
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* RESULTS                                                              */}
      {/* ================================================================== */}
      {phase === 'results' && (
        <div className="wr-results">
          {isNewBest && <div className="wr-new-best">NEW BEST!</div>}
          <div className="wr-results-score">{score}</div>
          <div className="wr-results-label">points</div>

          <div className="wr-results-verses">
            {completedCount}/{VERSES_PER_ROUND} verses completed
          </div>

          <div className="wr-results-message">
            {completedCount === VERSES_PER_ROUND
              ? 'Perfect round! The Word is in you!'
              : completedCount >= Math.ceil(VERSES_PER_ROUND / 2)
                ? 'Great job! Keep raining down the Word!'
                : 'Good effort! Every verse practiced is a seed planted.'
            }
          </div>

          {latestStreak.current > 0 && (
            <div className="wr-results-streak">
              <Flame size={16} />
              {latestStreak.current} day study streak
            </div>
          )}

          <div className="wr-results-list">
            {roundResults.map((r, i) => (
              <div key={i} className={`wr-result-row ${r.completed ? 'done' : 'failed'}`}>
                <span className="wr-result-ref">
                  {i === VERSES_PER_ROUND - 1 && '⚡ '}{r.verse.reference}
                </span>
                <span className="wr-result-words">
                  {r.completed ? '✓' : '✗'} {r.wordsCorrect}/{r.totalWords} words
                </span>
              </div>
            ))}
          </div>

          <div className="wr-results-actions">
            <button className="btn-primary" onClick={playAgain}>
              <RotateCcw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Play Again
            </button>
            <button className="btn-secondary" onClick={() => navigate('/more')}>
              Back to More
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WordRain
