import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TasksListPage } from "@/components/tasks-list-page"

// Ensure React is in global scope for environments expecting legacy JSX runtime
;(globalThis as any).React = React

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/annotator/tasks",
}))

vi.mock("@/custom-hooks", () => ({
  useAuth: () => ({ csvFileId: "file1" }),
}))

vi.mock("@/custom-hooks/useTasks", () => ({
  useTasks: () => ({
    data: {
      items: [
        {
          index: 0,
          data: [
            "id1",
            "A very long claim text that should be truncated on mobile screens to ensure layout integrity and prevent overflow issues",
          ],
          targetsRemaining: [],
        },
      ],
      total: 1,
    },
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

// Basic mock shadcn/ui primitives used in component
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}))
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: () => <div /> }))

describe("TasksListPage mobile truncation", () => {
  it("applies line clamp classes to long claim text", () => {
    render(<TasksListPage basePath="/dashboard/annotator" />)
    const textEl = screen.getByText(/A very long claim text/)
    expect(textEl.className).toMatch(/max-w-[14rem] sm:max-w-[100%] line-clamp-1 sm:line-clamp-1/)
  })
})
