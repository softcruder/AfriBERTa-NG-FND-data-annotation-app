// Google Drive and Sheets API integration utilities
import { google } from "googleapis"
import { parsePaymentRatesFromConfig } from "./payment-calculator"

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
  status: "in-progress" | "completed" | "verified" | "qa-pending" | "qa-approved" | "admin-review" | "invalid"
  verifiedBy?: string
  qaComments?: string
  adminComments?: string
  isValid?: boolean
  invalidityReason?: string
  // Extended fields
  verdict?: string
  sourceUrl?: string
  claimLinks?: string[]
  claim_text_ha?: string
  claim_text_yo?: string
  article_body_ha?: string
  article_body_yo?: string
  translationLanguage?: "ha" | "yo"
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
  // QA-related fields
  qaCount: number
  qaTotal: number
  // Approved items for redeemable calculations
  approvedAnnotations: number
  approvedTranslations: number
  redeemableAmount: number
}

// Simple key-value app configuration stored in a dedicated spreadsheet within the AfriBERTa folder
export type AppConfig = Record<string, string>

// Initialize Google APIs with OAuth token
export function initializeGoogleAPIs(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: "v3", auth })
  const sheets = google.sheets({ version: "v4", auth })

  return { drive, sheets, auth }
}

// Google Drive functions

// Constants for the specific folder structure
const AFRIBERTA_FND_FOLDER = "AfriBERTa-NG-FND"
const FACTCHECK_SCRAPER_FOLDER = "FactCheckScraper-v4.1"
const FACTCHECKS_CSV_FILE = "factchecks.csv"
const APP_CONFIG_SPREADSHEET_NAME = "AfriBERTa-NG-FND-App-Config"

