// =============================================================================
// READING PLAN DETAIL SCREEN
// =============================================================================
// Shows a specific reading plan with day-by-day list.
// Users can track progress by marking days as complete.
// Accessed via Scripture > [Plan Name].

import './Scripture.css'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { ArrowLeft, Check, ChevronRight, BookOpen } from 'lucide-react'
import { LoadingSpinner } from '../common'

// Parse "John 1:1-end" or "1 Corinthians 13:4-7" → { book: "John", chapter: 1 }
function parseRef(reference) {
  const match = reference.match(/^(.*?)\s+(\d+)/)
  if (!match) return null
  return { book: match[1], chapter: parseInt(match[2]) }
}

function ReadingPlan() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getReadingPlanDetail, getReadingProgress } = useApp()

  const [plan, setPlan] = useState(null)
  const [completedDays, setCompletedDays] = useState([])
  const [loading, setLoading] = useState(true)

  // Load plan detail and progress on mount
  useEffect(() => {
    async function loadPlan() {
      try {
        const [planData, progressData] = await Promise.all([
          getReadingPlanDetail(id),
          getReadingProgress(id)
        ])
        setPlan(planData)
        setCompletedDays(progressData.completedDays || [])
      } catch (error) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [id])

  if (loading) {
    return (
      <div className="screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => navigate('/scripture')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="screen-title">Plan Not Found</h1>
        </div>
      </div>
    )
  }

  const progressPercent = plan.totalDays > 0
    ? Math.round((completedDays.length / plan.totalDays) * 100)
    : 0

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/scripture')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-title" style={{ fontSize: '18px' }}>{plan.name}</h1>
        <div className="header-spacer" />
      </div>

      <div className="screen-content">
        {/* Plan Description */}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6', fontSize: '15px' }}>
          {plan.description}
        </p>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div className="plan-progress-bar">
            <div
              className="plan-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="plan-progress-text">
            {completedDays.length} of {plan.totalDays} days completed ({progressPercent}%)
          </div>
        </div>

        {/* Days List */}
        {plan.days && plan.days.map(day => {
          const isCompleted = completedDays.includes(day.dayNumber)
          const parsed = parseRef(day.reference)

          function openInBible() {
            if (!parsed) return
            const nextDay = plan.days.find(d => d.dayNumber === day.dayNumber + 1)
            const nextParsed = nextDay ? parseRef(nextDay.reference) : null
            const params = new URLSearchParams({
              planId: id,
              dayNumber: day.dayNumber,
              book: parsed.book,
              chapter: parsed.chapter,
              backTo: `/scripture/plan/${id}`
            })
            if (nextParsed) {
              params.set('nextBook', nextParsed.book)
              params.set('nextChapter', nextParsed.chapter)
              params.set('nextDayNumber', nextDay.dayNumber)
            }
            navigate(`/bibles/reader?${params.toString()}`)
          }

          return (
            <div key={day.dayNumber} className="plan-day-item" onClick={openInBible}>
              <div className={`plan-day-number ${isCompleted ? 'completed' : ''}`}>
                {isCompleted ? <Check size={18} /> : day.dayNumber}
              </div>
              <div className="plan-day-info">
                <div className="plan-day-title">{day.title}</div>
                <div className="plan-day-ref">{day.reference}</div>
              </div>
              {parsed
                ? <BookOpen size={18} style={{ color: 'var(--accent-gold-text)', flexShrink: 0 }} />
                : <ChevronRight size={20} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReadingPlan
