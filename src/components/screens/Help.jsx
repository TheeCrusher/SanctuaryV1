// =============================================================================
// HELP SCREEN
// =============================================================================
// FAQ and help information.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Help() {
  const navigate = useNavigate()

  // Track which FAQ items are open
  const [openFaqs, setOpenFaqs] = useState({})

  // Toggle FAQ item open/closed
  function toggleFaq(id) {
    setOpenFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: 'How do I schedule a session?',
      answer: 'Go to the Sessions tab and tap the + button. Fill in the details and tap Create. Your session will appear in your upcoming list.'
    },
    {
      id: 2,
      question: 'How do I confirm a pending session?',
      answer: 'In the Sessions tab, find the pending session and tap the Confirm button. The session status will update to confirmed.'
    },
    {
      id: 3,
      question: 'Can I message seekers directly?',
      answer: 'Yes! Go to the Messages tab, tap the + button to start a new conversation, and select the person you want to message.'
    },
    {
      id: 4,
      question: 'How do I find churches near me?',
      answer: 'Go to the Churches tab and use the search bar to enter your city name or ZIP code. Results will show churches in that area with ratings and service times.'
    },
    {
      id: 5,
      question: 'How do I update my profile photo?',
      answer: 'Go to your Profile tab and tap on your avatar. You can then select a photo from your device to upload.'
    },
    {
      id: 6,
      question: 'Is my data secure?',
      answer: 'Yes, your data is stored securely on your device. We take privacy seriously and never share your personal information without consent.'
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
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Help & FAQ</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <h2 className="sub-section-title">Frequently Asked Questions</h2>

        {faqs.map(faq => (
          <div key={faq.id} className="faq-item">
            <div
              className="faq-q"
              onClick={() => toggleFaq(faq.id)}
            >
              <span>{faq.question}</span>
              <span className={`faq-arrow ${openFaqs[faq.id] ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`faq-a ${openFaqs[faq.id] ? 'open' : ''}`}>
              {faq.answer}
            </div>
          </div>
        ))}

        <h2 className="sub-section-title">Need More Help?</h2>
        <div className="sub-text">
          <p>
            If you can't find what you're looking for, please contact our
            support team. We're here to help!
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate('/contact')}
          style={{ marginTop: '16px' }}
        >
          Contact Support
        </button>
      </div>
    </div>
  )
}

export default Help
