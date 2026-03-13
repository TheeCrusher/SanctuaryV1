// ============================================================
// API Helper Utility
// ============================================================
// This file centralizes all communication with the backend.
// Instead of writing fetch() calls with headers and error
// handling everywhere, every API call goes through here.
//
// It automatically:
// 1. Attaches the JWT token to every request
// 2. Parses JSON responses
// 3. Throws errors with the server's error message
//
// Usage in AppContext.jsx:
//   import { api, getToken, setToken, removeToken } from '../utils/api'
//   const data = await api.get('/appointments')
//   const data = await api.post('/auth/login', { email, password })
// ============================================================

// ---------- Token Management ----------
// JWT tokens are stored in localStorage so they persist
// across page refreshes (user stays logged in).

export function getToken() {
  return localStorage.getItem('sanctuary_token')
}

export function setToken(token) {
  localStorage.setItem('sanctuary_token', token)
}

export function removeToken() {
  localStorage.removeItem('sanctuary_token')
}

// ---------- Church Account Token Management ----------
// Church accounts use a separate token so they don't
// conflict with user accounts (someone could have both).

export function getChurchToken() {
  return localStorage.getItem('sanctuary_church_token')
}

export function setChurchToken(token) {
  localStorage.setItem('sanctuary_church_token', token)
}

export function removeChurchToken() {
  localStorage.removeItem('sanctuary_church_token')
}

// ---------- API Base URL ----------
// In development: empty string (Vite proxy handles /api -> localhost:3001)
// In production:  full backend URL like "https://sanctuary-api.onrender.com"
export const API_BASE = import.meta.env.VITE_API_URL || ''

// ---------- Core Fetch Wrapper ----------
// This is the main function all API calls go through.

async function apiFetch(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // If we have a token, add the Authorization header
  // This tells the server who we are
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  })

  // Parse the response as JSON
  const data = await response.json()

  // If the server returned an error (400, 401, 500, etc.), throw it
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong')
    error.status = response.status
    error.code = data.code || null
    throw error
  }

  return data
}

// ---------- Convenience Methods ----------
// These make API calls clean one-liners:
//   api.get('/appointments')
//   api.post('/auth/login', { email, password })

export const api = {
  get: (endpoint) => apiFetch(endpoint),

  post: (endpoint, body) => apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  put: (endpoint, body) => apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  patch: (endpoint, body) => apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => apiFetch(endpoint, {
    method: 'DELETE',
  }),
}

// ---------- Church API Wrapper ----------
// Same pattern as the user API but uses the church token.

async function churchApiFetch(endpoint, options = {}) {
  const token = getChurchToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong')
    error.status = response.status
    throw error
  }

  return data
}

export const churchApi = {
  get: (endpoint) => churchApiFetch(endpoint),

  post: (endpoint, body) => churchApiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  put: (endpoint, body) => churchApiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => churchApiFetch(endpoint, {
    method: 'DELETE',
  }),
}
