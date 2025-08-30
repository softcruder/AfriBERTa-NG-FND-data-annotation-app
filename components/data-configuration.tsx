"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Database, Plus, ExternalLink, Settings } from "lucide-react"
import { setSpreadsheetId, setCSVFileId, getSpreadsheetId, getCSVFileId } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { useDriveFiles, useFactChecksCSVFileId } from "@/custom-hooks/useDrive"
import { useConfig } from "@/custom-hooks/useConfig"
import { useRequest } from "@/hooks/useRequest"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

export function DataConfiguration() {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSpreadsheetId, setCurrentSpreadsheetIdState] = useState<string | null>(null)
  const [currentCSVFileId, setCurrentCSVFileIdState] = useState<string | null>(null)
  const [newSheetTitle, setNewSheetTitle] = useState("")
  const { toast } = useToast()
  const { data: driveFilesData, mutate: refreshDrive, isLoading: driveLoading } = useDriveFiles()
  const { fileId: factChecksFileId } = useFactChecksCSVFileId()
  const { config, mutate: mutateConfig } = useConfig()
  const { request } = useRequest<any>()

  const loadDriveFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      if (driveFilesData && Array.isArray(driveFilesData)) setDriveFiles(driveFilesData as any)
      else setDriveFiles([])
    } catch {
      toast({ description: "Failed to load Drive files", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast, driveFilesData])

  useEffect(() => {
    // Load persisted config from backend, then fall back to any local values for backward compatibility
    ;(async () => {
      try {
        const sheetId = config?.ANNOTATION_SPREADSHEET_ID || getSpreadsheetId()
        const csvId = config?.CSV_FILE_ID || getCSVFileId()
        if (sheetId) {
          setSpreadsheetId(sheetId)
          setCurrentSpreadsheetIdState(sheetId)
        }
        if (csvId) {
          setCSVFileId(csvId)
          setCurrentCSVFileIdState(csvId)
        }
      } catch {
        setCurrentSpreadsheetIdState(getSpreadsheetId())
        setCurrentCSVFileIdState(getCSVFileId())
      }
      loadDriveFiles()
    })()
  }, [loadDriveFiles, config])

  const findFactChecksCSV = async () => {
    try {
      const fileId = factChecksFileId
      if (!fileId) throw new Error("Failed to find factchecks.csv")
      setCSVFileId(fileId)
      setCurrentCSVFileIdState(fileId)
      // Persist to App Config
      await request.post("/config", { entries: { CSV_FILE_ID: fileId } })
      await mutateConfig()

      toast({
        title: "Success",
        description: "Found and selected factchecks.csv from FactCheckScraper-v4.1 folder",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not find factchecks.csv in FactCheckScraper-v4.1 folder",
        variant: "destructive",
      })
    }
  }

  // loadDriveFiles moved above into useCallback

  const handleCreateAnnotationSheet = async () => {
    if (!newSheetTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for the annotation sheet",
        variant: "destructive",
      })
      return
    }

    try {
      const resp = await request.post("/sheets/create", {
        title: newSheetTitle,
      })
      const { spreadsheetId } = resp as { spreadsheetId: string }
      setSpreadsheetId(spreadsheetId)
      setCurrentSpreadsheetIdState(spreadsheetId)
      // Persist to App Config
      await request.post("/config", { entries: { ANNOTATION_SPREADSHEET_ID: spreadsheetId } })
      await mutateConfig()
      setNewSheetTitle("")

      toast({
        title: "Success",
        description: "Annotation sheet created successfully!",
        variant: "default",
      })
    } catch (error) {
      // console.error("Error creating annotation sheet:", error)
      toast({
        title: "Error",
        description: "Failed to create annotation sheet",
        variant: "destructive",
      })
    }
  }

  const handleSelectCSVFile = async (fileId: string) => {
    setCSVFileId(fileId)
    setCurrentCSVFileIdState(fileId)
    // Persist to App Config
    try {
      await request.post("/config", { entries: { CSV_FILE_ID: fileId } })
      await mutateConfig()
    } catch {}
    toast({
      title: "Success",
      description: "CSV file selected successfully!",
    })
  }

  const handleSelectSpreadsheet = async (fileId: string) => {
    setSpreadsheetId(fileId)
    setCurrentSpreadsheetIdState(fileId)
    // Persist to App Config
    try {
      await request.post("/config", { entries: { ANNOTATION_SPREADSHEET_ID: fileId } })
      await mutateConfig()
    } catch {}
    toast({
      title: "Success",
      description: "Spreadsheet selected successfully!",
    })
  }

  // use shared formatDate from lib/utils

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("csv")) return <FileText className="h-4 w-4 text-orange-600" />
    if (mimeType.includes("spreadsheet")) return <Database className="h-4 w-4 text-blue-600" />
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.includes("csv"))
      return (
        <Badge variant="default" className="bg-orange-100 text-orange-800">
          CSV
        </Badge>
      )
    if (mimeType.includes("spreadsheet"))
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          Sheet
        </Badge>
      )
    return <Badge variant="outline">File</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Current Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Source CSV File
            </CardTitle>
            <CardDescription>The raw data file containing claims to annotate</CardDescription>
          </CardHeader>
          <CardContent>
            {currentCSVFileId ? (
              <div className="space-y-2">
                <Badge variant="default" className="bg-orange-100 text-orange-800">
                  Configured
                </Badge>
                <p className="text-sm text-muted-foreground">File ID: {currentCSVFileId}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://drive.google.com/file/d/${currentCSVFileId}`, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Drive
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary">Not Configured</Badge>
                <p className="text-sm text-muted-foreground">Select a CSV file from the list below</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Annotation Sheet
            </CardTitle>
            <CardDescription>Google Sheet for logging annotations and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {currentSpreadsheetId ? (
              <div className="space-y-2">
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Configured
                </Badge>
                <p className="text-sm text-muted-foreground">Sheet ID: {currentSpreadsheetId}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}`, "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Sheets
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary">Not Configured</Badge>
                <p className="text-sm text-muted-foreground">Create a new sheet or select existing one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Annotation Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Annotation Sheet</CardTitle>
          <CardDescription>Create a new Google Sheet with the proper schema for annotations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="sheet-title">Sheet Title</Label>
              <Input
                id="sheet-title"
                placeholder="Fake News Annotations - 2024"
                value={newSheetTitle}
                onChange={e => setNewSheetTitle(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateAnnotationSheet}>
                <Plus className="mr-2 h-4 w-4" />
                Create Sheet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Configuration for Required Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Automatically configure with required source data from FactCheckScraper-v4.1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={findFactChecksCSV} className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Find factchecks.csv
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Files</CardTitle>
              <CardDescription>CSV files and Google Sheets from your Drive</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refreshDrive()
                loadDriveFiles()
              }}
              disabled={isLoading || driveLoading}
            >
              <Settings className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading files...</div>
          ) : driveFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driveFiles.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getFileTypeBadge(file.mimeType)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(file.modifiedTime)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {file.mimeType.includes("csv") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCSVFile(file.id)}
                            disabled={currentCSVFileId === file.id}
                          >
                            {currentCSVFileId === file.id ? "Selected" : "Use as Source"}
                          </Button>
                        )}
                        {file.mimeType.includes("spreadsheet") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectSpreadsheet(file.id)}
                            disabled={currentSpreadsheetId === file.id}
                          >
                            {currentSpreadsheetId === file.id ? "Selected" : "Use for Annotations"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://drive.google.com/file/d/${file.id}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
