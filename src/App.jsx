// =============================================================================
// APP COMPONENT - Main Application with Routing
// =============================================================================
// This is the root component of your application.
// It defines all the routes (URLs) and which components to show for each.

import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { LoadingSpinner, OnboardingTour, ChurchOnboardingTour } from './components/common'
import { useSwipeable } from 'react-swipeable'

// Layout components
import { BottomNav } from './components/layout'

// Screen components (we'll create these next)
import LoginScreen from './components/screens/LoginScreen'
import SignUpScreen from './components/screens/SignUpScreen'
import Dashboard from './components/screens/Dashboard'
import Appointments from './components/screens/Appointments'
// Messages is now merged into CommunityScreen
import Chat from './components/screens/Chat'
import Churches from './components/screens/Churches'
import ChurchDetail from './components/screens/ChurchDetail'
import Profile from './components/screens/Profile'
import About from './components/screens/About'
import Help from './components/screens/Help'
import Contact from './components/screens/Contact'
import AccountDetails from './components/screens/AccountDetails'
import Notifications from './components/screens/Notifications'
import PaymentMethod from './components/screens/PaymentMethod'
import Terms from './components/screens/Terms'
import Privacy from './components/screens/Privacy'
import MoreMenu from './components/screens/MoreMenu'
// Notes is now merged into Appointments screen
import Scripture from './components/screens/Scripture'
import ReadingPlan from './components/screens/ReadingPlan'
import MemorizationGame from './components/screens/MemorizationGame'
import UserProfile from './components/screens/UserProfile'
import PrayerBoard from './components/screens/PrayerBoard'
import CalendarView from './components/screens/CalendarView'
import BibleSelect from './components/screens/BibleSelect'
import BibleReader from './components/screens/BibleReader'
import CommunityScreen from './components/screens/CommunityScreen'
import EventsScreen from './components/screens/EventsScreen'
import EventDetail from './components/screens/EventDetail'
import BlockedUsersScreen from './components/screens/BlockedUsersScreen'
import ForgotPassword from './components/screens/ForgotPassword'
import FindGuides from './components/screens/FindGuides'
import WalkOnWater from './components/screens/WalkOnWater'
import ChurchDashboard from './components/screens/ChurchDashboard'
import ChurchProfileEditor from './components/screens/ChurchProfileEditor'
import ChurchCongregation from './components/screens/ChurchCongregation'
import ChurchGuides from './components/screens/ChurchGuides'
import { UserActionMenu } from './components/common'

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================
// This component wraps routes that require authentication.
// If the user isn't logged in, it redirects them to the login page.

