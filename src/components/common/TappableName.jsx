// =============================================================================
// TAPPABLE NAME COMPONENT
// =============================================================================
// Wraps a user's name so tapping it navigates to their public profile.
// Renders as plain text for: anonymous users, the current user's own name.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

function TappableName({ userId, name, isAnonymous = false, className = '' }) {
  const navigate = useNavigate()
  const { user } = useApp()

  const isTappable = !isAnonymous && userId && userId !== user?.id

  if (!isTappable) {
    return <span className={className}>{name}</span>
  }

  return (
    <span
      className={`${className} tappable-name`}
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/user/${userId}`)
      }}
      role="button"
      tabIndex={0}
    >
      {name}
    </span>
  )
}

export default TappableName
