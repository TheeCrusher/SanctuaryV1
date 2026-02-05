// =============================================================================
// CONTACT SCREEN
// =============================================================================
// Contact information and support options.

import { useNavigate } from 'react-router-dom'

function Contact() {
  const navigate = useNavigate()

  // Contact options
  const contactOptions = [
    {
      icon: '📧',
      label: 'Email',
      value: 'support@sanctuary.app'
    },
    {
      icon: '📱',
      label: 'Phone',
      value: '1-800-SANCTUARY'
    },
    {
      icon: '💬',
      label: 'Live Chat',
      value: 'Available 9 AM - 5 PM EST'
    }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Contact Us</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <h2 className="sub-section-title">Get in Touch</h2>
        <div className="sub-text">
          <p>
            We'd love to hear from you! Reach out with questions, feedback,
            or just to say hello.
          </p>
        </div>

        {/* Contact Options */}
        {contactOptions.map((option, index) => (
          <div key={index} className="contact-row">
            <div className="contact-icon">{option.icon}</div>
            <div>
              <div className="contact-label">{option.label}</div>
              <div className="contact-value">{option.value}</div>
            </div>
          </div>
        ))}

        <h2 className="sub-section-title">Office Hours</h2>
        <div className="sub-text">
          <p>Monday - Friday: 9:00 AM - 5:00 PM EST</p>
          <p>Saturday: 10:00 AM - 2:00 PM EST</p>
          <p>Sunday: Closed</p>
        </div>

        <h2 className="sub-section-title">Mailing Address</h2>
        <div className="sub-text">
          <p>Sanctuary Support</p>
          <p>123 Faith Street</p>
          <p>Hope City, HC 12345</p>
        </div>
      </div>
    </div>
  )
}

export default Contact
