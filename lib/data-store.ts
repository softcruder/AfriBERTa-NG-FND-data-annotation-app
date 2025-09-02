// Client-side data management utilities
export interface CSVRow {
  id: string
  originalIndex: number
  data: string[]
  assigned?: boolean
  assignedTo?: string
  completed?: boolean
  header?: string[]
}

export interface AnnotationTask {
  id: string
  rowId: string
  csvRow: CSVRow
  startTime?: Date
  endTime?: Date
  claims: string[]
  sourceLinks: string[]
  translation?: string
  verdict?: string
  translationLanguage?: "ha" | "yo"
  articleBody?: string
  sourceUrl?: string
  claimLinks?: string[]
  status: "not-started" | "in-progress" | "completed" | "qa-pending" | "qa-approved" | "admin-review"
  // Task validity fields
  isValid?: boolean
  invalidityReason?: string
  // QA workflow tracking
  annotatorId?: string
  qaId?: string
  adminId?: string
  qaComments?: string
  adminComments?: string
  // Additional CSV data for export
  csvData?: {
    originalClaim: string
    language: string
    originalSourceUrl: string
    domain: string
    id_in_source: string
  }
}

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_TASK: "annotation_current_task",
  SPREADSHEET_ID: "annotation_spreadsheet_id",
  CSV_FILE_ID: "annotation_csv_file_id",
} as const

export function getCurrentTask(): AnnotationTask | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
    if (!stored) return null

    const task = JSON.parse(stored)
    // Convert date strings back to Date objects
    if (task.startTime) task.startTime = new Date(task.startTime)
    if (task.endTime) task.endTime = new Date(task.endTime)

    return task
  } catch {
    return null
  }
}

export function setCurrentTask(task: AnnotationTask | null): void {
  if (typeof window === "undefined") return

  if (task === null) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK)
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, JSON.stringify(task))
  }
}

export function getSpreadsheetId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID)
}

export function setSpreadsheetId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id)
}

export function getCSVFileId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.CSV_FILE_ID)
}

export function setCSVFileId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CSV_FILE_ID, id)
}

// Helper function to calculate task duration in minutes
export function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

// Helper function to generate unique row ID
export function generateRowId(csvFileId: string, rowIndex: number): string {
  return `${csvFileId}_row_${rowIndex}`
}
