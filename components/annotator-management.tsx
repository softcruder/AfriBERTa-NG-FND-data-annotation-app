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

  useEffect(() => {
    loadAnnotators()
  }, [])

  const loadAnnotators = async () => {
    try {
      // Mock data for now - in real implementation, this would come from your user management system
      const mockAnnotators: Annotator[] = [
        {
          id: "user_1",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "annotator",
          status: "active",
          totalAnnotations: 45,
          avgTimePerRow: 8.5,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          joinedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        },
        {
          id: "user_2",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          role: "annotator",
          status: "active",
          totalAnnotations: 32,
          avgTimePerRow: 12.3,
          lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          joinedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        },
        {
          id: "user_3",
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          role: "annotator",
          status: "inactive",
          totalAnnotations: 18,
          avgTimePerRow: 15.7,
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          joinedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        },
      ]

      setAnnotators(mockAnnotators)
    } catch (error) {
      console.error("Error loading annotators:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteAnnotator = async () => {
    if (!newAnnotatorEmail.trim()) {
      alert("Please enter an email address")
      return
    }

    try {
      // In real implementation, this would send an invitation email
      console.log("Inviting annotator:", { email: newAnnotatorEmail, role: newAnnotatorRole })

      // Mock adding to list
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

      alert("Invitation sent successfully!")
    } catch (error) {
      console.error("Error inviting annotator:", error)
      alert("Failed to send invitation")
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
      <Badge variant="default" className="bg-green-100 text-green-800">
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
                        <CheckCircle className="h-4 w-4 text-green-500" />
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
