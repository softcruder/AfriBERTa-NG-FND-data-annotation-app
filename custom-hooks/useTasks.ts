"use client"

import { useMemo } from "react"
import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"

export interface TaskRow {
  index: number
  data: string[]
  header: string[]
}

export interface TasksResponse {
  items: TaskRow[]
  total: number
  page: number
  pageSize: number
}

export function useTasks({ page, pageSize, fileId }: { page: number; pageSize: number; fileId?: string }) {
  const key = useMemo(() => buildURL("/tasks", { page, pageSize, fileId }), [page, pageSize, fileId])
  const { data, error, isLoading, mutate } = useSWRGet<TasksResponse>(key)
  return { data, error, isLoading, mutate }
}
