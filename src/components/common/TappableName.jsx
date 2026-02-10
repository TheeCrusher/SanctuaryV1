// =============================================================================
// TAPPABLE NAME COMPONENT
// =============================================================================
// Wraps a user's name so tapping it opens the User Action Menu.
// Renders as plain text for: anonymous users, the current user's own name.
// Props: userId, name, isAnonymous, className, photoUrl, avatar, showMessage

import { useApp } from '../../context/AppContext'

function TappableName({ userId, name, isAnonymous = false, className = '', photoUrl, avatar, showMessage = true }) {
  const { user, showUserActionMenu } = useApp()

  const isTappable = !isAnonymous && userId && userId !== user?.id

  if (!isTappable) {
    return <span className={className}>{name}</span>
  }

  return (
    <span
      className={`${className} tappable-name`}
      onClick={(e) => {
        e.stopPropagation()
        showUserActionMenu({ userId, userName: name, photoUrl, avatar, showMessage })
      }}
      role="button"
      tabIndex={0}
    >
      {name}
    </span>
  )
}

export default TappableName
