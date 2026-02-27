// =============================================================================
// CALENDAR VIEW SCREEN
// =============================================================================
// A visual monthly calendar showing appointments as colored dots.
// Tap a day to see that day's sessions in a detail panel below.
// Navigate months with arrow buttons.

import './Appointments.css'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card, Badge, Avatar } from '../common'
import { ArrowLeft, ChevronLeft, ChevronRight, Repeat } from 'lucide-react'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarView() {
  const navigate = useNavigate()
  const { appointments, user } = useApp()
  const isSeeker = user?.role?.toLowerCase() === 'seeker'

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split('T')[0]
  )

  // Build a map of date -> appointments for the current month
  const appointmentsByDate = useMemo(() => {
    const map = {}
    for (const apt of appointments) {
      if (!map[apt.date]) map[apt.date] = []
      map[apt.date].push(apt)
    }
    return map
  }, [appointments])

  // Calculate the days to render in the calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startOffset = firstDay.getDay() // 0=Sun, 6=Sat

    const days = []

    // Empty cells before the 1st
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }

    // Actual days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        date: dateStr,
        isToday: dateStr === today.toISOString().split('T')[0],
        appointments: appointmentsByDate[dateStr] || []
      })
    }

    return days
  }, [currentYear, currentMonth, appointmentsByDate])

  // Get appointments for the selected date
  const selectedDayAppointments = appointmentsByDate[selectedDate] || []

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  function formatTime(time) {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  // Dot color based on appointment status
  function dotColor(status) {
    if (status === 'confirmed') return 'var(--accent-gold)'
    if (status === 'completed') return 'var(--accent-gold-text)'
    if (status === 'declined') return 'var(--accent-burgundy)'
    return 'var(--accent-gold)'
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700', flex: 1, textAlign: 'center' }}>
            Calendar
          </h1>
          <div className="header-spacer" />
        </div>
      </div>

      <div className="screen-content">
        {/* Month Navigation */}
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <span className="cal-month-label">{monthName}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="cal-grid">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="cal-dow">{d}</div>
          ))}

          {/* Calendar cells */}
          {calendarDays.map((cell, i) => {
            if (!cell) {
              return <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />
            }

            const isSelected = cell.date === selectedDate
            const hasApts = cell.appointments.length > 0

            return (
              <button
                key={cell.date}
                className={`cal-cell ${cell.isToday ? 'cal-cell-today' : ''} ${isSelected ? 'cal-cell-selected' : ''}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span className="cal-day-num">{cell.day}</span>
                {hasApts && (
                  <div className="cal-dots">
                    {cell.appointments.slice(0, 3).map((apt, j) => (
                      <span
                        key={j}
                        className="cal-dot"
                        style={{ background: dotColor(apt.status) }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Day Detail */}
        <div className="cal-detail-section">
          <div className="cal-detail-header">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          {selectedDayAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
              No sessions on this day
            </div>
          ) : (
            selectedDayAppointments.map(apt => (
              <Card key={apt.id}>
                <div className="apt-row">
                  <Avatar src={isSeeker ? apt.guidePhoto : apt.seekerPhoto} emoji={apt.avatar} size="sm" variant="blue" />
                  <div className="apt-info">
                    <div className="apt-header">
                      <span className="apt-name" style={{ fontSize: '14px' }}>
                        {isSeeker ? (apt.guideName || apt.seekerName) : apt.seekerName}
                      </span>
                      <Badge status={apt.status} />
                    </div>
                    <div className="apt-meta" style={{ fontSize: '12px' }}>
                      {formatTime(apt.time)} • {apt.duration} min • {apt.type}
                    </div>
                    {apt.recurrenceRule && apt.recurrenceRule !== 'none' && (
                      <div className="apt-recurrence-tag">
                        <Repeat size={10} />
                        {apt.recurrenceRule === 'weekly' ? 'Weekly' : apt.recurrenceRule === 'biweekly' ? 'Biweekly' : 'Monthly'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CalendarView