// Helper function to find or create the AfriBERTa-NG-FND folder
export async function findOrCreateAfriBertaFolder(accessToken: string): Promise<string> {
  const { drive } = initializeGoogleAPIs(accessToken)

  try {
    // First, try to find existing folder
    const searchResponse = await drive.files.list({
      q: `name='${AFRIBERTA_FND_FOLDER}' and mimeType='application/vnd.google-apps.folder'`,
      fields: "files(id,name)",
    })

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id!
    }

    // If not found, create the folder
    const createResponse = await drive.files.create({
      requestBody: {
        name: AFRIBERTA_FND_FOLDER,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    })

    return createResponse.data.id!
  } catch (error) {
    throw new Error(
      `Failed to find or create AfriBERTa-NG-FND folder: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Helper function to find the FactCheckScraper-v4.1 folder and factchecks.csv file
export async function findFactChecksCSV(accessToken: string): Promise<string> {
  const { drive } = initializeGoogleAPIs(accessToken)

  try {
    // First, find the FactCheckScraper-v4.1 folder
    const folderResponse = await drive.files.list({
      q: `name='${FACTCHECK_SCRAPER_FOLDER}' and mimeType='application/vnd.google-apps.folder'`,
      fields: "files(id,name)",
    })

    if (!folderResponse.data.files || folderResponse.data.files.length === 0) {
      throw new Error(`${FACTCHECK_SCRAPER_FOLDER} folder not found`)
    }

    const folderId = folderResponse.data.files[0].id!

    // Then, find the factchecks.csv file in that folder
    const csvResponse = await drive.files.list({
      q: `name='${FACTCHECKS_CSV_FILE}' and '${folderId}' in parents`,
      fields: "files(id,name)",
    })

    if (!csvResponse.data.files || csvResponse.data.files.length === 0) {
      throw new Error(`${FACTCHECKS_CSV_FILE} not found in ${FACTCHECK_SCRAPER_FOLDER} folder`)
    }

    return csvResponse.data.files[0].id!
  } catch (error) {
    throw new Error(`Failed to find factchecks.csv: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function to create spreadsheets in the AfriBERTa-NG-FND folder
export async function createSpreadsheetInAfriBertaFolder(accessToken: string, title: string): Promise<string> {
  const { drive, sheets } = initializeGoogleAPIs(accessToken)

  try {
    // Get the AfriBERTa-NG-FND folder ID
    const folderId = await findOrCreateAfriBertaFolder(accessToken)

    // Create the spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: "Users",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "User_ID" } },
                      { userEnteredValue: { stringValue: "Name" } },
                      { userEnteredValue: { stringValue: "Email" } },
                      { userEnteredValue: { stringValue: "Role" } },
                      { userEnteredValue: { stringValue: "Status" } },
                      { userEnteredValue: { stringValue: "Total_Annotations" } },
                      { userEnteredValue: { stringValue: "Avg_Time_Per_Row" } },
                      { userEnteredValue: { stringValue: "Last_Active" } },
                      { userEnteredValue: { stringValue: "Joined_Date" } },
                    ],
                  },
                ],
              },
            ],
          },
          // Optional Config sheet inside the annotation spreadsheet for future use
          {
            properties: {
              title: "Config",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Key" } },
                      { userEnteredValue: { stringValue: "Value" } },
                      { userEnteredValue: { stringValue: "Updated_At" } },
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
                      { userEnteredValue: { stringValue: "Verdict" } },
                      { userEnteredValue: { stringValue: "Source_URL" } },
                      { userEnteredValue: { stringValue: "Claim_Links" } },
                      { userEnteredValue: { stringValue: "Claim_Text_HA" } },
                      { userEnteredValue: { stringValue: "Claim_Text_YO" } },
                      { userEnteredValue: { stringValue: "Article_Body_HA" } },
                      { userEnteredValue: { stringValue: "Article_Body_YO" } },
                      { userEnteredValue: { stringValue: "Translation_Language" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const spreadsheetId = createResponse.data.spreadsheetId!

    // Move the spreadsheet to the AfriBERTa-NG-FND folder
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      fields: "id,parents",
    })

    return spreadsheetId
  } catch (error) {
    throw new Error(
      `Failed to create spreadsheet in AfriBERTa-NG-FND folder: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Find or create the global App Config spreadsheet within the AfriBERTa folder.
 * This spreadsheet contains a single sheet named "Config" with columns [Key, Value, Updated_At].
 */
export async function findOrCreateAppConfigSpreadsheet(accessToken: string): Promise<string> {
  const { drive, sheets } = initializeGoogleAPIs(accessToken)

  // If explicitly provided via environment, prefer that and do not attempt to create
  const envConfigId = process.env.CONFIG_SPREADSHEET_ID || process.env.NEXT_PUBLIC_CONFIG_SPREADSHEET_ID
  if (envConfigId) return envConfigId

  // Ensure parent folder exists
  const folderId = await findOrCreateAfriBertaFolder(accessToken)

  // Try to find existing config spreadsheet
  const list = await drive.files.list({
    q: `'${folderId}' in parents and name='${APP_CONFIG_SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`,
    fields: "files(id,name)",
  })

  if (list.data.files && list.data.files[0]?.id) {
    return list.data.files[0].id
  }

  // Create new config spreadsheet
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: APP_CONFIG_SPREADSHEET_NAME },
      sheets: [
        {
          properties: { title: "Config" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: "Key" } },
                    { userEnteredValue: { stringValue: "Value" } },
                    { userEnteredValue: { stringValue: "Updated_At" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  })

  const configSpreadsheetId = created.data.spreadsheetId!
  // Move to folder
  await drive.files.update({ fileId: configSpreadsheetId, addParents: folderId, fields: "id,parents" })
  return configSpreadsheetId
}

/**
 * Try to find the App Config spreadsheet without creating it. Returns undefined if not found.
 */
