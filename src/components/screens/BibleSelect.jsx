// =============================================================================
// BIBLE SELECT SCREEN
// =============================================================================
// Shows a list of available Bible translations. Tapping one opens
// the Bible Reader. Currently only KJV is available.
// Accessed from: More menu → "Bibles"

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Book, ChevronRight, Plus } from 'lucide-react'

function BibleSelect() {
  const navigate = useNavigate()

  // List of available Bible translations
  const bibles = [
    {
      id: 'kjv',
      name: 'King James Version',
      abbrev: 'KJV',
      description: 'Traditional English translation (1611)',
      available: true
    }
  ]

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/more')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="screen-title">Bibles</h1>
      </div>

      <div className="screen-content">
        {/* Available Bibles */}
        {bibles.map((bible) => (
          <button
            key={bible.id}
            className="bible-select-card"
            onClick={() => navigate('/bibles/reader')}
          >
            <div className="bible-select-card-left">
              <span className="bible-select-card-icon">
                <Book size={24} />
              </span>
              <div>
                <div className="bible-select-card-name">{bible.name}</div>
                <div className="bible-select-card-desc">{bible.description}</div>
              </div>
            </div>
            <div className="bible-select-card-right">
              <span className="bible-select-abbrev">{bible.abbrev}</span>
              <ChevronRight size={18} style={{ color: '#9ca3af' }} />
            </div>
          </button>
        ))}

        {/* Coming Soon Card */}
        <div className="bible-select-card bible-select-card-disabled">
          <div className="bible-select-card-left">
            <span className="bible-select-card-icon bible-select-icon-muted">
              <Plus size={24} />
            </span>
            <div>
              <div className="bible-select-card-name">More Translations</div>
              <div className="bible-select-card-desc">Additional versions coming soon</div>
            </div>
          </div>
          <span className="bible-coming-soon-badge">Coming Soon</span>
        </div>
      </div>
    </div>
  )
}

export default BibleSelect
