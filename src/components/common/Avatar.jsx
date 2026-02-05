// =============================================================================
// AVATAR COMPONENT
// =============================================================================
// Displays a user's profile picture or emoji avatar.
// Used throughout the app: dashboard, messages, appointments, profile, etc.
//
// Props:
//   - src: URL of the image (optional)
//   - emoji: Emoji to display if no image (optional)
//   - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
//   - variant: 'white' | 'blue' | 'gradient' (default: 'blue')
//   - className: Additional CSS classes (optional)

function Avatar({
  src,
  emoji,
  size = 'md',
  variant = 'blue',
  className = ''
}) {
  // Build the CSS class string based on props
  // Template literals (``) let us build strings with variables inside ${}
  const sizeClass = `avatar-${size}`
  const variantClass = `avatar-${variant}`

  return (
    <div className={`avatar ${sizeClass} ${variantClass} ${className}`}>
      {/* If we have an image URL, show the image */}
      {src ? (
        <img src={src} alt="Avatar" />
      ) : (
        // Otherwise, show the emoji (or a default)
        emoji || '👤'
      )}
    </div>
  )
}

export default Avatar