export async function findAppConfigSpreadsheet(accessToken: string): Promise<string | undefined> {
  const { drive } = initializeGoogleAPIs(accessToken)
  try {
    // If explicitly provided via environment, prefer that
    const envConfigId = process.env.CONFIG_SPREADSHEET_ID || process.env.NEXT_PUBLIC_CONFIG_SPREADSHEET_ID
    if (envConfigId) return envConfigId

    const folderId = await findOrCreateAfriBertaFolder(accessToken)
    const list = await drive.files.list({
      q: `'${folderId}' in parents and name='${APP_CONFIG_SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: "files(id,name)",
    })
    return list.data.files && list.data.files[0]?.id ? list.data.files[0].id : undefined
  } catch {
    return undefined
  }
}

/** Resolve the App Config spreadsheet ID using env override (if provided),
 * otherwise optionally create or find it under the AfriBERTa folder. */
async function resolveAppConfigSpreadsheetId(
  accessToken: string,
  opts?: { allowCreate?: boolean },
): Promise<string | undefined> {
  const envConfigId = process.env.CONFIG_SPREADSHEET_ID || process.env.NEXT_PUBLIC_CONFIG_SPREADSHEET_ID
  if (envConfigId) return envConfigId
  if (opts?.allowCreate) return await findOrCreateAppConfigSpreadsheet(accessToken)
  return await findAppConfigSpreadsheet(accessToken)
}

export async function getAppConfig(accessToken: string): Promise<AppConfig> {
  const { sheets } = initializeGoogleAPIs(accessToken)
  const spreadsheetId = await resolveAppConfigSpreadsheetId(accessToken, { allowCreate: true })
  if (!spreadsheetId) throw new Error("Config spreadsheet not found and could not be created")

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Config!A2:C" })
  const values = res.data.values || []
  const cfg: AppConfig = {}
  for (const row of values) {
    const key = row[0]?.trim()
    const val = row[1]?.toString() ?? ""
    if (key) cfg[key] = val
  }
  return cfg
}

/**
 * Safe version of getAppConfig that doesn't create the spreadsheet if missing.
 * Returns undefined if the config store is not present.
 */
export async function getAppConfigSafe(accessToken: string): Promise<AppConfig | undefined> {
  const { sheets } = initializeGoogleAPIs(accessToken)
  const spreadsheetId = await resolveAppConfigSpreadsheetId(accessToken, { allowCreate: false })
  if (!spreadsheetId) return undefined
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Config!A2:C" })
    const values = res.data.values || []
    const cfg: AppConfig = {}
    for (const row of values) {
      const key = row[0]?.trim()
      const val = row[1]?.toString() ?? ""
      if (key) cfg[key] = val
    }
    return cfg
  } catch {
    return undefined
  }
}

export async function setAppConfig(accessToken: string, entries: AppConfig): Promise<void> {
  console.log("Starting setAppConfig with entries:", Object.keys(entries))
  const { sheets } = initializeGoogleAPIs(accessToken)

  console.log("Resolving spreadsheet ID...")
  const spreadsheetId = await resolveAppConfigSpreadsheetId(accessToken, { allowCreate: true })
  if (!spreadsheetId) throw new Error("Config spreadsheet not found and could not be created")
  console.log("Using spreadsheet ID:", spreadsheetId)

  try {
    console.log("Reading existing data...")
    // Read existing config to determine what to update vs append
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Config!A2:A", // Just get keys to minimize data transfer
      majorDimension: "ROWS",
    })

    const existingKeys = (res.data.values || []).map(row => row[0]?.toString()).filter(Boolean)
    console.log("Existing keys found:", existingKeys.length)

    const updates: Array<{ range: string; values: string[][] }> = []
    const appends: Array<[string, string, string]> = []
    const timestamp = new Date().toISOString()

    Object.entries(entries).forEach(([key, value]) => {
      const existingIndex = existingKeys.indexOf(key)
      if (existingIndex >= 0) {
        // Update existing row (existingIndex + 2 because A2 is row 2)
        const rowNumber = existingIndex + 2
        updates.push({
          range: `Config!A${rowNumber}:C${rowNumber}`,
          values: [[key, value, timestamp]],
        })
      } else {
        // New row to append
        appends.push([key, value, timestamp])
      }
    })

    console.log("Operations to perform:", { updates: updates.length, appends: appends.length })

    // Perform updates sequentially to avoid potential conflicts
    if (updates.length > 0) {
      console.log("Performing batch updates...")
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: updates,
        },
      })
      console.log("Batch updates completed")
    }

    if (appends.length > 0) {
      console.log("Performing appends...")
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Config!A:C",
        valueInputOption: "RAW",
        requestBody: { values: appends },
      })
      console.log("Appends completed")
    }

    console.log("All operations completed successfully")
  } catch (error) {
    console.error("Error in setAppConfig:", error)
    throw error
  }
}

export async function listDriveFiles(
  accessToken: string,
  query?: string,
  opts?: { pageSize?: number; pageToken?: string },
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const { drive } = initializeGoogleAPIs(accessToken)

  try {
    const response = await drive.files.list({
      q: query || "mimeType='text/csv' or mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id,name,mimeType,modifiedTime),nextPageToken",
      orderBy: "modifiedTime desc",
      pageSize: Math.min(100, Math.max(1, opts?.pageSize ?? 5)),
      pageToken: opts?.pageToken,
    })

    const files =
      response.data.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!,
      })) || []

    return { files, nextPageToken: (response.data as any).nextPageToken }
  } catch (error) {
    throw new Error(`Failed to list Drive files: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function downloadCSVFile(accessToken: string, fileId: string): Promise<string[][]> {
  try {
    const { drive } = initializeGoogleAPIs(accessToken)

    console.log(`Attempting to download CSV file with ID: ${fileId}`)

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

      if (row.some(cell => cell.length > 0)) {
        rows.push(row)
      }
    }

    console.log(`Successfully parsed CSV with ${rows.length} rows`)
    return rows
  } catch (error) {
    console.error(`Failed to download CSV file ${fileId}:`, error)
    throw new Error(`Failed to download CSV file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Google Sheets functions
export async function createAnnotationSheet(accessToken: string, title: string): Promise<string> {
  // Use the new function that creates spreadsheet in the correct folder
  return await createSpreadsheetInAfriBertaFolder(accessToken, title)
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
      range: "Annotations_Log!A:R",
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
            annotation.verdict || "",
            annotation.sourceUrl || "",
            (annotation.claimLinks || []).join("; "),
            annotation.claim_text_ha || "",
            annotation.claim_text_yo || "",
            annotation.article_body_ha || "",
            annotation.article_body_yo || "",
            annotation.translationLanguage || "",
          ],
        ],
      },
    })
  } catch (error) {
    throw new Error(`Failed to log annotation: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/** Append a consolidated row to the final dataset spreadsheet. */
export async function appendFinalDatasetRow(
  accessToken: string,
  spreadsheetId: string,
  row: (string | number)[],
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  // Ensure the spreadsheet has the correct headers
  await ensureFinalDatasetHeaders(accessToken, spreadsheetId)

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Annotated_Dataset!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  })
}

/** Create final dataset entries for approved annotations, handling dual-language scenarios */
export async function createFinalDatasetEntries(
  accessToken: string,
  finalSpreadsheetId: string,
  annotation: AnnotationRow,
  originalCsvData?: string[],
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  // Ensure the spreadsheet has the correct headers
  await ensureFinalDatasetHeaders(accessToken, finalSpreadsheetId)

  const baseData = {
    id: annotation.rowId,
    claim: annotation.claimText || "",
    sources: (annotation.sourceLinks || []).join("; "),
    claim_source: annotation.sourceUrl || "",
    domain: originalCsvData?.[6] || "", // Assuming domain is in column 6
    id_in_source: annotation.rowId,
  }

  const entries: (string | number)[][] = []

  // Determine source language from original CSV data or annotation
  const sourceLanguage = originalCsvData?.[4]?.trim().toLowerCase()

  if (sourceLanguage === "en" || sourceLanguage === "english") {
    // For English source, create entries for each available translation
    if (annotation.claim_text_ha) {
      entries.push([
        `${baseData.id}_ha`, // Unique ID for Hausa version
        annotation.claim_text_ha,
        annotation.verdict || "",
        "ha", // language
        annotation.translation || "", // reasoning
        baseData.sources,
        baseData.claim_source,
        baseData.domain,
        baseData.id_in_source,
      ])
    }

    if (annotation.claim_text_yo) {
      entries.push([
        `${baseData.id}_yo`, // Unique ID for Yoruba version
        annotation.claim_text_yo,
        annotation.verdict || "",
        "yo", // language
        annotation.translation || "", // reasoning
        baseData.sources,
        baseData.claim_source,
        baseData.domain,
        baseData.id_in_source,
      ])
    }
  } else {
    // For non-English source, create single entry
    entries.push([
      baseData.id,
      baseData.claim,
      annotation.verdict || "",
      sourceLanguage || "",
      annotation.translation || "", // reasoning
      baseData.sources,
      baseData.claim_source,
      baseData.domain,
      baseData.id_in_source,
    ])
  }

  // Append all entries
  if (entries.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: finalSpreadsheetId,
      range: "Annotated_Dataset!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: entries },
    })
  }
}

/**
 * Ensure the final dataset spreadsheet has the correct headers
 */
export async function ensureFinalDatasetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Annotated_Dataset!A1:I1",
    })

    const existingHeaders = response.data.values?.[0]
    const requiredHeaders = [
      "id",
      "claim",
      "label",
      "language",
      "reasoning",
      "sources",
      "claim_source",
      "domain",
      "id_in_source",
    ]

    // If headers don't exist or are incorrect, set them
    if (
      !existingHeaders ||
      existingHeaders.length === 0 ||
      !requiredHeaders.every((header, index) => existingHeaders[index] === header)
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Annotated_Dataset!A1:I1",
        valueInputOption: "RAW",
        requestBody: { values: [requiredHeaders] },
      })
    }
  } catch (error) {
    // If sheet doesn't exist, the append operation will create it with headers
    console.warn("Could not check/set headers for final dataset:", error)
  }
}

