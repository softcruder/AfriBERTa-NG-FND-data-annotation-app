"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface TimeTrackingState {
  isActive: boolean
  startTime: Date | null
  elapsedTime: number
  totalTime: number
  isIdle: boolean
  lastActivity: Date
}

interface UseTimeTrackingOptions {
  idleThreshold?: number // milliseconds before considering idle (default: 15 minutes)
  autoSave?: boolean
  onIdle?: () => void
  onResume?: () => void
  onTimeout?: () => void
}

export function useTimeTracking(options: UseTimeTrackingOptions = {}) {
  const {
    idleThreshold = 15 * 60 * 1000, // 15 minutes
    autoSave = true,
    onIdle,
    onResume,
    onTimeout,
  } = options

  const [state, setState] = useState<TimeTrackingState>({
    isActive: false,
    startTime: null,
    elapsedTime: 0,
    totalTime: 0,
    isIdle: false,
    lastActivity: new Date(),
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activityListeners = useRef<(() => void)[]>([])

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    setState((prev) => {
      if (prev.isIdle) {
        // Resume from idle
        onResume?.()
        return {
          ...prev,
          isIdle: false,
          lastActivity: new Date(),
        }
      }
      return {
        ...prev,
        lastActivity: new Date(),
      }
    })

    // Reset idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
    }
    idleTimeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.isActive && !prev.isIdle) {
          onIdle?.()
          return { ...prev, isIdle: true }
        }
        return prev
      })
    }, idleThreshold)
  }, [idleThreshold, onIdle, onResume])

  // Setup activity listeners
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    const handleActivity = () => updateActivity()

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
      activityListeners.current.push(() => document.removeEventListener(event, handleActivity, true))
    })

    return () => {
      activityListeners.current.forEach((cleanup) => cleanup())
      activityListeners.current = []
    }
  }, [updateActivity])

  // Timer effect
  useEffect(() => {
    if (state.isActive && !state.isIdle) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.startTime) {
            const elapsed = Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
            return { ...prev, elapsedTime: elapsed }
          }
          return prev
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isActive, state.isIdle])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    }
  }, [])

  const start = useCallback(() => {
    const now = new Date()
    setState((prev) => ({
      ...prev,
      isActive: true,
      startTime: now,
      elapsedTime: 0,
      isIdle: false,
      lastActivity: now,
    }))
    updateActivity()
  }, [updateActivity])

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      totalTime: prev.totalTime + prev.elapsedTime,
    }))
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    const now = new Date()
    setState((prev) => ({
      ...prev,
      isActive: true,
      startTime: now,
      elapsedTime: 0,
      isIdle: false,
      lastActivity: now,
    }))
    updateActivity()
  }, [updateActivity])

  const stop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      totalTime: prev.totalTime + prev.elapsedTime,
      elapsedTime: 0,
      startTime: null,
    }))
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isActive: false,
      startTime: null,
      elapsedTime: 0,
      totalTime: 0,
      isIdle: false,
      lastActivity: new Date(),
    })
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
  }, [])

  const getTotalSeconds = useCallback(() => {
    return state.totalTime + (state.isActive && !state.isIdle ? state.elapsedTime : 0)
  }, [state.totalTime, state.elapsedTime, state.isActive, state.isIdle])

  const getTotalMinutes = useCallback(() => {
    return Math.floor(getTotalSeconds() / 60)
  }, [getTotalSeconds])

  const formatTime = useCallback(
    (seconds?: number) => {
      const totalSeconds = seconds ?? getTotalSeconds()
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    },
    [getTotalSeconds],
  )

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    reset,
    getTotalSeconds,
    getTotalMinutes,
    formatTime,
  }
}
