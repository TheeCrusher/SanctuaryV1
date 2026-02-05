// =============================================================================
// PRIVACY POLICY SCREEN
// =============================================================================
// Displays the app's privacy policy.

import { useNavigate } from 'react-router-dom'

function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Privacy Policy</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <div className="sub-text" style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
          Last updated: February 1, 2026
        </div>

        <h2 className="sub-section-title">Overview</h2>
        <div className="sub-text">
          <p>
            At Sanctuary, we are committed to protecting your privacy and
            ensuring the security of your personal information. This policy
            explains how we collect, use, and safeguard your data.
          </p>
        </div>

        <h2 className="sub-section-title">Information We Collect</h2>
        <div className="sub-text">
          <p>• Account information (name, email address)</p>
          <p>• Profile data (avatar, role preferences)</p>
          <p>• Session records (appointments, notes)</p>
          <p>• Messages exchanged within the platform</p>
          <p>• Usage data (app interactions, feature usage)</p>
        </div>

        <h2 className="sub-section-title">How We Use Your Information</h2>
        <div className="sub-text">
          <p>• To provide and improve our services</p>
          <p>• To facilitate communication between guides and seekers</p>
          <p>• To send notifications about sessions and messages</p>
          <p>• To ensure the safety and security of our community</p>
        </div>

        <h2 className="sub-section-title">Data Storage & Security</h2>
        <div className="sub-text">
          <p>
            Your data is stored securely using industry-standard encryption.
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction.
          </p>
        </div>

        <h2 className="sub-section-title">Your Rights</h2>
        <div className="sub-text">
          <p>You have the right to:</p>
          <p>• Access your personal data</p>
          <p>• Request correction of inaccurate data</p>
          <p>• Request deletion of your data</p>
          <p>• Opt out of marketing communications</p>
          <p>• Export your data in a portable format</p>
        </div>

        <h2 className="sub-section-title">Third-Party Sharing</h2>
        <div className="sub-text">
          <p>
            We do not sell your personal information to third parties.
            We may share data with trusted service providers who assist
            in operating our platform, subject to strict confidentiality
            agreements.
          </p>
        </div>

        <h2 className="sub-section-title">Contact Us</h2>
        <div className="sub-text">
          <p>
            If you have questions about this privacy policy, please
            contact us at privacy@sanctuary.app
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
