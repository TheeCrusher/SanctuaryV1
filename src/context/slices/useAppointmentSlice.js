import { useState } from 'react'
import { api } from '../../utils/api'

export function useAppointmentSlice() {
  const [appointments, setAppointments] = useState([])

  async function createAppointment(appointmentData) {
    const { appointments: newApts } = await api.post('/appointments', appointmentData)
    setAppointments(prev => [...prev, ...newApts])
    return newApts
  }

  async function confirmAppointment(id) {
    const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'confirmed' })
    setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
  }

  async function declineAppointment(id) {
    const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'declined' })
    setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
  }

  async function completeAppointment(id) {
    try {
      const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'completed' })
      setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
      return appointment
    } catch (error) {
      // ignore
    }
  }

  async function cancelAppointment(id) {
    try {
      await api.delete(`/appointments/${id}`)
      setAppointments(prev => prev.filter(apt => apt.id !== id))
    } catch (error) {
      // ignore
    }
  }

  async function cancelSeries(seriesId) {
    try {
      const { appointments: cancelled } = await api.delete(`/appointments/series/${seriesId}`)
      const cancelledIds = new Set(cancelled.map(a => a.id))
      setAppointments(prev => prev.filter(apt => !cancelledIds.has(apt.id)))
    } catch (error) {
      // ignore
    }
  }

  // Derived counts — computed here so components don't have to filter themselves
  const upcomingCount = appointments.filter(a => a.status !== 'completed' && a.status !== 'declined').length
  const completedCount = appointments.filter(a => a.status === 'completed').length

  function reset() {
    setAppointments([])
  }

  return {
    appointments,
    setAppointments,
    createAppointment,
    confirmAppointment,
    declineAppointment,
    completeAppointment,
    cancelAppointment,
    cancelSeries,
    upcomingCount,
    completedCount,
    reset,
  }
}
