// =============================================================================
// ONBOARDING TOUR COMPONENT
// =============================================================================
// A first-time walkthrough that highlights key features for new users.
// Shows role-specific steps (8 for seekers, 11 for guides).
// Uses a spotlight + tooltip pattern with smooth transitions.
//
// Props:
//   onComplete - callback when tour finishes or is skipped

import './OnboardingTour.css'
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
    message: name => `Hi ${name}! As a Seeker, you're here to find spiritual guidance and grow in your faith. Let's take a quick tour of where to start.`,
    target: null
  },
  {
    id: 'more-tab',
    type: 'spotlight',
    title: 'More Menu',
    message: 'This is where your most important tools live — including Find Guides, Community, Prayer Board, and your Sessions.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'community-tab',
    type: 'spotlight',
    title: 'Community',
    message: 'Connect with believers. Find people from your church, send messages, and build real relationships.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'find-guide',
    type: 'spotlight',
    title: 'Find Guides',
    message: 'The heart of Sanctuary. Browse spiritual guides near you or across the country and request a session directly from their profile.',
    target: '[data-tour-id="more-find"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'sessions',
    type: 'spotlight',
    title: 'Sessions',
    message: 'Once you book with a guide, your appointments show up here. You\'ll get notified when your guide confirms.',
    target: '[data-tour-id="more-sessions"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'prayer-board',
    type: 'spotlight',
    title: 'Prayer Board',
    message: 'Share your prayer requests and lift others up. This is your community\'s shared prayer wall.',
    target: '[data-tour-id="more-prayer-board"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'events-tab',
    type: 'spotlight',
    title: 'Events',
    message: 'Discover what\'s happening — in-person gatherings and digital events like live streams and recorded teachings.',
    target: '[data-tour-id="nav-events"]',
    tooltipPos: 'above'
  },
  {
    id: 'bible-study-tab',
    type: 'spotlight',
    title: 'Bible Study',
    message: 'Read scripture, explore reading plans, and practice memorization — all in one place right from the nav bar.',
    target: '[data-tour-id="nav-bible-study"]',
    tooltipPos: 'above'
  },
  {
    id: 'profile-tab',
    type: 'spotlight',
    title: 'Your Profile',
    message: 'Complete your profile with a photo, bio, and interests — guides and community members use it to get to know you. Welcome to Sanctuary!',
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
    message: name => `Hi ${name}! As a Guide, you'll be helping seekers grow in their spiritual journey. Let's get you set up — there are a few things to do first.`,
    target: null
  },
  {
    id: 'profile-setup',
    type: 'spotlight',
    title: 'Set Up Your Profile',
    message: 'Start here. Seekers choose guides based on your photo, bio, specialization, and church. Head to Profile to fill these in.',
    target: '[data-tour-id="nav-profile"]',
    tooltipPos: 'above'
  },
  {
    id: 'guide-availability',
    type: 'fullscreen',
    title: 'Enable Accepting Seekers',
    message: "On your Profile page, turn on 'Accepting New Seekers' and set your max pending requests. Until this is enabled, seekers won't be able to book sessions with you.",
    target: null
  },
  {
    id: 'home-tab',
    type: 'spotlight',
    title: 'Your Guide Dashboard',
    message: 'Your home base. See incoming session requests, upcoming appointments, and your quick availability toggle — all without leaving this screen.',
    target: '[data-tour-id="nav-home"]',
    tooltipPos: 'above'
  },
  {
    id: 'more-tab',
    type: 'spotlight',
    title: 'More Menu',
    message: 'Sessions, Prayer Board, Community, and more are all in here.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'sessions',
    type: 'spotlight',
    title: 'Sessions',
    message: 'All appointment requests land here. Confirm or decline, mark sessions complete, and add session notes to track your conversations with seekers.',
    target: '[data-tour-id="more-sessions"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'community-tab',
    type: 'spotlight',
    title: 'Community',
    message: 'Build your network. Community is in the More menu — connect with seekers and fellow guides, start conversations, and grow your ministry presence.',
    target: '[data-tour-id="nav-more"]',
    tooltipPos: 'above',
    navigateTo: '/more'
  },
  {
    id: 'prayer-board',
    type: 'spotlight',
    title: 'Prayer Board',
    message: 'Seekers post prayer requests here. Responding with encouragement or scripture is one of the most meaningful things you can do as a guide.',
    target: '[data-tour-id="more-prayer-board"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'find-guide',
    type: 'spotlight',
    title: 'Find Guides',
    message: 'This is where seekers discover you. A strong profile — photo, bio, specialization, church — means more seekers will choose to connect with you.',
    target: '[data-tour-id="more-find"]',
    tooltipPos: 'below',
    navigateTo: '/more'
  },
  {
    id: 'bible-study-tab',
    type: 'spotlight',
    title: 'Bible Study',
    message: 'Quick access to scripture reading plans and the full Bible — useful for preparing sessions and sharing verses with seekers.',
    target: '[data-tour-id="nav-bible-study"]',
    tooltipPos: 'above'
  },
  {
    id: 'profile-final',
    type: 'spotlight',
    title: 'You\'re All Set!',
    message: "Keep your profile current and your availability on. The more active you are, the more seekers you'll reach. Welcome to Sanctuary!",
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
