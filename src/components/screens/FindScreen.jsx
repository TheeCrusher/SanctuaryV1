// =============================================================================
// FIND COMBINED SCREEN
// =============================================================================
// Wrapper screen that combines Find Guides and Churches under one More menu item.
// A pill toggle at the top switches between the two modes.
// The inner components render as-is; their own headers are hidden via CSS
// so FindScreen can provide a single unified "Find" title.
//
// Route: /find

import './FindScreen.css'
import { useState } from 'react'
import FindGuides from './FindGuides'
import Churches from './Churches'

function FindScreen() {
  const [activeTab, setActiveTab] = useState('guides')

  return (
    <div className="find-screen-wrapper">
      {/* Header */}
      <div className="screen-header">
        <h1 className="screen-title">Find</h1>
      </div>

      {/* Pill Toggle */}
      <div className="find-screen-pills">
        <button
          className={`find-screen-pill ${activeTab === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveTab('guides')}
        >
          Guides
        </button>
        <button
          className={`find-screen-pill ${activeTab === 'churches' ? 'active' : ''}`}
          onClick={() => setActiveTab('churches')}
        >
          Churches
        </button>
      </div>

      {/* Tab Content — inner screen headers are hidden via CSS */}
      <div className="find-screen-content">
        {activeTab === 'guides' ? <FindGuides /> : <Churches />}
      </div>
    </div>
  )
}

export default FindScreen
