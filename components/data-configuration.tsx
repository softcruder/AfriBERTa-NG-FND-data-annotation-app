"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FileText, Database, Plus, ExternalLink, Settings, MoreVertical, Filter } from "lucide-react"
// Stop using localStorage for configuration: rely on backend Config via useAuth
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { useDriveFiles, useFactChecksCSVFileId } from "@/custom-hooks/useDrive"
import { useAuth } from "@/custom-hooks/useAuth"
import { useRequest } from "@/hooks/useRequest"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

export function DataConfiguration() {
  const [refreshing, setRefreshing] = useState(false)
  const [currentSpreadsheetId, setCurrentSpreadsheetIdState] = useState<string | null>(null)
  const [currentCSVFileId, setCurrentCSVFileIdState] = useState<string | null>(null)
  const [currentFinalDatasetId, setCurrentFinalDatasetId] = useState<string | null>(null)
  const [newSheetTitle, setNewSheetTitle] = useState("")
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all")
  const [loadedPages, setLoadedPages] = useState<string[]>([])
  const { toast } = useToast()
  const [drivePageToken, setDrivePageToken] = useState<string | undefined>(undefined)
  const {
    data: driveFilesData,
    nextPageToken,
    mutate: refreshDrive,
    isLoading: driveLoading,
  } = useDriveFiles({
    pageSize: 10,
    pageToken: drivePageToken,
  })
  const { fileId: factChecksFileId } = useFactChecksCSVFileId()
  const { config, refresh: refreshSession, loading: configLoading } = useAuth()
  const { request } = useRequest<any>()

  useEffect(() => {
    // Always source from backend config
    setCurrentSpreadsheetIdState(config?.ANNOTATION_SPREADSHEET_ID || null)
    setCurrentCSVFileIdState(config?.CSV_FILE_ID || null)
    setCurrentFinalDatasetId(config?.FINAL_DATASET_SPREADSHEET_ID || null)
  }, [config])

  const driveFiles: DriveFile[] = useMemo(() => {
    if (!driveFilesData) return []
    const files = Array.isArray(driveFilesData) ? (driveFilesData as DriveFile[]) : []

    // Apply filter based on source type
    if (sourceTypeFilter === "csv") {
      return files.filter(file => file.mimeType.includes("csv"))
    } else if (sourceTypeFilter === "sheet") {
      return files.filter(file => file.mimeType.includes("spreadsheet"))
    }
    return files
  }, [driveFilesData, sourceTypeFilter])

  const loadMoreFiles = () => {
    if (nextPageToken && !loadedPages.includes(nextPageToken)) {
      setLoadedPages(prev => [...prev, nextPageToken])
      setDrivePageToken(nextPageToken)
    }
  }

  const findFactChecksCSV = async () => {
    try {
      const fileId = factChecksFileId
      if (!fileId) throw new Error("Failed to find factchecks.csv")
      setCurrentCSVFileIdState(fileId)
      // Persist to App Config
      await request.post("/config", { entries: { CSV_FILE_ID: fileId } })
      await refreshSession()

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
      setCurrentSpreadsheetIdState(spreadsheetId)
      // Persist to App Config
      await request.post("/config", { entries: { ANNOTATION_SPREADSHEET_ID: spreadsheetId } })
      await refreshSession()
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
    setCurrentCSVFileIdState(fileId)
    // Persist to App Config
    try {
      await request.post("/config", { entries: { CSV_FILE_ID: fileId } })
      await refreshSession()
    } catch {}
    toast({
      title: "Success",
      description: "CSV file selected successfully!",
    })
  }

  const handleSelectSpreadsheet = async (fileId: string) => {
    setCurrentSpreadsheetIdState(fileId)
    // Persist to App Config
    try {
      await request.post("/config", { entries: { ANNOTATION_SPREADSHEET_ID: fileId } })
      await refreshSession()
    } catch {}
    toast({
      title: "Success",
      description: "Spreadsheet selected successfully!",
    })
  }

  const handleSelectFinalDataset = async (fileId: string) => {
    setCurrentFinalDatasetId(fileId)
    try {
      await request.post("/config", { entries: { FINAL_DATASET_SPREADSHEET_ID: fileId } })
      await refreshSession()
    } catch {}
    toast({ title: "Success", description: "Final dataset sheet selected." })
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

  const FileActionsDropdown = ({ file }: { file: DriveFile }) => {
    const isCSVSelected = currentCSVFileId === file.id
    const isAnnotationSheetSelected = currentSpreadsheetId === file.id
    const isFinalDatasetSelected = currentFinalDatasetId === file.id
    const isCSV = file.mimeType.includes("csv")
    const isSpreadsheet = file.mimeType.includes("spreadsheet")

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleSelectCSVFile(file.id)} disabled={isCSVSelected}>
            <FileText className="mr-2 h-4 w-4" />
            {isCSVSelected ? "✓ Selected as Source" : "Use as Source"}
          </DropdownMenuItem>
          {isSpreadsheet && (
            <>
              <DropdownMenuItem onClick={() => handleSelectSpreadsheet(file.id)} disabled={isAnnotationSheetSelected}>
                <Database className="mr-2 h-4 w-4" />
                {isAnnotationSheetSelected ? "✓ Selected for Annotations" : "Use for Annotations"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectFinalDataset(file.id)} disabled={isFinalDatasetSelected}>
                <Database className="mr-2 h-4 w-4" />
                {isFinalDatasetSelected ? "✓ Selected as Final Dataset" : "Use as Final Dataset"}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open(`https://drive.google.com/file/d/${file.id}`, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Drive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const ConfigurationCardSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardContent>
    </Card>
  )

  const FileTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="w-12">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const ActionCardSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex items-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Current Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configLoading ? (
          <>
            <ConfigurationCardSkeleton />
            <ConfigurationCardSkeleton />
            <ConfigurationCardSkeleton />
          </>
        ) : (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Final Dataset Sheet
                </CardTitle>
                <CardDescription>Destination for combined annotated dataset</CardDescription>
              </CardHeader>
              <CardContent>
                {currentFinalDatasetId ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Configured
                    </Badge>
                    <p className="text-sm text-muted-foreground">Sheet ID: {currentFinalDatasetId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`https://docs.google.com/spreadsheets/d/${currentFinalDatasetId}`, "_blank")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in Sheets
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="secondary">Not Configured</Badge>
                    <p className="text-sm text-muted-foreground">Pick a spreadsheet below</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Create New Annotation Sheet */}
      {configLoading ? (
        <ActionCardSkeleton />
      ) : (
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
      )}

      {/* Auto-Configuration for Required Files */}
      {configLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-full" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

      {/* Available Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Files</CardTitle>
              <CardDescription>CSV files and Google Sheets from your Drive</CardDescription>
            </div>
            {configLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="csv">CSV Only</SelectItem>
                    <SelectItem value="sheet">Sheets Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setRefreshing(true)
                      setLoadedPages([])
                      setDrivePageToken(undefined)
                      await refreshDrive()
                    } finally {
                      setRefreshing(false)
                    }
                  }}
                  isLoading={refreshing || driveLoading}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {refreshing || (driveLoading && driveFiles.length === 0) ? (
            <FileTableSkeleton />
          ) : driveFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sourceTypeFilter === "all" ? "No files found" : `No ${sourceTypeFilter.toUpperCase()} files found`}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
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
                        <FileActionsDropdown file={file} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {nextPageToken && (
                <div className="flex justify-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={loadMoreFiles}
                    isLoading={driveLoading}
                    className="w-full max-w-xs"
                  >
                    Load More Files
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
