// =============================================================================
// BIBLE STUDY COMBINED SCREEN
// =============================================================================
// Wrapper screen that combines Scripture Study and Bible under one nav tab.
// A pill toggle at the top switches between the two modes.
// The inner components render as-is; their own headers are hidden via CSS
// so BibleStudy can provide a single unified "Bible Study" title.
//
// Routes that activate this tab: /bible-study, /scripture, /bibles

import './BibleStudy.css'
import { useState } from 'react'
import Scripture from './Scripture'
import BibleSelect from './BibleSelect'

function BibleStudy() {
  const [activeTab, setActiveTab] = useState('study')

  return (
    <div className="bible-study-wrapper">
      {/* Header */}
      <div className="screen-header">
        <h1 className="screen-title">Bible Study</h1>
      </div>

      {/* Pill Toggle */}
      <div className="bible-study-pills">
        <button
          className={`bible-study-pill ${activeTab === 'study' ? 'active' : ''}`}
          onClick={() => setActiveTab('study')}
        >
          Study
        </button>
        <button
          className={`bible-study-pill ${activeTab === 'bible' ? 'active' : ''}`}
          onClick={() => setActiveTab('bible')}
        >
          Bible
        </button>
      </div>

      {/* Tab Content — inner screen headers are hidden via CSS */}
      <div className="bible-study-content">
        {activeTab === 'study' ? <Scripture /> : <BibleSelect />}
      </div>
    </div>
  )
}

export default BibleStudy
