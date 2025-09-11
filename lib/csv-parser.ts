export interface CSVRow {
  id: string
  originalIndex: number
  data: string[]
  header: string[]
}

export interface ParsedCSVData {
  header: string[]
  rows: CSVRow[]
  total: number
}

export class CSVParser {
  static parseCSVData(csvData: string[][]): ParsedCSVData {
    if (!csvData || csvData.length === 0) {
      return { header: [], rows: [], total: 0 }
    }

    const header = csvData[0] || []
    const dataRows = csvData.slice(1)

    const rows: CSVRow[] = dataRows.map((row, index) => ({
      id: (row[0] || "").trim() || `row_${index}`,
      originalIndex: index + 1,
      data: row,
      header,
    }))

    return {
      header,
      rows,
      total: rows.length,
    }
  }

  static findRowById(csvData: string[][], rowId: string): CSVRow | null {
    const parsed = this.parseCSVData(csvData)
    return parsed.rows.find((row) => row.id === rowId.trim()) || null
  }

  static extractClaimData(row: string[]): {
    claim: string
    verdict: string
    language: string
    sourceUrl: string
    claimLinks: string[]
  } {
    return {
      claim: row[1] || "",
      verdict: row[2] || "",
      language: (row[4] || "").trim().toLowerCase(),
      sourceUrl: row[7] || "",
      claimLinks: (row[5] || "").split(/;\s*/).filter(Boolean),
    }
  }
}
