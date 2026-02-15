// =============================================================================
// ONBOARDING TOUR COMPONENT
// =============================================================================
// A first-time walkthrough that highlights key features for new users.
// Shows role-specific steps (8 for seekers, 11 for guides).
// Uses a spotlight + tooltip pattern with smooth transitions.
//
// Props:
//   onComplete - callback when tour finishes or is skipped

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Compass, X } from 'lucide-react'

// =============================================================================
// TOUR STEP DEFINITIONS
// =============================================================================
// Each step has:
//   id            - unique identifier
//   type          - 'fullscreen' (centered card) or 'spotlight' (highlights an element)
//   title         - heading text
//   message       - description (string or function that receives user's first name)
//   target        - CSS selector for the element to spotlight (null for fullscreen)
//   tooltipPos    - 'above' or 'below' the spotlight
//   navigateTo    - route to navigate to before showing this step
//   isFinal       - true for the last step (changes button text to "Get Started")

const SEEKER_STEPS = [
  {
    id: 'welcome',
    type: 'fullscreen',
    title: 'Welcome to Sanctuary!',
    message: name => `Hi ${name}! As a Seeker, you're here to find spiritual guidance and grow in your faith. Let's take a quick tour so you know where everything is.`,
    target: null
  },
  {
    id: 'home-tab',
    type: 'spotlight',
    title: 'Home',
    message: 'Your personalized dashboard. See upcoming sessions, community activity, notifications, and your daily verse all in one place.',
    target: '[data-tour-id="nav-home"]',
    tooltipPos: 'above'
  },
  {
    id: 'community-tab',
    type: 'spotlight',
    title: 'Community',
    message: 'Connect with other believers. Find church members, send messages, and build meaningful relationships.',
    target: '[data-tour-id="nav-community"]',
    tooltipPos: 'above'
  },
  {
    id: 'events-tab',
    type: 'spotlight',
    title: 'Events',
    message: 'Discover community events — both in-person and digital. RSVP to events, join live streams, and see what\'s happening.',
    target: '[data-tour-id="nav-events"]',
    tooltipPos: 'above'
  },
  {
    id: 'more-tab',
    type: 'spotlight',
    title: 'More',
    message: 'Access additional features: Find a Guide, Churches, Bible, Scripture Study, Prayer Board, and your Sessions.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'find-guide',
    type: 'spotlight',
    title: 'Find a Guide',
    message: 'Looking for spiritual guidance? Browse guides locally, regionally, or nationally. You can request sessions directly from their profile.',
    target: '[data-tour-id="more-find-guide"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'prayer-board',
    type: 'spotlight',
    title: 'Prayer Board',
    message: 'Share prayer requests, read testimonies, and pray for others in your community.',
    target: '[data-tour-id="more-prayer-board"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'profile-tab',
    type: 'spotlight',
    title: 'Your Profile',
    message: "Update your photo, bio, and interests. Manage your account settings and preferences. You're all set — enjoy Sanctuary!",
    target: '[data-tour-id="nav-profile"]',
    tooltipPos: 'above',
    isFinal: true
  }
]

