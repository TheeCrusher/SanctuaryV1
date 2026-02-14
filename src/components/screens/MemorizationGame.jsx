// =============================================================================
// MEMORIZATION GAME SCREEN
// =============================================================================
// Interactive scripture memorization with 3 modes:
//   - fill_blank: Fill in missing words from a word bank
//   - scramble: Reorder shuffled words to rebuild a verse
//   - flashcard: See reference, try to recall, reveal, self-rate
//
// Flow: Source Select → Playing → Results
// Route: /scripture/game/:mode

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Flame, RotateCcw } from 'lucide-react'

// Words to skip when choosing blanks (common/uninteresting words)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'am',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'it', 'its', 'he', 'she', 'his', 'her', 'my', 'we', 'our',
  'us', 'not', 'no', 'do', 'does', 'did', 'has', 'have', 'had',
  'will', 'who', 'whom', 'that', 'this', 'those', 'them', 'they',
  'i', 'me', 'you', 'your', 'so', 'as', 'if', 'all', 'from'
])

const MODE_TITLES = {
  fill_blank: 'Fill in the Blank',
  scramble: 'Verse Scramble',
  flashcard: 'Flash Cards'
}

const VERSES_PER_ROUND = 5

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function MemorizationGame() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    scriptureVerses,
    scriptureBookmarkIds,
    recordGameRound,
    memorizationStats
  } = useApp()

  // Game flow state
  const [phase, setPhase] = useState('source_select') // source_select | playing | results
  const [source, setSource] = useState(null) // 'bookmarks' or category name
  const [gameVerses, setGameVerses] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [latestStreak, setLatestStreak] = useState(memorizationStats.streak)

  // Fill in the Blank state
  const [blanks, setBlanks] = useState([])          // Array of { index, word, filled: string|null }
  const [wordBank, setWordBank] = useState([])       // Array of { word, used: boolean, isDecoy: boolean }
  const [blankChecked, setBlankChecked] = useState(false)

  // Scramble state
  const [scrambledWords, setScrambledWords] = useState([]) // { word, used: boolean }
  const [answerWords, setAnswerWords] = useState([])        // words placed in order
  const [scrambleChecked, setScrambleChecked] = useState(false)

  // Flashcard state
  const [revealed, setRevealed] = useState(false)

  // Available categories from verses
  const categories = useMemo(() => {
    const cats = new Set(scriptureVerses.map(v => v.category))
    return [...cats].sort()
  }, [scriptureVerses])

  // Bookmarked verse count
  const bookmarkCount = scriptureBookmarkIds.size

  // ============================
  // START GAME
  // ============================
  function startGame() {
    let pool = []

    if (source === 'bookmarks') {
      pool = scriptureVerses.filter(v => scriptureBookmarkIds.has(v.id))
    } else {
      pool = scriptureVerses.filter(v => v.category === source)
    }

    if (pool.length === 0) {
      showToast('No verses available for this selection', 'error')
      return
    }

    // For scramble mode, prefer shorter verses
    if (mode === 'scramble') {
      const shortVerses = pool.filter(v => v.text.split(/\s+/).length <= 20)
      if (shortVerses.length >= 3) pool = shortVerses
    }

    // Shuffle and take up to VERSES_PER_ROUND
    const selected = shuffleArray(pool).slice(0, VERSES_PER_ROUND)
    setGameVerses(selected)
    setCurrentIndex(0)
    setScore({ correct: 0, total: 0 })
    setPhase('playing')

    // Initialize first verse for the mode
    initializeVerse(selected[0])
  }

  function initializeVerse(verse) {
    if (mode === 'fill_blank') initFillBlank(verse)
    else if (mode === 'scramble') initScramble(verse)
    else if (mode === 'flashcard') setRevealed(false)
  }

  // ============================
  // FILL IN THE BLANK LOGIC
  // ============================
  function initFillBlank(verse) {
    const words = verse.text.split(/\s+/)
    // Find content words (not stop words, at least 3 chars)
    const candidates = []
    words.forEach((w, i) => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase()
      if (clean.length >= 3 && !STOP_WORDS.has(clean)) {
        candidates.push({ index: i, word: w })
      }
    })

    // Pick 3-5 random blanks
    const numBlanks = Math.min(Math.max(3, Math.floor(candidates.length * 0.4)), 5)
    const selectedBlanks = shuffleArray(candidates).slice(0, numBlanks)
      .sort((a, b) => a.index - b.index)

    setBlanks(selectedBlanks.map(b => ({ ...b, filled: null })))

    // Create word bank: blanked words + 2 decoy words
    const blankWords = selectedBlanks.map(b => b.word)
    // Pick decoys from the same verse's non-blank content words
    const decoys = candidates
      .filter(c => !selectedBlanks.find(b => b.index === c.index))
      .slice(0, 2)
      .map(d => d.word)

    setWordBank(shuffleArray([...blankWords, ...decoys]).map(w => ({ word: w, used: false })))
    setBlankChecked(false)
  }

  function handleWordBankTap(wordIndex) {
    // Find next empty blank
    const nextBlankIdx = blanks.findIndex(b => b.filled === null)
    if (nextBlankIdx === -1) return

    setBlanks(prev => prev.map((b, i) =>
      i === nextBlankIdx ? { ...b, filled: wordBank[wordIndex].word } : b
    ))
    setWordBank(prev => prev.map((w, i) =>
      i === wordIndex ? { ...w, used: true } : w
    ))
  }

  function handleBlankTap(blankIndex) {
    if (blankChecked) return
    const blank = blanks[blankIndex]
    if (!blank.filled) return

    // Return word to bank
    const bankIdx = wordBank.findIndex(w => w.word === blank.filled && w.used)
    setWordBank(prev => prev.map((w, i) =>
      i === bankIdx ? { ...w, used: false } : w
    ))
    setBlanks(prev => prev.map((b, i) =>
      i === blankIndex ? { ...b, filled: null } : b
    ))
  }

  function checkFillBlank() {
    setBlankChecked(true)
    const allCorrect = blanks.every(b => {
      // Compare cleaned versions (strip punctuation for comparison)
      const filledClean = (b.filled || '').replace(/[^a-zA-Z]/g, '').toLowerCase()
      const wordClean = b.word.replace(/[^a-zA-Z]/g, '').toLowerCase()
      return filledClean === wordClean
    })

    const verse = gameVerses[currentIndex]
    recordGameRound(verse.id, 'fill_blank', allCorrect)
      .then(data => setLatestStreak(data.streak))
      .catch(() => {})

    setScore(prev => ({
      correct: prev.correct + (allCorrect ? 1 : 0),
      total: prev.total + 1
    }))
  }

  // ============================
  // VERSE SCRAMBLE LOGIC
  // ============================
  function initScramble(verse) {
    const words = verse.text.split(/\s+/)
    // Shuffle until it's actually different from original
    let shuffled = shuffleArray(words)
    let attempts = 0
    while (shuffled.join(' ') === words.join(' ') && attempts < 10) {
      shuffled = shuffleArray(words)
      attempts++
    }
    setScrambledWords(shuffled.map(w => ({ word: w, used: false })))
    setAnswerWords([])
    setScrambleChecked(false)
  }

  function handleScrambleTap(wordIndex) {
    if (scrambleChecked) return
    setAnswerWords(prev => [...prev, scrambledWords[wordIndex].word])
    setScrambledWords(prev => prev.map((w, i) =>
      i === wordIndex ? { ...w, used: true } : w
    ))
  }

  function handleAnswerWordTap(answerIndex) {
    if (scrambleChecked) return
    const word = answerWords[answerIndex]
    // Find the first matching used word in scrambled bank
    const bankIdx = scrambledWords.findIndex(w => w.word === word && w.used)
    setScrambledWords(prev => prev.map((w, i) =>
      i === bankIdx ? { ...w, used: false } : w
    ))
    setAnswerWords(prev => prev.filter((_, i) => i !== answerIndex))
  }

  function checkScramble() {
    setScrambleChecked(true)
    const verse = gameVerses[currentIndex]
    const originalWords = verse.text.split(/\s+/)
    const isCorrect = answerWords.length === originalWords.length &&
      answerWords.every((w, i) => w === originalWords[i])

    recordGameRound(verse.id, 'scramble', isCorrect)
      .then(data => setLatestStreak(data.streak))
      .catch(() => {})

    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))
  }

  // ============================
  // FLASHCARD LOGIC
  // ============================
  function handleFlashcardRate(gotIt) {
    const verse = gameVerses[currentIndex]
    recordGameRound(verse.id, 'flashcard', gotIt)
      .then(data => setLatestStreak(data.streak))
      .catch(() => {})

    setScore(prev => ({
      correct: prev.correct + (gotIt ? 1 : 0),
      total: prev.total + 1
    }))

    goToNext()
  }

  // ============================
  // NAVIGATION
  // ============================
  function goToNext() {
    const nextIdx = currentIndex + 1
    if (nextIdx >= gameVerses.length) {
      setPhase('results')
    } else {
      setCurrentIndex(nextIdx)
      initializeVerse(gameVerses[nextIdx])
    }
  }

  function handleNextAfterCheck() {
    goToNext()
  }

  function playAgain() {
    setPhase('source_select')
    setSource(null)
    setGameVerses([])
    setCurrentIndex(0)
    setScore({ correct: 0, total: 0 })
  }

  // ============================
  // RENDER
  // ============================
  const currentVerse = gameVerses[currentIndex]

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/scripture')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-title">{MODE_TITLES[mode] || 'Game'}</h1>
        <div style={{ width: '40px' }} />
      </div>

      <div className="screen-content">
        {/* ============================================================ */}
        {/* SOURCE SELECTION */}
        {/* ============================================================ */}
        {phase === 'source_select' && (
          <div>
            <div className="game-screen-header">
              <p className="game-screen-subtitle">Choose your verses to practice with</p>
            </div>

            <div className="game-source-grid">
              {bookmarkCount > 0 && (
                <div
                  className={`game-source-card ${source === 'bookmarks' ? 'selected' : ''}`}
                  onClick={() => setSource('bookmarks')}
                >
                  <div className="game-source-title">My Bookmarks</div>
                  <div className="game-source-desc">{bookmarkCount} saved verse{bookmarkCount !== 1 ? 's' : ''}</div>
                </div>
              )}

              {categories.map(cat => {
                const count = scriptureVerses.filter(v => v.category === cat).length
                return (
                  <div
                    key={cat}
                    className={`game-source-card ${source === cat ? 'selected' : ''}`}
                    onClick={() => setSource(cat)}
                  >
                    <div className="game-source-title">{cat}</div>
                    <div className="game-source-desc">{count} verse{count !== 1 ? 's' : ''}</div>
                  </div>
                )
              })}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={startGame}
              disabled={!source}
            >
              Start Game
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PLAYING — FILL IN THE BLANK */}
        {/* ============================================================ */}
        {phase === 'playing' && mode === 'fill_blank' && currentVerse && (
          <div>
            {/* Progress dots */}
            <div className="game-progress">
              {gameVerses.map((_, i) => (
                <div
                  key={i}
                  className={`game-progress-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}
                />
              ))}
            </div>

            <div className="game-verse-ref">{currentVerse.reference}</div>

            {/* Verse with blanks */}
            <div className="game-verse-display">
              {currentVerse.text.split(/\s+/).map((word, i) => {
                const blankEntry = blanks.find(b => b.index === i)
                if (blankEntry) {
                  let className = 'game-blank'
                  if (blankEntry.filled) className += ' filled'
                  if (blankChecked && blankEntry.filled) {
                    const filledClean = blankEntry.filled.replace(/[^a-zA-Z]/g, '').toLowerCase()
                    const wordClean = blankEntry.word.replace(/[^a-zA-Z]/g, '').toLowerCase()
                    className += filledClean === wordClean ? ' correct' : ' incorrect'
                  }
                  return (
                    <span key={i}>
                      <span
                        className={className}
                        onClick={() => handleBlankTap(blanks.indexOf(blankEntry))}
                      >
                        {blankEntry.filled || '\u00A0\u00A0\u00A0\u00A0\u00A0'}
                      </span>
                      {' '}
                    </span>
                  )
                }
                return <span key={i}>{word} </span>
              })}
            </div>

            {/* Word bank */}
            {!blankChecked && (
              <div className="game-word-bank">
                {wordBank.map((w, i) => (
                  <button
                    key={i}
                    className={`game-word-chip ${w.used ? 'used' : ''}`}
                    onClick={() => handleWordBankTap(i)}
                  >
                    {w.word}
                  </button>
                ))}
              </div>
            )}

            {/* Check / Next buttons */}
            {!blankChecked ? (
              <button
                className="game-check-btn"
                onClick={checkFillBlank}
                disabled={blanks.some(b => b.filled === null)}
              >
                Check Answer
              </button>
            ) : (
              <div>
                <div className={`game-verse-feedback ${blanks.every(b => {
                  const fc = (b.filled || '').replace(/[^a-zA-Z]/g, '').toLowerCase()
                  const wc = b.word.replace(/[^a-zA-Z]/g, '').toLowerCase()
                  return fc === wc
                }) ? 'correct' : 'incorrect'}`}>
                  {blanks.every(b => {
                    const fc = (b.filled || '').replace(/[^a-zA-Z]/g, '').toLowerCase()
                    const wc = b.word.replace(/[^a-zA-Z]/g, '').toLowerCase()
                    return fc === wc
                  }) ? 'Correct! Great job!' : 'Not quite — keep practicing!'}
                </div>
                <button className="game-check-btn" onClick={handleNextAfterCheck}>
                  {currentIndex < gameVerses.length - 1 ? 'Next Verse' : 'See Results'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PLAYING — VERSE SCRAMBLE */}
        {/* ============================================================ */}
        {phase === 'playing' && mode === 'scramble' && currentVerse && (
          <div>
            {/* Progress dots */}
            <div className="game-progress">
              {gameVerses.map((_, i) => (
                <div
                  key={i}
                  className={`game-progress-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}
                />
              ))}
            </div>

            <div className="game-verse-ref">{currentVerse.reference}</div>

            {/* Answer area (where placed words go) */}
            <div className="game-answer-area">
              {answerWords.length === 0 && (
                <span style={{ color: 'var(--text-faint)', fontSize: '14px' }}>
                  Tap words below to build the verse...
                </span>
              )}
              {answerWords.map((w, i) => (
                <span
                  key={i}
                  className="game-answer-word"
                  onClick={() => handleAnswerWordTap(i)}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* Scrambled word bank */}
            {!scrambleChecked && (
              <div className="game-word-bank">
                {scrambledWords.map((w, i) => (
                  <button
                    key={i}
                    className={`game-word-chip ${w.used ? 'used' : ''}`}
                    onClick={() => handleScrambleTap(i)}
                  >
                    {w.word}
                  </button>
                ))}
              </div>
            )}

            {/* Check / Next buttons */}
            {!scrambleChecked ? (
              <button
                className="game-check-btn"
                onClick={checkScramble}
                disabled={scrambledWords.some(w => !w.used)}
              >
                Check Answer
              </button>
            ) : (
              <div>
                <div className={`game-verse-feedback ${
                  answerWords.join(' ') === currentVerse.text.split(/\s+/).join(' ') ? 'correct' : 'incorrect'
                }`}>
                  {answerWords.join(' ') === currentVerse.text.split(/\s+/).join(' ')
                    ? 'Perfect! You nailed it!'
                    : 'Not quite — here\'s the correct order:'
                  }
                </div>
                {answerWords.join(' ') !== currentVerse.text.split(/\s+/).join(' ') && (
                  <div className="game-verse-display" style={{ fontSize: '14px', minHeight: 'auto', padding: '16px' }}>
                    {currentVerse.text}
                  </div>
                )}
                <button className="game-check-btn" onClick={handleNextAfterCheck}>
                  {currentIndex < gameVerses.length - 1 ? 'Next Verse' : 'See Results'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PLAYING — FLASH CARDS */}
        {/* ============================================================ */}
        {phase === 'playing' && mode === 'flashcard' && currentVerse && (
          <div>
            {/* Progress dots */}
            <div className="game-progress">
              {gameVerses.map((_, i) => (
                <div
                  key={i}
                  className={`game-progress-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}
                />
              ))}
            </div>

            <div className="flashcard">
              <div className="flashcard-reference">{currentVerse.reference}</div>
              {!revealed ? (
                <>
                  <div className="flashcard-hint">Try to recall this verse...</div>
                  <button className="flashcard-reveal-btn" onClick={() => setRevealed(true)}>
                    Reveal Verse
                  </button>
                </>
              ) : (
                <p className="flashcard-text">"{currentVerse.text}"</p>
              )}
            </div>

            {revealed && (
              <div className="game-rating-buttons">
                <button className="game-btn-got-it" onClick={() => handleFlashcardRate(true)}>
                  Got it!
                </button>
                <button className="game-btn-learning" onClick={() => handleFlashcardRate(false)}>
                  Still learning
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* RESULTS */}
        {/* ============================================================ */}
        {phase === 'results' && (
          <div className="game-results">
            <div className="game-results-score">{score.correct}/{score.total}</div>
            <div className="game-results-label">verses correct</div>

            <div className="game-results-message">
              {score.correct === score.total
                ? 'Perfect score! Amazing!'
                : score.correct >= score.total / 2
                  ? 'Great job! Keep it up!'
                  : 'Good effort! Practice makes perfect!'
              }
            </div>

            {latestStreak.current > 0 && (
              <div className="game-results-streak">
                <Flame size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                {latestStreak.current} day study streak
              </div>
            )}

            <div className="game-results-actions">
              <button className="btn-primary" onClick={playAgain}>
                <RotateCcw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Play Again
              </button>
              <button className="btn-secondary" onClick={() => navigate('/scripture')}>
                Back to Scripture
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemorizationGame
