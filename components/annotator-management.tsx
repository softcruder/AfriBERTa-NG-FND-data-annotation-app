"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Clock, CheckCircle, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useUsers, useUpdateUser } from "@/custom-hooks"
import { useRequest } from "@/hooks/useRequest"

interface Annotator {
  id: string
  name: string
  email: string
  role: "annotator" | "admin"
  status: "active" | "inactive"
  totalAnnotations: number
  avgTimePerRow: number
  lastActive: string
  joinedDate: string
}

export function AnnotatorManagement() {
  const { toast } = useToast()
  const { spreadsheetId, config, refresh: refreshSession } = useAuth()
  const { data: swrUsers, isLoading: usersLoading, mutate } = useUsers(spreadsheetId)
  const { update } = useUpdateUser()
  const { request } = useRequest<{ success: boolean }>()

  // Derive list directly from SWR when not locally modified by us
  const remoteAnnotators: Annotator[] = Array.isArray(swrUsers) ? (swrUsers as Annotator[]) : []
  const isLoading = usersLoading && remoteAnnotators.length === 0

  // Admin configuration (from Config sheet)
  const initialAdmins = useMemo(() => (config?.ADMIN_EMAILS as string) || "", [config])
  const [adminEmails, setAdminEmails] = useState<string>(initialAdmins)
  // keep in sync when config changes
  if (adminEmails !== initialAdmins && initialAdmins && adminEmails === "") {
    // when config arrives first time
    setAdminEmails(initialAdmins)
  }

  const handleSaveAdmins = async () => {
    try {
      const value = adminEmails.trim()
      await request.post("/config", { entries: { ADMIN_EMAILS: value } })
      await refreshSession()
      toast({ title: "Saved", description: "Admin emails updated." })
    } catch (e) {
      toast({ title: "Error", description: "Failed to update admin emails", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (annotatorId: string) => {
    try {
      if (!spreadsheetId) return

      const annotator = remoteAnnotators.find(a => a.id === annotatorId)
      if (!annotator) return

      const newStatus = annotator.status === "active" ? "inactive" : "active"

      await update({ spreadsheetId, userId: annotatorId, updates: { status: newStatus } })
      await mutate()
    } catch (error) {
      // console.error("Error updating annotator status:", error)
    }
  }

  const handleRoleChange = async (annotatorId: string, newRole: "annotator" | "admin") => {
    try {
      if (!spreadsheetId) return

      await update({ spreadsheetId, userId: annotatorId, updates: { role: newRole } })
      await mutate()
    } catch (error) {
      // console.error("Error updating annotator role:", error)
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return "Just now"
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-orange-100 text-orange-800">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="default" className="bg-blue-100 text-blue-800">
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">Annotator</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Configuration</CardTitle>
          <CardDescription>Manage admin emails from the Config sheet (comma-separated)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="admins">Admin Emails</Label>
              <Input
                id="admins"
                type="text"
                placeholder="admin1@example.com, admin2@example.com"
                value={adminEmails}
                onChange={e => setAdminEmails(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveAdmins}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Annotators List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage annotator accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading annotators...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Annotator</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Annotations</TableHead>
                  <TableHead>Avg Time/Row</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remoteAnnotators.map(annotator => (
                  <TableRow key={annotator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {annotator.name
                              .split(" ")
                              .map(n => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{annotator.name}</div>
                          <div className="text-sm text-muted-foreground">{annotator.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(annotator.role)}</TableCell>
                    <TableCell>{getStatusBadge(annotator.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                        {annotator.totalAnnotations}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {annotator.avgTimePerRow.toFixed(1)}m
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(annotator.lastActive)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(annotator.id)}>
                          {annotator.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Role</DialogTitle>
                              <DialogDescription>Update the role for {annotator.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Select
                                value={annotator.role}
                                onValueChange={(value: "annotator" | "admin") => handleRoleChange(annotator.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="annotator">Annotator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </DialogContent>
                        </Dialog>
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
