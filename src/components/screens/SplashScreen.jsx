import './SplashScreen.css'
import { useRef } from 'react'

// SplashScreen plays the intro video when the app first loads.
// It auto-transitions when the video ends, or the user can tap "Skip".
// The video file lives at public/sanctuary-intro.mp4

function SplashScreen({ onComplete }) {
  const videoRef = useRef(null)

  function handleSkip() {
    if (videoRef.current) videoRef.current.pause()
    onComplete()
  }

  return (
    <div className="splash-screen" onClick={handleSkip}>
      <video
        ref={videoRef}
        src="/sanctuary-intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        onPlay={(e) => { e.target.playbackRate = 1.5 }}
        className="splash-video"
      />
      <button
        className="splash-skip"
        onClick={(e) => {
          e.stopPropagation()
          handleSkip()
        }}
      >
        Skip
      </button>
    </div>
  )
}

export default SplashScreen
