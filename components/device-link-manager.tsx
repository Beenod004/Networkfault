"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Link, Trash2, Edit, Router, Cable, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import type { NetworkDevice, NetworkLink } from "@/app/page"

interface DeviceLinkManagerProps {
  devices: NetworkDevice[]
  links: NetworkLink[]
  onAddDevice: (device: Omit<NetworkDevice, "id" | "lastSeen">) => void
  onUpdateDevice: (id: string, device: Partial<NetworkDevice>) => void
  onDeleteDevice: (id: string) => void
  onAddLink: (link: Omit<NetworkLink, "id">) => void
  onDeleteLink: (id: string) => void
}

export function DeviceLinkManager({
  devices,
  links,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  onAddLink,
  onDeleteLink,
}: DeviceLinkManagerProps) {
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null)

  const [deviceForm, setDeviceForm] = useState({
    name: "",
    type: "switch" as NetworkDevice["type"],
    ipAddress: "",
    location: "",
    status: "online" as NetworkDevice["status"],
    model: "",
    ports: 24,
    connectedDevices: 0,
    trunkLine: "",
  })

  const [linkForm, setLinkForm] = useState({
    sourceDeviceId: "",
    targetDeviceId: "",
    sourcePort: "",
    targetPort: "",
    linkType: "ethernet" as NetworkLink["linkType"],
    bandwidth: "1Gbps",
    status: "active" as NetworkLink["status"],
  })

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDevice(deviceForm)
    setDeviceForm({
      name: "",
      type: "switch",
      ipAddress: "",
      location: "",
      status: "online",
      model: "",
      ports: 24,
      connectedDevices: 0,
      trunkLine: "",
    })
    setShowAddDevice(false)
  }

  const handleEditDevice = (device: NetworkDevice) => {
    setEditingDevice(device)
    setDeviceForm({
      name: device.name,
      type: device.type,
      ipAddress: device.ipAddress,
      location: device.location,
      status: device.status,
      model: device.model,
      ports: device.ports,
      connectedDevices: device.connectedDevices,
      trunkLine: device.trunkLine,
    })
    setShowAddDevice(true)
  }

  const handleUpdateDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDevice) {
      onUpdateDevice(editingDevice.id, deviceForm)
      setEditingDevice(null)
    }
    setDeviceForm({
      name: "",
      type: "switch",
      ipAddress: "",
      location: "",
      status: "online",
      model: "",
      ports: 24,
      connectedDevices: 0,
      trunkLine: "",
    })
    setShowAddDevice(false)
  }

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault()
    onAddLink(linkForm)
    setLinkForm({
      sourceDeviceId: "",
      targetDeviceId: "",
      sourcePort: "",
      targetPort: "",
      linkType: "ethernet",
      bandwidth: "1Gbps",
      status: "active",
    })
    setShowAddLink(false)
  }

  const getDeviceIcon = (type: NetworkDevice["type"]) => {
    switch (type) {
      case "switch":
        return <Router className="h-4 w-4" />
      case "olt":
        return <Cable className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: NetworkDevice["status"] | NetworkLink["status"]) => {
    switch (status) {
      case "online":
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "offline":
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    return device ? device.name : "Unknown Device"
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
          <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Network Devices</CardTitle>
                  <CardDescription>Manage switches, OLTs, and other network infrastructure</CardDescription>
                </div>
                <Button onClick={() => setShowAddDevice(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Device
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Router className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No network devices configured</p>
                  <p className="text-sm">Add your first device to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ports</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device.type)}
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-gray-500">{device.model}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {device.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                        <TableCell className="text-sm">{device.location}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(device.status)}>{device.status.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={device.connectedDevices === device.ports ? "text-orange-600 font-medium" : ""}
                          >
                            {device.connectedDevices}/{device.ports}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditDevice(device)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onDeleteDevice(device.id)}>
                              <Trash2 className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Network Links</CardTitle>
                  <CardDescription>Manage connections between network devices</CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddLink(true)}
                  className="flex items-center gap-2"
                  disabled={devices.length < 2}
                >
                  <Link className="h-4 w-4" />
                  Add Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {devices.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Need at least 2 devices to create links</p>
                  <p className="text-sm">Add more devices first</p>
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No network links configured</p>
                  <p className="text-sm">Create links between your devices</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Device</TableHead>
                      <TableHead>Target Device</TableHead>
                      <TableHead>Ports</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bandwidth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{getDeviceName(link.sourceDeviceId)}</TableCell>
                        <TableCell className="font-medium">{getDeviceName(link.targetDeviceId)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {link.sourcePort} ↔ {link.targetPort}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {link.linkType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{link.bandwidth}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(link.status)}>{link.status.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => onDeleteLink(link.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{editingDevice ? "Edit Device" : "Add Network Device"}</CardTitle>
                <CardDescription>
                  {editingDevice ? "Update device configuration" : "Configure a new network device"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAddDevice(false)
                  setEditingDevice(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingDevice ? handleUpdateDevice : handleAddDevice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Core Switch Alpha"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Device Type</Label>
                    <Select
                      value={deviceForm.type}
                      onValueChange={(value) => setDeviceForm({ ...deviceForm, type: value as NetworkDevice["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="switch">Network Switch</SelectItem>
                        <SelectItem value="olt">OLT (Optical Line Terminal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      placeholder="192.168.1.10"
                      value={deviceForm.ipAddress}
                      onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trunkLine">Trunk Line</Label>
                    <Select
                      value={deviceForm.trunkLine}
                      onValueChange={(value) => setDeviceForm({ ...deviceForm, trunkLine: value })}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Data Center - Rack A1"
                    value={deviceForm.location}
                    onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Device Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Cisco Catalyst 9300"
                    value={deviceForm.model}
                    onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ports">Total Ports</Label>
                    <Input
                      id="ports"
                      type="number"
                      min="1"
                      value={deviceForm.ports}
                      onChange={(e) => setDeviceForm({ ...deviceForm, ports: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connectedDevices">Connected Devices</Label>
                    <Input
                      id="connectedDevices"
                      type="number"
                      min="0"
                      max={deviceForm.ports}
                      value={deviceForm.connectedDevices}
                      onChange={(e) =>
                        setDeviceForm({ ...deviceForm, connectedDevices: Number.parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={deviceForm.status}
                      onValueChange={(value) =>
                        setDeviceForm({ ...deviceForm, status: value as NetworkDevice["status"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDevice(false)
                      setEditingDevice(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingDevice ? "Update Device" : "Add Device"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Add Network Link</CardTitle>
                <CardDescription>Create a connection between two devices</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddLink(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceDevice">Source Device</Label>
                    <Select
                      value={linkForm.sourceDeviceId}
                      onValueChange={(value) => setLinkForm({ ...linkForm, sourceDeviceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetDevice">Target Device</Label>
                    <Select
                      value={linkForm.targetDeviceId}
                      onValueChange={(value) => setLinkForm({ ...linkForm, targetDeviceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices
                          .filter((device) => device.id !== linkForm.sourceDeviceId)
                          .map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourcePort">Source Port</Label>
                    <Input
                      id="sourcePort"
                      placeholder="e.g., Gi0/1"
                      value={linkForm.sourcePort}
                      onChange={(e) => setLinkForm({ ...linkForm, sourcePort: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetPort">Target Port</Label>
                    <Input
                      id="targetPort"
                      placeholder="e.g., Gi0/2"
                      value={linkForm.targetPort}
                      onChange={(e) => setLinkForm({ ...linkForm, targetPort: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkType">Link Type</Label>
                    <Select
                      value={linkForm.linkType}
                      onValueChange={(value) =>
                        setLinkForm({ ...linkForm, linkType: value as NetworkLink["linkType"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
                        <SelectItem value="fiber">Fiber Optic</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bandwidth">Bandwidth</Label>
                    <Select
                      value={linkForm.bandwidth}
                      onValueChange={(value) => setLinkForm({ ...linkForm, bandwidth: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100Mbps">100 Mbps</SelectItem>
                        <SelectItem value="1Gbps">1 Gbps</SelectItem>
                        <SelectItem value="10Gbps">10 Gbps</SelectItem>
                        <SelectItem value="40Gbps">40 Gbps</SelectItem>
                        <SelectItem value="100Gbps">100 Gbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkStatus">Status</Label>
                  <Select
                    value={linkForm.status}
                    onValueChange={(value) => setLinkForm({ ...linkForm, status: value as NetworkLink["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddLink(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Link
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
