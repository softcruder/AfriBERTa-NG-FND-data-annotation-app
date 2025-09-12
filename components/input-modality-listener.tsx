"use client"
import { useEffect } from "react"

/**
 * Sets a data-input-modality attribute on the root element so CSS can adapt focus rings
 * between keyboard vs pointer/touch interactions.
 */
export function InputModalityListener() {
  useEffect(() => {
    const root = document.documentElement
    const setModality = (m: string) => root.setAttribute("data-input-modality", m)

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Shift" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setModality("keyboard")
      }
    }
    const handlePointer = () => setModality("pointer")

    window.addEventListener("keydown", handleKey, { passive: true })
    window.addEventListener("mousedown", handlePointer, { passive: true })
    window.addEventListener("pointerdown", handlePointer, { passive: true })
    window.addEventListener("touchstart", handlePointer, { passive: true })

    setModality("pointer")
    return () => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("mousedown", handlePointer)
      window.removeEventListener("pointerdown", handlePointer)
      window.removeEventListener("touchstart", handlePointer)
    }
  }, [])
  return null
}
