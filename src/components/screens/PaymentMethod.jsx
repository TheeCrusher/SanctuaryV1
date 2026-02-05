// =============================================================================
// PAYMENT METHOD SCREEN
// =============================================================================
// Shows saved payment methods and allows adding new ones.
// Displays a visual credit card using the payment-card CSS from the original app.

import { useNavigate } from 'react-router-dom'

function PaymentMethod() {
  const navigate = useNavigate()

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Payment Method</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <h2 className="sub-section-title">Saved Card</h2>

        {/* Visual Credit Card */}
        {/* This uses the payment-card CSS class from the original app */}
        <div className="payment-card">
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Credit Card</div>
          <div className="payment-card-number">•••• •••• •••• 4242</div>
          <div className="payment-card-row">
            <div>
              <div style={{ marginBottom: '4px' }}>Card Holder</div>
              <div style={{ fontWeight: '600', fontSize: '14px', opacity: 1 }}>Spiritual Guide</div>
            </div>
            <div>
              <div style={{ marginBottom: '4px' }}>Expires</div>
              <div style={{ fontWeight: '600', fontSize: '14px', opacity: 1 }}>12/28</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          className="btn-primary"
          style={{ marginBottom: '12px' }}
          onClick={() => alert('Update card feature coming soon!')}
        >
          Update Card
        </button>

        <button
          className="btn-secondary"
          onClick={() => alert('Add new card feature coming soon!')}
        >
          Add New Card
        </button>

        <h2 className="sub-section-title">Billing History</h2>

        <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
          No billing history yet
        </div>
      </div>
    </div>
  )
}

export default PaymentMethod