export async function getAnnotations(accessToken: string, spreadsheetId: string): Promise<AnnotationRow[]> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Annotations_Log!A2:R",
    })

    const rows = response.data.values || []
    return rows.map(row => ({
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
      verdict: row[10] || undefined,
      sourceUrl: row[11] || undefined,
      claimLinks: (row[12] || "").split("; ").filter(Boolean),
      claim_text_ha: row[13] || undefined,
      claim_text_yo: row[14] || undefined,
      article_body_ha: row[15] || undefined,
      article_body_yo: row[16] || undefined,
      translationLanguage: (row[17] as any) || undefined,
    }))
  } catch (error) {
    throw new Error(`Failed to get annotations: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function ensurePaymentSheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    // Check if Payments sheet exists and has proper headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Payments!A1:M1",
    })

    const headers = response.data.values?.[0] || []
    const expectedHeaders = [
      "Annotator_ID",
      "Total_Rows",
      "Translations",
      "Avg_Rows_Per_Hour",
      "Total_Hours",
      "Payment_Annotations",
      "Payment_Translations",
      "Total_Payment",
      "QA_Count",
      "QA_Total",
      "Approved_Annotations",
      "Approved_Translations",
      "Redeemable_Amount",
    ]

    // If headers don't match or don't exist, update them
    if (headers.length !== expectedHeaders.length || !expectedHeaders.every((h, i) => h === headers[i])) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Payments!A1:M1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [expectedHeaders],
        },
      })
    }
  } catch (error) {
    throw new Error(
      `Failed to ensure payment sheet headers: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function updatePaymentFormulas(accessToken: string, spreadsheetId: string): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    // Ensure payment sheet has proper headers
    await ensurePaymentSheetHeaders(accessToken, spreadsheetId)

    // Get current payment configuration
    const config = await getAppConfigSafe(accessToken)
    const rates = parsePaymentRatesFromConfig(config)

    const annotations = await getAnnotations(accessToken, spreadsheetId)
    const annotatorIds = [...new Set(annotations.map(a => a.annotatorId))]

    // Get current users to map annotator IDs to emails for QA counting
    const users = await getUsers(accessToken, spreadsheetId)
    const userIdToEmail = new Map(users.map(u => [u.id, u.email]))

    const paymentRows = annotatorIds.map((annotatorId, index) => {
      const rowNum = index + 2 // Starting from row 2 (after header)
      const userEmail = userIdToEmail.get(annotatorId) || annotatorId // fallback to ID if email not found
      return [
        annotatorId,
        `=COUNTIF(Annotations_Log!B:B,"${annotatorId}")`, // Total_Rows
        `=COUNTIFS(Annotations_Log!B:B,"${annotatorId}",Annotations_Log!E:E,"<>")`, // Translations
        `=IF(E${rowNum}=0,0,B${rowNum}/E${rowNum})`, // Avg_Rows_Per_Hour
        `=SUMIFS(Annotations_Log!H:H,Annotations_Log!B:B,"${annotatorId}")/60`, // Total_Hours
        `=B${rowNum}*${rates.annotation}`, // Payment_Annotations (configurable per annotation)
        `=C${rowNum}*${rates.translationRegular}`, // Payment_Translations (configurable per translation)
        `=F${rowNum}+G${rowNum}`, // Total_Payment
        `=COUNTIF(Annotations_Log!J:J,"${userEmail}")`, // QA_Count (where user performed QA - by checking verifiedBy email)
        `=I${rowNum}*${rates.qa}`, // QA_Total (QA payment)
        `=COUNTIFS(Annotations_Log!B:B,"${annotatorId}",Annotations_Log!I:I,"qa-approved")`, // Approved_Annotations
        `=COUNTIFS(Annotations_Log!B:B,"${annotatorId}",Annotations_Log!E:E,"<>",Annotations_Log!I:I,"qa-approved")`, // Approved_Translations
        `=(K${rowNum}*${rates.annotation})+(L${rowNum}*${rates.translationRegular})+(I${rowNum}*${rates.qa})`, // Redeemable_Amount (only approved items + QA)
      ]
    })

    if (paymentRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Payments!A2:M${paymentRows.length + 1}`, // Extended to include new columns
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
      range: "Payments!A2:M", // Extended to include new columns
    })

    const rows = response.data.values || []
    return rows.map(row => ({
      annotatorId: row[0] || "",
      totalRows: Number.parseInt(row[1]) || 0,
      translations: Number.parseInt(row[2]) || 0,
      avgRowsPerHour: Number.parseFloat(row[3]) || 0,
      totalHours: Number.parseFloat(row[4]) || 0,
      paymentRows: Number.parseInt(row[5]) || 0,
      paymentTranslations: Number.parseInt(row[6]) || 0,
      totalPayment: Number.parseInt(row[7]) || 0,
      qaCount: Number.parseInt(row[8]) || 0,
      qaTotal: Number.parseInt(row[9]) || 0,
      approvedAnnotations: Number.parseInt(row[10]) || 0,
      approvedTranslations: Number.parseInt(row[11]) || 0,
      redeemableAmount: Number.parseInt(row[12]) || 0,
    }))
  } catch (error) {
    throw new Error(`Failed to get payment summaries: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// User management functions for the Google Sheets database
export interface User {
  id: string
  name: string
  email: string
  role: "annotator" | "admin"
  status: "active" | "inactive"
  totalAnnotations: number
  avgTimePerRow: number
  lastActive: string
  joinedDate: string
  translationLanguages?: string // Comma-separated languages (e.g., "ha,yo")
}

export async function getUsers(accessToken: string, spreadsheetId: string): Promise<User[]> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A2:J", // Skip header row, include translation languages column
    })

    const rows = response.data.values || []
    return rows.map(row => ({
      id: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      role: (row[3] as "annotator" | "admin") || "annotator",
      status: (row[4] as "active" | "inactive") || "active",
      totalAnnotations: Number.parseInt(row[5]) || 0,
      avgTimePerRow: Number.parseFloat(row[6]) || 0,
      lastActive: row[7] || new Date().toISOString(),
      joinedDate: row[8] || new Date().toISOString(),
      translationLanguages: row[9] || "", // Comma-separated languages
    }))
  } catch (error) {
    throw new Error(`Failed to get users: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Upsert a user by email into Users sheet (append if not found, otherwise update select fields)
 */
export async function upsertUserByEmail(
  accessToken: string,
  spreadsheetId: string,
  payload: Pick<User, "email" | "name" | "id" | "role"> & Partial<User>,
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  // Read emails to find existing row
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Users!A2:J" })
  const rows = res.data.values || []

  let rowIndex = -1
  for (let i = 0; i < rows.length; i++) {
    const email = rows[i][2] || ""
    if (email.toLowerCase() === payload.email.toLowerCase()) {
      rowIndex = i
      break
    }
  }

  const now = new Date().toISOString()
  if (rowIndex === -1) {
    // Append new user
    const newUser: User = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status || "active",
      totalAnnotations: payload.totalAnnotations ?? 0,
      avgTimePerRow: payload.avgTimePerRow ?? 0,
      lastActive: now,
      joinedDate: now,
      translationLanguages: payload.translationLanguages ?? "",
    }
    await addUser(accessToken, spreadsheetId, newUser)
  } else {
    // Update existing row (only fields that may change frequently)
    const rowNumber = rowIndex + 2
    const existing = rows[rowIndex]
    const updated: User = {
      id: existing[0] || payload.id,
      name: payload.name || existing[1] || "",
      email: existing[2] || payload.email,
      role: ((existing[3] ?? payload.role) as any) || "annotator",
      status: (existing[4] as any) || "active",
      totalAnnotations: Number.parseInt(existing[5] || "0"),
      avgTimePerRow: Number.parseFloat(existing[6] || "0"),
      lastActive: now,
      joinedDate: existing[8] || now,
      translationLanguages: payload.translationLanguages ?? existing[9] ?? "",
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!A${rowNumber}:J${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            updated.id,
            updated.name,
            updated.email,
            updated.role,
            updated.status,
            updated.totalAnnotations,
            updated.avgTimePerRow,
            updated.lastActive,
            updated.joinedDate,
            updated.translationLanguages,
          ],
        ],
      },
    })
  }
}

/** Update an annotation's status and verification info by rowId */
export async function updateAnnotationStatus(
  accessToken: string,
  spreadsheetId: string,
  rowId: string,
  updates: Partial<
    Pick<AnnotationRow, "status" | "verifiedBy" | "qaComments" | "adminComments" | "isValid" | "invalidityReason">
  >,
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)
  // Read annotations to find row
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Annotations_Log!A2:R" })
  const rows = res.data.values || []
  const idx = rows.findIndex(r => (r[0] || "") === rowId)
  if (idx === -1) throw new Error(`Annotation rowId ${rowId} not found`)

  const rowNum = idx + 2
  const row = rows[idx]

  // Column mapping (extending to support new fields):
  // I=Status(8), J=Verified_By(9), K=QA_Comments(10), L=Admin_Comments(11),
  // M=Is_Valid(12), N=Invalidity_Reason(13)
  const status = updates.status ?? row[8] ?? "in-progress"
  const verifiedBy = updates.verifiedBy ?? row[9] ?? ""
  const qaComments = updates.qaComments ?? row[10] ?? ""
  const adminComments = updates.adminComments ?? row[11] ?? ""
  const isValid = updates.isValid !== undefined ? (updates.isValid ? "true" : "false") : (row[12] ?? "true")
  const invalidityReason = updates.invalidityReason ?? row[13] ?? ""

  // Update all relevant columns
  const updateData = []
  if (updates.status !== undefined)
    updateData.push({ range: `Annotations_Log!I${rowNum}:I${rowNum}`, values: [[status]] })
  if (updates.verifiedBy !== undefined)
    updateData.push({ range: `Annotations_Log!J${rowNum}:J${rowNum}`, values: [[verifiedBy]] })
  if (updates.qaComments !== undefined)
    updateData.push({ range: `Annotations_Log!K${rowNum}:K${rowNum}`, values: [[qaComments]] })
  if (updates.adminComments !== undefined)
    updateData.push({ range: `Annotations_Log!L${rowNum}:L${rowNum}`, values: [[adminComments]] })
  if (updates.isValid !== undefined)
    updateData.push({ range: `Annotations_Log!M${rowNum}:M${rowNum}`, values: [[isValid]] })
  if (updates.invalidityReason !== undefined)
    updateData.push({ range: `Annotations_Log!N${rowNum}:N${rowNum}`, values: [[invalidityReason]] })

  if (updateData.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: updateData,
      },
    })
  }
}

export async function getUnverifiedAnnotations(accessToken: string, spreadsheetId: string): Promise<AnnotationRow[]> {
  const all = await getAnnotations(accessToken, spreadsheetId)
  return all.filter(a => (a.status === "completed" || a.status === "in-progress") && !a.verifiedBy)
}

/**
 * Anonymize all annotations created by a given annotator by replacing Annotator_ID with 'anonymous'
 * and clearing Verified_By. This preserves annotation content for research while removing identity linkage.
 */
export async function anonymizeAnnotationsByAnnotator(
  accessToken: string,
  spreadsheetId: string,
  annotatorId: string,
): Promise<{ updated: number }> {
  const { sheets } = initializeGoogleAPIs(accessToken)
  // Read all annotations
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Annotations_Log!A2:R" })
  const rows = res.data.values || []
  if (rows.length === 0) return { updated: 0 }

  // Find row numbers where column B (index 1) matches annotatorId
  const toUpdate: number[] = []
  rows.forEach((r, idx) => {
    if ((r[1] || "") === annotatorId) toUpdate.push(idx + 2) // +2 to account for header and 1-based rows
  })

  if (toUpdate.length === 0) return { updated: 0 }

  // Prepare batch updates: set B (Annotator_ID) to 'anonymous' and J (Verified_By) to ''
  const data = toUpdate.flatMap(rowNum => [
    { range: `Annotations_Log!B${rowNum}:B${rowNum}`, values: [["anonymous"]] },
    { range: `Annotations_Log!J${rowNum}:J${rowNum}`, values: [[""]] },
  ])

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data },
  })

  return { updated: toUpdate.length }
}

export async function addUser(accessToken: string, spreadsheetId: string, user: User): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Users!A:J",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            user.id,
            user.name,
            user.email,
            user.role,
            user.status,
            user.totalAnnotations,
            user.avgTimePerRow,
            user.lastActive,
            user.joinedDate,
            user.translationLanguages || "",
          ],
        ],
      },
    })
  } catch (error) {
    throw new Error(`Failed to add user: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function updateUser(
  accessToken: string,
  spreadsheetId: string,
  userId: string,
  updates: Partial<User>,
): Promise<void> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    // First, find the user's row
    const users = await getUsers(accessToken, spreadsheetId)
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found`)
    }

    // Update the user data
    const updatedUser = { ...users[userIndex], ...updates }
    const rowNumber = userIndex + 2 // +2 because array is 0-indexed and we skip header row

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!A${rowNumber}:I${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            updatedUser.id,
            updatedUser.name,
            updatedUser.email,
            updatedUser.role,
            updatedUser.status,
            updatedUser.totalAnnotations,
            updatedUser.avgTimePerRow,
            updatedUser.lastActive,
            updatedUser.joinedDate,
          ],
        ],
      },
    })
  } catch (error) {
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get final annotated dataset for export
 */
export async function getFinalDataset(accessToken: string, spreadsheetId: string): Promise<any[]> {
  const { sheets } = initializeGoogleAPIs(accessToken)

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Annotated_Dataset!A:Z",
    })

    const rows = response.data.values || []
    if (rows.length === 0) return []

    // First row is header, convert remaining rows to objects
    const header = rows[0]
    return rows.slice(1).map(row => {
      const obj: any = {}
      header.forEach((col, index) => {
        obj[col] = row[index] || ""
      })
      return obj
    })
  } catch (error) {
    console.warn(
      `Failed to fetch final dataset from sheet "Annotated_Dataset":`,
      error instanceof Error ? error.message : "Unknown error",
    )
    // Return empty array instead of throwing - this allows the app to continue working
    // even if the final dataset sheet is missing or has wrong name
    return []
  }
}
