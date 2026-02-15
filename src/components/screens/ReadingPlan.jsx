// =============================================================================
// READING PLAN DETAIL SCREEN
// =============================================================================
// Shows a specific reading plan with day-by-day list.
// Users can track progress by marking days as complete.
// Accessed via Scripture > [Plan Name].

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { LoadingSpinner } from '../common'

function ReadingPlan() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getReadingPlanDetail, getReadingProgress, markDayComplete } = useApp()

  const [plan, setPlan] = useState(null)
  const [completedDays, setCompletedDays] = useState([])
  const [expandedDay, setExpandedDay] = useState(null)
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
        console.error('Failed to load plan:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [id])

  async function handleMarkComplete(dayNumber) {
    if (completedDays.includes(dayNumber)) return // Already done

    try {
      const progressData = await markDayComplete(id, dayNumber)
      setCompletedDays(progressData.completedDays || [])
    } catch (error) {
      console.error('Failed to mark day complete:', error)
    }
  }

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
          const isExpanded = expandedDay === day.dayNumber

          return (
            <div key={day.dayNumber}>
              <div
                className="plan-day-item"
                onClick={() => setExpandedDay(isExpanded ? null : day.dayNumber)}
              >
                <div className={`plan-day-number ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted ? <Check size={18} /> : day.dayNumber}
                </div>
                <div className="plan-day-info">
                  <div className="plan-day-title">{day.title}</div>
                  <div className="plan-day-ref">{day.reference}</div>
                </div>
                {isExpanded
                  ? <ChevronDown size={20} style={{ color: 'var(--text-faint)' }} />
                  : <ChevronRight size={20} style={{ color: 'var(--text-faint)' }} />
                }
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '12px 0 12px 48px' }}>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '12px'
                  }}>
                    Read <strong>{day.reference}</strong> and reflect on what God is saying to you through this passage.
                  </p>
                  {!isCompleted && (
                    <button
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkComplete(day.dayNumber)
                      }}
                    >
                      <Check
                        size={16}
                        style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}
                      />
                      Mark as Complete
                    </button>
                  )}
                  {isCompleted && (
                    <div style={{
                      color: 'var(--badge-confirmed-text)',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Check size={16} /> Completed
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReadingPlan
