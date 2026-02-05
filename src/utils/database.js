// =============================================================================
// INDEXEDDB UTILITY
// =============================================================================
// This file handles all database operations for persistent storage.
// IndexedDB is a browser-based database that stores data locally.

const DB_NAME = 'SanctuaryDB'
const DB_VERSION = 1
const STORE_NAME = 'appointments'

let db = null

// -----------------------------------------------------------------------------
// Initialize the Database
// -----------------------------------------------------------------------------
// This function opens (or creates) the database and sets up the structure.
// It returns a Promise that resolves when the database is ready.

export function initDB() {
  return new Promise((resolve, reject) => {
    // Open the database (creates it if it doesn't exist)
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // This event fires when the database needs to be created or upgraded
    // It's where we define the "schema" (structure) of our data
    request.onupgradeneeded = (event) => {
      db = event.target.result

      // Create the appointments "object store" (like a table in SQL)
      // keyPath: 'id' means each appointment is identified by its 'id' field
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })

        // Create an index for searching by status (pending, confirmed, completed)
        objectStore.createIndex('status', 'status', { unique: false })
      }
    }

    // Database opened successfully
    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    // Error opening database
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
      reject(event.target.error)
    }
  })
}

// -----------------------------------------------------------------------------
// Save a Single Appointment
// -----------------------------------------------------------------------------
// Saves or updates a single appointment in the database.
// The 'put' method will insert if new or update if exists (based on id).

export function saveAppointment(appointment) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }

    // Create a "transaction" - a safe way to read/write data
    // 'readwrite' means we're going to modify data
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // 'put' adds or updates the appointment
    const request = store.put(appointment)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// -----------------------------------------------------------------------------
// Save All Appointments (Bulk Save)
// -----------------------------------------------------------------------------
// Clears all existing appointments and saves a new list.
// Useful for initializing sample data or syncing with a server.

export function saveAllAppointments(appointments) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Clear all existing appointments first
    store.clear()

    // Add all the new appointments
    appointments.forEach(apt => store.put(apt))

    // Wait for all operations to complete
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// -----------------------------------------------------------------------------
// Load All Appointments
// -----------------------------------------------------------------------------
// Retrieves all appointments from the database.

export function loadAllAppointments() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }

    // 'readonly' transaction since we're just reading
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    // getAll() returns all records in the store
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// -----------------------------------------------------------------------------
// Delete an Appointment
// -----------------------------------------------------------------------------
// Removes an appointment by its ID.

export function deleteAppointment(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// -----------------------------------------------------------------------------
// Get Appointments by Status
// -----------------------------------------------------------------------------
// Retrieves appointments filtered by status (pending, confirmed, completed).

export function getAppointmentsByStatus(status) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'))
      return
    }

    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('status')

    // Use the index to find all appointments with the given status
    const request = index.getAll(status)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}
