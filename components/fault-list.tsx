"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Clock, MapPin, Edit } from "lucide-react"
import type { Fault } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { EditFaultModal } from "./edit-fault-modal"

interface FaultListProps {
  faults: Fault[]
  onUpdateStatus: (id: string, status: Fault["status"]) => void
  onUpdateFault: (id: string, updates: Partial<Fault>) => void
}

export function FaultList({ faults, onUpdateStatus, onUpdateFault }: FaultListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [editingFault, setEditingFault] = useState<Fault | null>(null)

  const getSeverityColor = (severity: Fault["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getStatusColor = (status: Fault["status"]) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800 border-red-200"
      case "investigating":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const filteredFaults = faults.filter((fault) => {
    const matchesSearch =
      fault.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.trunkLine.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || fault.status === statusFilter
    const matchesSeverity = severityFilter === "all" || fault.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm font-medium">
            Search Faults
          </Label>
          <Input
            id="search"
            placeholder="Search by ID, location, description, or trunk line..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severityFilter" className="text-sm font-medium">
              Severity
            </Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredFaults.length} of {faults.length} faults
        </p>
        {(searchTerm || statusFilter !== "all" || severityFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setSeverityFilter("all")
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {filteredFaults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{faults.length === 0 ? "No faults reported" : "No faults match your search criteria"}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Fault ID</TableHead>
                <TableHead className="w-48">Location</TableHead>
                <TableHead className="w-96">Description</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-40">Reported</TableHead>
                <TableHead className="w-40">Est. Repair</TableHead>
                <TableHead className="w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaults.map((fault) => (
                <TableRow key={fault.id} className="align-top">
                  <TableCell className="font-medium py-4">{fault.id}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{fault.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap max-w-md">
                      {fault.description}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getSeverityColor(fault.severity)}>{fault.severity.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={getStatusColor(fault.status)}>{fault.status.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{formatDate(fault.reportedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {fault.estimatedRepair ? (
                      <div className="text-sm text-gray-600 leading-relaxed">{formatDate(fault.estimatedRepair)}</div>
                    ) : (
                      <span className="text-gray-400">TBD</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-2">
                      <Select
                        value={fault.status}
                        onValueChange={(value) => onUpdateStatus(fault.id, value as Fault["status"])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => setEditingFault(fault)} className="w-32">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Fault Modal */}
      {editingFault && (
        <EditFaultModal
          fault={editingFault}
          onSave={(updatedFault) => {
            onUpdateFault(editingFault.id, updatedFault)
            setEditingFault(null)
          }}
          onCancel={() => setEditingFault(null)}
        />
      )}
    </div>
  )
}
