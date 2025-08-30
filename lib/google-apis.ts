// Google Drive and Sheets API integration utilities
import { google } from "googleapis"

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

export interface AnnotationRow {
  rowId: string
  annotatorId: string
  claimText: string
  sourceLinks: string[]
  translation?: string
  startTime: string
  endTime?: string
  durationMinutes?: number
  status: "in-progress" | "completed" | "verified"
  verifiedBy?: string
}

export interface PaymentSummary {
  annotatorId: string
  totalRows: number
  translations: number
  avgRowsPerHour: number
  totalHours: number
  paymentRows: number
  paymentTranslations: number
  totalPayment: number
}

// Initialize Google APIs with OAuth token
export function initializeGoogleAPIs(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: "v3", auth })
  const sheets = google.sheets({ version: "v4", auth })

  return { drive, sheets, auth }
}

// Google Drive functions
export async function listDriveFiles(accessToken: string, query?: string): Promise<DriveFile[]> {
  const { drive } = initializeGoogleAPIs(accessToken)

  try {
    const response = await drive.files.list({
      q: query || "mimeType='text/csv' or mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id,name,mimeType,modifiedTime)",
      orderBy: "modifiedTime desc",
    })

    return (
      response.data.files?.map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
      })) || []
    )
  } catch (error) {
    throw new Error(`Failed to list Drive files: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function downloadCSVFile(accessToken: string, fileId: string): Promise<string[][]> {
  const { drive } = initializeGoogleAPIs(accessToken)

  try {
    const response = await drive.files.get({
      fileId,
      alt: "media",
    })

    const csvData = response.data as string
    if (!csvData || typeof csvData !== "string") {
      throw new Error("Invalid CSV data received from Google Drive")
    }

    const rows: string[][] = []
    const lines = csvData.split(/\r?\n/)

    for (const line of lines) {
      if (!line.trim()) continue // Skip empty lines

      const row: string[] = []
      let current = ""
      let inQuotes = false
      let i = 0

      while (i < line.length) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i += 2
          } else {
            inQuotes = !inQuotes
            i++
          }
        } else if (char === "," && !inQuotes) {
          row.push(current.trim())
          current = ""
          i++
        } else {
          current += char
          i++
        }
      }

      row.push(current.trim())

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
    }

    return rows
  } catch (error) {
    throw new Error(`Failed to download CSV file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Google Sheets functions
export async function createAnnotationSheet(accessToken: string, title: string): Promise<string> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: "Annotations_Log",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Row_ID" } },
                      { userEnteredValue: { stringValue: "Annotator_ID" } },
                      { userEnteredValue: { stringValue: "Claim_Text" } },
                      { userEnteredValue: { stringValue: "Source_Links" } },
                      { userEnteredValue: { stringValue: "Translation" } },
                      { userEnteredValue: { stringValue: "Start_Time" } },
                      { userEnteredValue: { stringValue: "End_Time" } },
                      { userEnteredValue: { stringValue: "Duration_Minutes" } },
                      { userEnteredValue: { stringValue: "Status" } },
                      { userEnteredValue: { stringValue: "Verified_By" } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            properties: {
              title: "Payments",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Annotator_ID" } },
                      { userEnteredValue: { stringValue: "Total_Rows" } },
                      { userEnteredValue: { stringValue: "Translations" } },
                      { userEnteredValue: { stringValue: "Avg_Rows_Per_Hour" } },
                      { userEnteredValue: { stringValue: "Total_Hours" } },
                      { userEnteredValue: { stringValue: "Payment_Rows" } },
                      { userEnteredValue: { stringValue: "Payment_Translations" } },
                      { userEnteredValue: { stringValue: "Total_Payment" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    return response.data.spreadsheetId!
  } catch (error) {
    throw new Error(`Failed to create annotation sheet: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function logAnnotation(
  accessToken: string,
  spreadsheetId: string,
  annotation: AnnotationRow,
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Annotations_Log!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            annotation.rowId,
            annotation.annotatorId,
            annotation.claimText,
            annotation.sourceLinks.join("; "),
            annotation.translation || "",
            annotation.startTime,
            annotation.endTime || "",
            annotation.durationMinutes || "",
            annotation.status,
            annotation.verifiedBy || "",
          ],
        ],
      },
    })
  } catch (error) {
    throw new Error(`Failed to log annotation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getAnnotations(accessToken: string, spreadsheetId: string): Promise<AnnotationRow[]> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Annotations_Log!A2:J",
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      rowId: row[0] || "",
      annotatorId: row[1] || "",
      claimText: row[2] || "",
      sourceLinks: (row[3] || "").split("; ").filter(Boolean),
      translation: row[4] || undefined,
      startTime: row[5] || "",
      endTime: row[6] || undefined,
      durationMinutes: row[7] ? Number.parseInt(row[7]) : undefined,
      status: (row[8] || "in-progress") as AnnotationRow["status"],
      verifiedBy: row[9] || undefined,
    }))
  } catch (error) {
    throw new Error(`Failed to get annotations: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function updatePaymentFormulas(accessToken: string, spreadsheetId: string): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const annotations = await getAnnotations(accessToken, spreadsheetId)
    const annotatorIds = [...new Set(annotations.map((a) => a.annotatorId))]

    const paymentRows = annotatorIds.map((annotatorId, index) => {
      const rowNum = index + 2 // Starting from row 2 (after header)
      return [
        annotatorId,
        `=COUNTIF(Annotations_Log!B:B,"${annotatorId}")`, // Total_Rows
        `=COUNTIFS(Annotations_Log!B:B,"${annotatorId}",Annotations_Log!E:E,"<>")`, // Translations
        `=IF(E${rowNum}=0,0,B${rowNum}/E${rowNum})`, // Avg_Rows_Per_Hour
        `=SUMIFS(Annotations_Log!H:H,Annotations_Log!B:B,"${annotatorId}")/60`, // Total_Hours
        `=B${rowNum}*100`, // Payment_Rows (₦100 per row)
        `=C${rowNum}*150`, // Payment_Translations (₦150 per translation)
        `=F${rowNum}+G${rowNum}`, // Total_Payment
      ]
    })

    if (paymentRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Payments!A2:H${paymentRows.length + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: paymentRows,
        },
      })
    }
  } catch (error) {
    throw new Error(`Failed to update payment formulas: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getPaymentSummaries(accessToken: string, spreadsheetId: string): Promise<PaymentSummary[]> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Payments!A2:H",
    })

    const rows = response.data.values || []
    return rows.map((row) => ({
      annotatorId: row[0] || "",
      totalRows: Number.parseInt(row[1]) || 0,
      translations: Number.parseInt(row[2]) || 0,
      avgRowsPerHour: Number.parseFloat(row[3]) || 0,
      totalHours: Number.parseFloat(row[4]) || 0,
      paymentRows: Number.parseInt(row[5]) || 0,
      paymentTranslations: Number.parseInt(row[6]) || 0,
      totalPayment: Number.parseInt(row[7]) || 0,
    }))
  } catch (error) {
    throw new Error(`Failed to get payment summaries: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
