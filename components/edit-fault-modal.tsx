"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import type { Fault } from "@/app/page"

interface EditFaultModalProps {
  fault: Fault
  onSave: (updates: Partial<Fault>) => void
  onCancel: () => void
}

export function EditFaultModal({ fault, onSave, onCancel }: EditFaultModalProps) {
  const [formData, setFormData] = useState({
    location: fault.location,
    description: fault.description,
    severity: fault.severity,
    status: fault.status,
    trunkLine: fault.trunkLine,
    estimatedRepair: fault.estimatedRepair ? fault.estimatedRepair.toISOString().slice(0, 16) : "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: Partial<Fault> = {
      location: formData.location,
      description: formData.description,
      severity: formData.severity,
      status: formData.status,
      trunkLine: formData.trunkLine,
      estimatedRepair: formData.estimatedRepair ? new Date(formData.estimatedRepair) : undefined,
    }

    onSave(updates)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Edit Fault {fault.id}</CardTitle>
            <CardDescription>Update fault information and status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Trunk - Sector A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trunkLine">Trunk Line</Label>
              <Select
                value={formData.trunkLine}
                onValueChange={(value) => setFormData({ ...formData, trunkLine: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trunk line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trunk-a">Los Angeles, CA</SelectItem>
                  <SelectItem value="trunk-b">Washington DC</SelectItem>
                  <SelectItem value="trunk-c">Chicago, IL</SelectItem>
                  <SelectItem value="trunk-d">Miami, FL</SelectItem>
                  <SelectItem value="backup-1">Denver, CO (Backup)</SelectItem>
                  <SelectItem value="backup-2">Atlanta, GA (Backup)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the fault in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value as Fault["severity"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Fault["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedRepair">Estimated Repair Time (Optional)</Label>
              <Input
                id="estimatedRepair"
                type="datetime-local"
                value={formData.estimatedRepair}
                onChange={(e) => setFormData({ ...formData, estimatedRepair: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
