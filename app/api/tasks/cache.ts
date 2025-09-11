import { AnnotationRow } from "@/lib/google-apis"

// Shared caches for tasks route
export const csvCache = new Map<string, { data: string[][]; ts: number }>()
export const annotationCache = new Map<string, { rowIds: Set<string>; ts: number }>()
// Store raw annotation rows array; route code expects anns: AnnotationRow[]
export const annotationsCache = new Map<string, { anns: AnnotationRow[]; ts: number }>()

export const finalDatasetCache = new Map<string, { ids: Set<string>; ts: number }>()
export const usersCache = new Map<string, { byEmail: Map<string, { langs: string[]; ts: number }>; ts: number }>()
