// =============================================================================
// ABOUT SCREEN
// =============================================================================
// Information about the Sanctuary app.

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'

function About() {
  const navigate = useNavigate()

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>About</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <h2 className="sub-section-title">Our Mission</h2>
        <div className="sub-text">
          <p>
            Sanctuary is dedicated to connecting spiritual guides with seekers
            on their faith journey. We believe everyone deserves access to
            meaningful spiritual guidance and support.
          </p>
          <p>
            Our platform makes it easy to schedule sessions, communicate
            securely, and find welcoming faith communities.
          </p>
        </div>

        <h2 className="sub-section-title">What We Offer</h2>
        <div className="sub-text">
          <p>
            <strong>For Guides:</strong> Tools to manage your sessions,
            connect with seekers, and track your spiritual impact.
          </p>
          <p>
            <strong>For Seekers:</strong> A safe space to explore faith,
            ask questions, and find supportive community.
          </p>
        </div>

        <h2 className="sub-section-title">Our Values</h2>
        <div className="sub-text">
          <p>• Compassion and understanding</p>
          <p>• Respect for all faith traditions</p>
          <p>• Confidentiality and trust</p>
          <p>• Accessibility and inclusion</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', color: '#9ca3af' }}>
          <p>Version 1.0.0</p>
          <p style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Made with <Heart size={14} style={{ color: '#ef4444' }} /> and faith</p>
        </div>
      </div>
    </div>
  )
}

export default About