const GUIDE_STEPS = [
  {
    id: 'welcome',
    type: 'fullscreen',
    title: 'Welcome to Sanctuary!',
    message: name => `Hi ${name}! As a Guide, you'll be helping seekers grow in their spiritual journey. Let's walk through the tools at your disposal.`,
    target: null
  },
  {
    id: 'home-tab',
    type: 'spotlight',
    title: 'Home',
    message: 'Your personalized dashboard. See upcoming sessions, community activity, notifications, and your daily verse all in one place.',
    target: '[data-tour-id="nav-home"]',
    tooltipPos: 'above'
  },
  {
    id: 'community-tab',
    type: 'spotlight',
    title: 'Community',
    message: 'Connect with seekers and fellow guides. Build meaningful relationships and start conversations.',
    target: '[data-tour-id="nav-community"]',
    tooltipPos: 'above'
  },
  {
    id: 'events-tab',
    type: 'spotlight',
    title: 'Events',
    message: 'Discover community events — both in-person and digital. As a guide, you can also create your own events.',
    target: '[data-tour-id="nav-events"]',
    tooltipPos: 'above',
    navigateTo: '/events'
  },
  {
    id: 'events-create',
    type: 'spotlight',
    title: 'Create Events',
    message: 'Host Bible studies, prayer meetings, sermons, and more. Create in-person gatherings or digital events like live streams and recorded teachings.',
    target: '[data-tour-id="events-create"]',
    tooltipPos: 'below',
    navigateTo: '/events'
  },
  {
    id: 'more-tab',
    type: 'spotlight',
    title: 'More',
    message: 'Access additional features: Find a Guide, Churches, Bible, Scripture Study, Prayer Board, and your Sessions.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'find-guide',
    type: 'spotlight',
    title: 'Find a Guide',
    message: 'This is where seekers will find you. Make sure your profile is complete with your specialization, denomination, and church so seekers can connect with you.',
    target: '[data-tour-id="more-find-guide"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'sessions',
    type: 'spotlight',
    title: 'Sessions',
    message: 'Manage your guidance appointments here. Confirm or decline requests from seekers, mark sessions complete, and add notes to track your conversations.',
    target: '[data-tour-id="more-sessions"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'guide-availability',
    type: 'fullscreen',
    title: 'Guide Availability',
    message: 'Head to your Profile to set whether you\'re accepting new seekers and your max pending requests. This controls whether seekers can book sessions with you.',
    target: null
  },
  {
    id: 'prayer-board',
    type: 'spotlight',
    title: 'Prayer Board',
    message: 'View and respond to prayer requests from seekers. Your words of encouragement can make a real difference.',
    target: '[data-tour-id="more-prayer-board"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'profile-tab',
    type: 'spotlight',
    title: 'Your Profile',
    message: "Keep your profile updated — seekers choose guides based on your photo, bio, specialization, and church affiliation. You're all set — welcome to Sanctuary!",
    target: '[data-tour-id="nav-profile"]',
    tooltipPos: 'above',
    isFinal: true
  }
]

// =============================================================================
// COMPONENT
// =============================================================================

