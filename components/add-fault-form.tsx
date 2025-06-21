"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X, ArrowRight } from "lucide-react"
import type { Fault } from "@/app/page"
import { Router, Cable } from "lucide-react"
import type { NetworkDevice, NetworkLink } from "@/app/page"

interface AddFaultFormProps {
  onSubmit: (fault: Omit<Fault, "id" | "reportedAt">) => void
  onCancel: () => void
  networkDevices: NetworkDevice[]
  networkLinks: NetworkLink[]
}

const getTrunkLineName = (trunkLine: string) => {
  const trunkNames: Record<string, string> = {
    "trunk-a": "Los Angeles, CA",
    "trunk-b": "Washington DC",
    "trunk-c": "Chicago, IL",
    "trunk-d": "Miami, FL",
    "backup-1": "Denver, CO (Backup)",
    "backup-2": "Atlanta, GA (Backup)",
  }
  return trunkNames[trunkLine] || trunkLine
}

export function AddFaultForm({ onSubmit, onCancel, networkDevices, networkLinks }: AddFaultFormProps) {
  const [formData, setFormData] = useState({
    primaryDevice: "",
    secondaryDevice: "",
    description: "",
    severity: "medium" as Fault["severity"],
    status: "active" as Fault["status"],
    estimatedRepair: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const primaryDev = networkDevices.find((d) => d.id === formData.primaryDevice)
    if (!primaryDev) return

    let location = `${primaryDev.name} - ${primaryDev.location}`
    let trunkLine = primaryDev.trunkLine

    // If secondary device is selected, create a link-based fault
    if (formData.secondaryDevice) {
      const secondaryDev = networkDevices.find((d) => d.id === formData.secondaryDevice)
      if (secondaryDev) {
        location = `${primaryDev.name} ↔ ${secondaryDev.name} Link`
        // Use the trunk line that has higher priority or the primary device's trunk line
        trunkLine = primaryDev.trunkLine
      }
    }

    const fault: Omit<Fault, "id" | "reportedAt"> = {
      location,
      description: formData.description,
      severity: formData.severity,
      status: formData.status,
      trunkLine,
      estimatedRepair: formData.estimatedRepair ? new Date(formData.estimatedRepair) : undefined,
    }

    onSubmit(fault)
  }

  const getDeviceInfo = (deviceId: string) => {
    return networkDevices.find((d) => d.id === deviceId)
  }

  const getDeviceLinks = (deviceId: string) => {
    return networkLinks.filter((link) => link.sourceDeviceId === deviceId || link.targetDeviceId === deviceId)
  }

  const getLinkBetweenDevices = (device1Id: string, device2Id: string) => {
    return networkLinks.find(
      (link) =>
        (link.sourceDeviceId === device1Id && link.targetDeviceId === device2Id) ||
        (link.sourceDeviceId === device2Id && link.targetDeviceId === device1Id),
    )
  }

  const primaryDevice = getDeviceInfo(formData.primaryDevice)
  const secondaryDevice = getDeviceInfo(formData.secondaryDevice)
  const primaryLinks = formData.primaryDevice ? getDeviceLinks(formData.primaryDevice) : []
  const secondaryLinks = formData.secondaryDevice ? getDeviceLinks(formData.secondaryDevice) : []
  const linkBetweenDevices =
    formData.primaryDevice && formData.secondaryDevice
      ? getLinkBetweenDevices(formData.primaryDevice, formData.secondaryDevice)
      : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Report New Fault</CardTitle>
            <CardDescription>Add a new fault to the monitoring system</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Device Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryDevice">Primary Device *</Label>
                <Select
                  value={formData.primaryDevice}
                  onValueChange={(value) => {
                    setFormData({ ...formData, primaryDevice: value, secondaryDevice: "" })
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary device" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        <div className="flex items-center gap-2">
                          {device.type === "switch" ? (
                            <Router className="h-3 w-3 text-green-600" />
                          ) : (
                            <Cable className="h-3 w-3 text-yellow-600" />
                          )}
                          <span>{device.name}</span>
                          <span className="text-xs text-gray-500">({device.ipAddress})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryDevice">Secondary Device (Optional)</Label>
                <Select
                  value={formData.secondaryDevice}
                  onValueChange={(value) => setFormData({ ...formData, secondaryDevice: value })}
                  disabled={!formData.primaryDevice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select secondary device" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkDevices
                      .filter((device) => device.id !== formData.primaryDevice)
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center gap-2">
                            {device.type === "switch" ? (
                              <Router className="h-3 w-3 text-green-600" />
                            ) : (
                              <Cable className="h-3 w-3 text-yellow-600" />
                            )}
                            <span>{device.name}</span>
                            <span className="text-xs text-gray-500">({device.ipAddress})</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Device Information Display */}
            {formData.primaryDevice && (
              <div className="space-y-4">
                {!formData.secondaryDevice ? (
                  // Single Device Information
                  <div className="space-y-2">
                    <Label>Device Information</Label>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      {primaryDevice && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-lg font-medium">
                            {primaryDevice.type === "switch" ? (
                              <Router className="h-5 w-5 text-green-600" />
                            ) : (
                              <Cable className="h-5 w-5 text-yellow-600" />
                            )}
                            <span>{primaryDevice.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Type:</span>
                                <span className="uppercase">{primaryDevice.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">IP Address:</span>
                                <span className="font-mono">{primaryDevice.ipAddress}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Status:</span>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    primaryDevice.status === "online"
                                      ? "bg-green-100 text-green-800"
                                      : primaryDevice.status === "offline"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {primaryDevice.status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Model:</span>
                                <span>{primaryDevice.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Ports:</span>
                                <span>
                                  {primaryDevice.connectedDevices}/{primaryDevice.ports}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Trunk Line:</span>
                                <span>{getTrunkLineName(primaryDevice.trunkLine)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">Connected Links:</span>
                              <span className="text-sm">{primaryLinks.length}</span>
                            </div>
                            {primaryLinks.length > 0 && (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {primaryLinks.map((link) => {
                                  const connectedDevice = networkDevices.find(
                                    (d) =>
                                      d.id ===
                                      (link.sourceDeviceId === formData.primaryDevice
                                        ? link.targetDeviceId
                                        : link.sourceDeviceId),
                                  )
                                  return (
                                    <div key={link.id} className="text-xs bg-white p-2 rounded border">
                                      <div className="flex justify-between items-center">
                                        <span>→ {connectedDevice?.name || "Unknown"}</span>
                                        <span className="font-mono">{link.bandwidth}</span>
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        {link.sourcePort} ↔ {link.targetPort} ({link.linkType})
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Two Device Link Information
                  <div className="space-y-2">
                    <Label>Link Information</Label>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="space-y-4">
                        {/* Device Pair Header */}
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center mb-1">
                              {primaryDevice?.type === "switch" ? (
                                <Router className="h-4 w-4 text-green-600" />
                              ) : (
                                <Cable className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="font-medium">{primaryDevice?.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{primaryDevice?.ipAddress}</div>
                          </div>

                          <ArrowRight className="h-6 w-6 text-gray-400" />

                          <div className="text-center">
                            <div className="flex items-center gap-2 justify-center mb-1">
                              {secondaryDevice?.type === "switch" ? (
                                <Router className="h-4 w-4 text-green-600" />
                              ) : (
                                <Cable className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="font-medium">{secondaryDevice?.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{secondaryDevice?.ipAddress}</div>
                          </div>
                        </div>

                        {/* Direct Link Information */}
                        {linkBetweenDevices ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm font-medium text-blue-800 mb-2">Direct Connection Found</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">Link Type:</span>
                                  <span className="capitalize">{linkBetweenDevices.linkType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Bandwidth:</span>
                                  <span>{linkBetweenDevices.bandwidth}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">Ports:</span>
                                  <span className="font-mono text-xs">
                                    {linkBetweenDevices.sourcePort} ↔ {linkBetweenDevices.targetPort}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Status:</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      linkBetweenDevices.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {linkBetweenDevices.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-sm font-medium text-yellow-800 mb-1">No Direct Connection</div>
                            <div className="text-xs text-yellow-700">
                              These devices are not directly connected. Traffic may flow through intermediate devices.
                            </div>
                          </div>
                        )}

                        {/* Traffic Flow Information */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Primary Device Links</div>
                            <div className="text-xs text-gray-600">Total: {primaryLinks.length} connections</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Secondary Device Links</div>
                            <div className="text-xs text-gray-600">Total: {secondaryLinks.length} connections</div>
                          </div>
                        </div>

                        {/* Trunk Line Information */}
                        <div className="pt-2 border-t">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Primary Trunk:</span>
                              <span>{getTrunkLineName(primaryDevice?.trunkLine || "")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Secondary Trunk:</span>
                              <span>{getTrunkLineName(secondaryDevice?.trunkLine || "")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the fault in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
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
                Report Fault
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
