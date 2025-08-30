"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Database, Plus, ExternalLink, Settings } from "lucide-react"
import { setSpreadsheetId, setCSVFileId, getSpreadsheetId, getCSVFileId } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

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

  useEffect(() => {
    setCurrentSpreadsheetIdState(getSpreadsheetId())
    setCurrentCSVFileIdState(getCSVFileId())
    loadDriveFiles()
  }, [])

  const findFactChecksCSV = async () => {
    try {
      const response = await fetch("/api/drive/factchecks-csv")
      if (!response.ok) throw new Error("Failed to find factchecks.csv")

      const { fileId } = await response.json()
      setCSVFileId(fileId)
      setCurrentCSVFileIdState(fileId)

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

  const loadDriveFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/drive/files")
      
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Admin access required for drive configuration")
        }
        throw new Error("Failed to load Drive files")
      }

      const { files } = await response.json()
      setDriveFiles(files)
    } catch (error) {
      // console.error("Error loading Drive files:", error)
      toast({
//         title: "Error",
        description: "Failed to load Drive files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
      const response = await fetch("/api/sheets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSheetTitle }),
      })

      if (!response.ok) throw new Error("Failed to create annotation sheet")

      const { spreadsheetId } = await response.json()
      setSpreadsheetId(spreadsheetId)
      setCurrentSpreadsheetIdState(spreadsheetId)
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

  const handleSelectCSVFile = (fileId: string) => {
    setCSVFileId(fileId)
    setCurrentCSVFileIdState(fileId)
    toast({
      title: "Success",
      description: "CSV file selected successfully!",
    })
  }

  const handleSelectSpreadsheet = (fileId: string) => {
    setSpreadsheetId(fileId)
    setCurrentSpreadsheetIdState(fileId)
    toast({
      title: "Success",
      description: "Spreadsheet selected successfully!",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

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
            <Button variant="outline" onClick={loadDriveFiles} disabled={isLoading}>
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
