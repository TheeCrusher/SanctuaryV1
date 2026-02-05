// =============================================================================
// TERMS & CONDITIONS SCREEN
// =============================================================================
// Displays the app's terms and conditions.

import { useNavigate } from 'react-router-dom'

function Terms() {
  const navigate = useNavigate()

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Terms & Conditions</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <div className="sub-text" style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
          Last updated: February 1, 2026
        </div>

        <h2 className="sub-section-title">1. Acceptance of Terms</h2>
        <div className="sub-text">
          <p>
            By accessing and using the Sanctuary application, you agree to be bound
            by these Terms and Conditions. If you do not agree to these terms, please
            do not use the application.
          </p>
        </div>

        <h2 className="sub-section-title">2. Description of Service</h2>
        <div className="sub-text">
          <p>
            Sanctuary provides a platform connecting spiritual guides with seekers
            for the purpose of spiritual guidance, counseling, and faith-based
            community building. The service includes scheduling, messaging, and
            church discovery features.
          </p>
        </div>

        <h2 className="sub-section-title">3. User Responsibilities</h2>
        <div className="sub-text">
          <p>
            Users are responsible for maintaining the confidentiality of their
            account credentials and for all activities that occur under their
            account. Users agree to provide accurate and truthful information.
          </p>
        </div>

        <h2 className="sub-section-title">4. Privacy</h2>
        <div className="sub-text">
          <p>
            Your privacy is important to us. Please review our Privacy Policy
            for information on how we collect, use, and protect your personal
            data.
          </p>
        </div>

        <h2 className="sub-section-title">5. Code of Conduct</h2>
        <div className="sub-text">
          <p>
            All users are expected to interact with respect, kindness, and
            compassion. Harassment, discrimination, or abusive behavior of any
            kind will not be tolerated and may result in account termination.
          </p>
        </div>

        <h2 className="sub-section-title">6. Limitation of Liability</h2>
        <div className="sub-text">
          <p>
            Sanctuary is provided "as is" without warranties of any kind.
            We are not liable for any damages arising from the use of our
            platform. Spiritual guidance provided through the app does not
            replace professional counseling or medical advice.
          </p>
        </div>

        <h2 className="sub-section-title">7. Changes to Terms</h2>
        <div className="sub-text">
          <p>
            We reserve the right to modify these terms at any time. Users will
            be notified of significant changes. Continued use of the application
            after changes constitutes acceptance of the new terms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