function ProtectedRoute({ children }) {
  const { user, isLoading } = useApp()

  // While checking authentication status, show loading
  if (isLoading) {
    return (
      <div className="screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  // If not logged in, redirect to login page
  // The 'replace' prop means this won't add to browser history
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If logged in, show the protected content
  return children
}

// =============================================================================
// CHURCH PROTECTED ROUTE COMPONENT
// =============================================================================
// Same as ProtectedRoute but checks for a church account instead of a user.

function ChurchProtectedRoute({ children }) {
  const { churchAccount, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="screen">
        <LoadingSpinner size={48} />
      </div>
    )
  }

  if (!churchAccount) {
    return <Navigate to="/login" replace />
  }

  return children
}

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================
// Wraps screens that should have the bottom navigation bar.
// Some screens (login, chat) don't show the nav bar.

function MainLayout({ children }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const { user, churchAccount } = useApp()
  const location = useLocation()

  // ----- Onboarding Tour (regular users) -----
  // Shows once for new users when they first land on the dashboard
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (user && user.onboardingCompleted === false && location.pathname === '/dashboard') {
      // Small delay to let Dashboard render before starting the tour
      const timer = setTimeout(() => setShowTour(true), 600)
      return () => clearTimeout(timer)
    }
  }, [user, location.pathname])

  // ----- Church Onboarding Tour -----
  // Shows once for new church accounts when they first land on the church dashboard
  const [showChurchTour, setShowChurchTour] = useState(false)

  useEffect(() => {
    if (churchAccount && churchAccount.onboardingCompleted === false && location.pathname === '/church-dashboard') {
      const timer = setTimeout(() => setShowChurchTour(true), 600)
      return () => clearTimeout(timer)
    }
  }, [churchAccount, location.pathname])

  // Pages where we DON'T show the bottom navigation
  const noNavPages = ['/login', '/signup', '/forgot-password', '/chat', '/bibles/reader', '/walk-on-water', '/church-dashboard', '/church-profile-editor', '/church-congregation', '/church-guides']
  const showNav = user && !noNavPages.some(page => location.pathname.startsWith(page))

  // Swipe navigation between the 4 main tabs
  const navigate = useNavigate()
  const mainTabs = ['/dashboard', '/community', '/more', '/profile']
  const currentTabIndex = mainTabs.indexOf(location.pathname)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (showTour) return // Disable swiping during tour
      // Only swipe if we're on a main tab and there's a next tab
      if (currentTabIndex >= 0 && currentTabIndex < mainTabs.length - 1) {
        navigate(mainTabs[currentTabIndex + 1])
      }
    },
    onSwipedRight: () => {
      if (showTour) return // Disable swiping during tour
      // Only swipe if we're on a main tab and there's a previous tab
      if (currentTabIndex > 0) {
        navigate(mainTabs[currentTabIndex - 1])
      }
    },
    preventScrollOnSwipe: false,  // Don't block vertical scrolling
    trackMouse: false,            // Touch only, not mouse drags
    delta: 50,                    // Minimum 50px swipe to trigger (prevents accidental swipes)
  })

  return (
    <div className="app-container" {...swipeHandlers}>
      <Routes>
        {/* ====== PUBLIC ROUTES ====== */}
        {/* These don't require authentication */}

        <Route
          path="/login"
          element={
            // If already logged in, redirect to appropriate dashboard
            user ? <Navigate to="/dashboard" replace /> :
            churchAccount ? <Navigate to="/church-dashboard" replace /> :
            <LoginScreen />
          }
        />

        <Route
          path="/signup"
          element={<SignUpScreen />}
        />

        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
          }
        />

        {/* ====== PROTECTED ROUTES ====== */}
        {/* These require the user to be logged in */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guides"
          element={
            <ProtectedRoute>
              <FindGuides />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Navigate to="/community" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/churches"
          element={
            <ProtectedRoute>
              <Churches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/churches/:id"
          element={
            <ProtectedRoute>
              <ChurchDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <MoreMenu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Navigate to="/appointments" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scripture"
          element={
            <ProtectedRoute>
              <Scripture />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scripture/plan/:id"
          element={
            <ProtectedRoute>
              <ReadingPlan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scripture/game/:mode"
          element={
            <ProtectedRoute>
              <MemorizationGame />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prayers"
          element={
            <ProtectedRoute>
              <PrayerBoard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/walk-on-water"
          element={
            <ProtectedRoute>
              <WalkOnWater />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blocked-users"
          element={
            <ProtectedRoute>
              <BlockedUsersScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bibles"
          element={
            <ProtectedRoute>
              <BibleSelect />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bibles/reader"
          element={
            <ProtectedRoute>
              <BibleReader />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account-details"
          element={
            <ProtectedRoute>
              <AccountDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-method"
          element={
            <ProtectedRoute>
              <PaymentMethod />
            </ProtectedRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <ProtectedRoute>
              <Terms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <Privacy />
            </ProtectedRoute>
          }
        />

        {/* ====== CHURCH ACCOUNT ROUTES ====== */}
        <Route path="/church-dashboard" element={<ChurchProtectedRoute><ChurchDashboard /></ChurchProtectedRoute>} />
        <Route path="/church-profile-editor" element={<ChurchProtectedRoute><ChurchProfileEditor /></ChurchProtectedRoute>} />
        <Route path="/church-congregation" element={<ChurchProtectedRoute><ChurchCongregation /></ChurchProtectedRoute>} />
        <Route path="/church-guides" element={<ChurchProtectedRoute><ChurchGuides /></ChurchProtectedRoute>} />

        {/* ====== DEFAULT ROUTE ====== */}
        {/* Redirect root URL to dashboard (or login if not authenticated) */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* ====== CATCH-ALL ROUTE ====== */}
        {/* Any unknown URL goes to dashboard */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>

      {/* Show bottom navigation on appropriate pages */}
      {showNav && <BottomNav />}

      {/* Global user action menu (triggered from any tappable name) */}
      <UserActionMenu />

      {/* Onboarding Tour — renders above everything for first-time users */}
      {showTour && (
        <OnboardingTour onComplete={() => setShowTour(false)} />
      )}

      {/* Church Onboarding Tour — shown once on first church account login */}
      {showChurchTour && (
        <ChurchOnboardingTour
          churchAccount={churchAccount}
          onComplete={() => setShowChurchTour(false)}
        />
      )}
    </div>
  )
}

export default App