function OnboardingTour({ onComplete }) {
  const { user, updateProfile } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const steps = user?.role === 'guide' ? GUIDE_STEPS : SEEKER_STEPS
  const step = steps[currentStep]
  const totalSteps = steps.length
  const firstName = user?.name?.split(' ')[0] || 'there'

  // ----- Spotlight positioning -----
  // Finds the target element in the DOM and measures its position
  const updateSpotlight = useCallback((selector, retries = 0) => {
    if (!selector) {
      setSpotlightRect(null)
      return
    }

    const el = document.querySelector(selector)
    if (el) {
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

      // Small delay after scroll to get accurate position
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        setSpotlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
        setTransitioning(false)
      })
    } else if (retries < 5) {
      // Element might not be rendered yet (e.g., after navigation)
      // Retry up to 5 times with 200ms gaps
      setTimeout(() => updateSpotlight(selector, retries + 1), 200)
    } else {
      // Give up — show as fullscreen step
      setSpotlightRect(null)
      setTransitioning(false)
    }
  }, [])

  // ----- Navigate + update spotlight when step changes -----
  useEffect(() => {
    if (!step) return

    if (step.type === 'fullscreen') {
      setSpotlightRect(null)
      setTransitioning(false)
      return
    }

    // If this step requires a specific route, navigate there first
    if (step.navigateTo && location.pathname !== step.navigateTo) {
      setTransitioning(true)
      navigate(step.navigateTo)
      // Wait for the page to render before finding the element
      setTimeout(() => updateSpotlight(step.target), 400)
    } else {
      updateSpotlight(step.target)
    }
  }, [currentStep, step, navigate, location.pathname, updateSpotlight])

  // ----- Recalculate on window resize (important for iPad rotation) -----
  useEffect(() => {
    function handleResize() {
      if (step?.target) {
        updateSpotlight(step.target)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step, updateSpotlight])

  // ----- Handlers -----
  function handleNext() {
    if (currentStep < totalSteps - 1) {
      setTransitioning(true)
      setCurrentStep(prev => prev + 1)
    }
  }

  async function handleComplete() {
    await updateProfile({ onboardingCompleted: true })
    navigate('/dashboard')
    onComplete()
  }

  function handleSkip() {
    setShowSkipConfirm(true)
  }

  async function handleConfirmSkip() {
    setShowSkipConfirm(false)
    await updateProfile({ onboardingCompleted: true })
    navigate('/dashboard')
    onComplete()
  }

  // ----- Tooltip position calculation -----
  function getTooltipStyle() {
    if (step.type === 'fullscreen' || !spotlightRect) return {}

    const PADDING = 16
    const spotlightPad = 8 // padding around spotlight
    const style = {}

    if (step.tooltipPos === 'above') {
      // Position above the spotlight (for bottom nav items)
      style.bottom = (window.innerHeight - spotlightRect.top + spotlightPad + PADDING) + 'px'
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    } else {
      // Position below the spotlight (for menu items)
      style.top = (spotlightRect.top + spotlightRect.height + spotlightPad + PADDING) + 'px'
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    }

    return style
  }

  // ----- Render -----
  const message = typeof step.message === 'function' ? step.message(firstName) : step.message

  return (
    <div className="onboarding-overlay">
      {/* Dark backdrop for fullscreen steps */}
      {step.type === 'fullscreen' && (
        <div className="onboarding-backdrop" />
      )}

      {/* Spotlight cutout for spotlight steps */}
      {step.type === 'spotlight' && spotlightRect && (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
        />
      )}

      {/* Tooltip card */}
      {!transitioning && (
        <div
          className={`onboarding-tooltip ${step.type === 'fullscreen' ? 'onboarding-tooltip-center' : ''}`}
          style={step.type !== 'fullscreen' ? getTooltipStyle() : undefined}
        >
          {/* Welcome icon for fullscreen steps */}
          {step.type === 'fullscreen' && step.id === 'welcome' && (
            <div className="onboarding-welcome-icon">
              <Compass size={40} />
            </div>
          )}

          {/* Step counter */}
          <div className="onboarding-step-counter">
            Step {currentStep + 1} of {totalSteps}
          </div>

          {/* Title */}
          <div className="onboarding-title">{step.title}</div>

          {/* Role badge on welcome step */}
          {step.id === 'welcome' && (
            <div className={`onboarding-role-badge ${user?.role === 'guide' ? 'onboarding-role-guide' : 'onboarding-role-seeker'}`}>
              {user?.role === 'guide' ? 'Guide' : 'Seeker'}
            </div>
          )}

          {/* Message */}
          <div className="onboarding-message">{message}</div>

          {/* Action buttons */}
          <div className="onboarding-actions">
            <button className="onboarding-skip-link" onClick={handleSkip}>
              Skip Tour
            </button>
            <button
              className="onboarding-next-btn"
              onClick={step.isFinal ? handleComplete : handleNext}
            >
              {step.isFinal ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div className="onboarding-skip-overlay">
          <div className="onboarding-skip-card">
            <button className="onboarding-skip-close" onClick={() => setShowSkipConfirm(false)}>
              <X size={18} />
            </button>
            <div className="onboarding-title">Skip the tour?</div>
            <div className="onboarding-message">
              {user?.role === 'guide'
                ? "We recommend completing the tour since guides have additional features for managing seekers and posting content. You can always restart it from your Profile settings."
                : "Are you sure? You can always restart the tour from your Profile settings."}
            </div>
            <div className="onboarding-skip-actions">
              <button className="onboarding-skip-continue" onClick={() => setShowSkipConfirm(false)}>
                Continue Tour
              </button>
              <button className="onboarding-skip-confirm" onClick={handleConfirmSkip}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OnboardingTour
