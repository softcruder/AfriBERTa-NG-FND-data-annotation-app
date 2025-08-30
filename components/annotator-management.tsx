"use client"

import { useState, useEffect } from "react"
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
import { UserPlus, Shield, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [annotators, setAnnotators] = useState<Annotator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newAnnotatorEmail, setNewAnnotatorEmail] = useState("")
  const [newAnnotatorRole, setNewAnnotatorRole] = useState<"annotator" | "admin">("annotator")
  const { toast } = useToast()

  useEffect(() => {
    loadAnnotators()
  }, [])

  const loadAnnotators = async () => {
    try {
      // In production, this would fetch from your user management system/API
      // For now, load from spreadsheet annotations to get actual annotator data
      const spreadsheetId = localStorage.getItem("annotation_spreadsheet_id")
      if (spreadsheetId) {
        const response = await fetch(`/api/annotations?spreadsheetId=${spreadsheetId}`)
        if (response.ok) {
          const { annotations } = await response.json()
          
          // Extract unique annotators from annotation data
          const annotatorStats = new Map<string, any>()
          
          annotations.forEach((annotation: any) => {
            const id = annotation.annotatorId
            if (!annotatorStats.has(id)) {
              annotatorStats.set(id, {
                id,
                email: id, // In production, resolve ID to email from user directory
                name: `User ${id.slice(-4)}`, // In production, fetch real names
                role: "annotator",
                status: "active",
                totalAnnotations: 0,
                avgTimePerRow: 0,
                lastActive: annotation.startTime,
                joinedDate: annotation.startTime,
                totalTime: 0,
              })
            }
            
            const stats = annotatorStats.get(id)
            stats.totalAnnotations++
            if (annotation.durationMinutes) {
              stats.totalTime += annotation.durationMinutes
            }
            // Update last active if this annotation is more recent
            if (new Date(annotation.startTime) > new Date(stats.lastActive)) {
              stats.lastActive = annotation.startTime
            }
          })
          
          // Calculate average time per row
          const annotatorList = Array.from(annotatorStats.values()).map(stats => ({
            ...stats,
            avgTimePerRow: stats.totalAnnotations > 0 ? stats.totalTime / stats.totalAnnotations : 0,
          }))
          
          setAnnotators(annotatorList)
        }
      }
    } catch (error) {
      console.error("Error loading annotators:", error)
      toast({
        title: "Error",
        description: "Failed to load annotator data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteAnnotator = async () => {
    if (!newAnnotatorEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    try {
      // In production, this would send an invitation email via API
      console.log("Inviting annotator:", { email: newAnnotatorEmail, role: newAnnotatorRole })

      // For now, add to local list (in production, this would be handled by the backend)
      const newAnnotator: Annotator = {
        id: `user_${Date.now()}`,
        name: newAnnotatorEmail.split("@")[0],
        email: newAnnotatorEmail,
        role: newAnnotatorRole,
        status: "inactive", // Will be active once they accept invitation
        totalAnnotations: 0,
        avgTimePerRow: 0,
        lastActive: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
      }

      setAnnotators((prev) => [...prev, newAnnotator])
      setNewAnnotatorEmail("")
      setNewAnnotatorRole("annotator")

      toast({
        title: "Success",
        description: "Invitation sent successfully!",
      })
    } catch (error) {
      console.error("Error inviting annotator:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (annotatorId: string) => {
    try {
      setAnnotators((prev) =>
        prev.map((annotator) =>
          annotator.id === annotatorId
            ? { ...annotator, status: annotator.status === "active" ? "inactive" : "active" }
            : annotator,
        ),
      )
    } catch (error) {
      console.error("Error updating annotator status:", error)
    }
  }

  const handleRoleChange = async (annotatorId: string, newRole: "annotator" | "admin") => {
    try {
      setAnnotators((prev) =>
        prev.map((annotator) => (annotator.id === annotatorId ? { ...annotator, role: newRole } : annotator)),
      )
    } catch (error) {
      console.error("Error updating annotator role:", error)
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
      {/* Invite New Annotator */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Annotator</CardTitle>
          <CardDescription>Send an invitation to join the annotation team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="annotator@example.com"
                value={newAnnotatorEmail}
                onChange={(e) => setNewAnnotatorEmail(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newAnnotatorRole}
                onValueChange={(value: "annotator" | "admin") => setNewAnnotatorRole(value)}
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
            <div className="flex items-end">
              <Button onClick={handleInviteAnnotator}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </div>
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
                {annotators.map((annotator) => (
                  <TableRow key={annotator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {annotator.name
                              .split(" ")
                              .map((n) => n[0])
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
