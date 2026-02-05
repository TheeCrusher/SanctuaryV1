// =============================================================================
// COMMON COMPONENTS INDEX
// =============================================================================
// This file re-exports all common components from a single location.
//
// Instead of writing:
//   import Avatar from '../components/common/Avatar'
//   import Card from '../components/common/Card'
//
// You can write:
//   import { Avatar, Card } from '../components/common'
//
// This is called a "barrel file" and keeps imports clean and organized.

export { default as Avatar } from './Avatar'
export { default as Badge } from './Badge'
export { default as Card } from './Card'
export { default as EmptyState } from './EmptyState'
export { default as Modal } from './Modal'
