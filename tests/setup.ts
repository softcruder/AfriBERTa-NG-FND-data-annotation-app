import "@testing-library/jest-dom"
import { vi } from "vitest"
import React from "react"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}))

// Mock Next.js image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => React.createElement("img", { src, alt, ...props }),
}))

// Mock window.confirm
Object.defineProperty(window, "confirm", {
  writable: true,
  value: vi.fn(() => true),
})

// Mock window.open
Object.defineProperty(window, "open", {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})
