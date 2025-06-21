"use client"

import type React from "react"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Network, Plus, Router, MapPin, Clock, Activity, X, Cable } from "lucide-react"
import type { NetworkDevice } from "@/app/page"

interface NetworkLinksProps {
  devices: NetworkDevice[]
  onAddDevice: (device: Omit<NetworkDevice, "id" | "lastSeen">) => void
  onUpdateStatus: (id: string, status: NetworkDevice["status"]) => void
}

export function NetworkLinks({ devices, onAddDevice, onUpdateStatus }: NetworkLinksProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDevice(formData)
    setFormData({
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
    setShowAddForm(false)
  }

  const getStatusColor = (status: NetworkDevice["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getDeviceIcon = (type: NetworkDevice["type"]) => {
    return type === "switch" ? <Router className="h-4 w-4" /> : <Cable className="h-4 w-4" />
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const switches = devices.filter((device) => device.type === "switch")
  const olts = devices.filter((device) => device.type === "olt")
  const onlineDevices = devices.filter((device) => device.status === "online")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
              </div>
              <Network className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Switches</p>
                <p className="text-2xl font-bold text-blue-600">{switches.length}</p>
              </div>
              <Router className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OLTs</p>
                <p className="text-2xl font-bold text-purple-600">{olts.length}</p>
              </div>
              <Cable className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineDevices.length}</p>
              </div>
              <Activity className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Device Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Network Infrastructure Devices</h3>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Devices Table */}
      <div className="border rounded-lg">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No network devices configured</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead>Connected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
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
                        <p className="text-sm text-gray-500">{device.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {device.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{device.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{device.model}</TableCell>
                  <TableCell className="text-center">{device.ports}</TableCell>
                  <TableCell className="text-center">
                    <span className={device.connectedDevices === device.ports ? "text-orange-600 font-medium" : ""}>
                      {device.connectedDevices}/{device.ports}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(device.status)}>{device.status.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {formatDate(device.lastSeen)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={device.status}
                      onValueChange={(value) => onUpdateStatus(device.id, value as NetworkDevice["status"])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* IP Address View Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <h4 className="font-medium">View by:</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Device List
          </Button>
          <Button variant="outline" size="sm">
            IP Ranges
          </Button>
        </div>
      </div>

      {/* IP Address Range Summary */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Network Address Allocation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            devices.reduce(
              (acc, device) => {
                const subnet = device.ipAddress.split(".").slice(0, 3).join(".") + ".0/24"
                if (!acc[subnet]) {
                  acc[subnet] = []
                }
                acc[subnet].push(device)
                return acc
              },
              {} as Record<string, NetworkDevice[]>,
            ),
          ).map(([subnet, subnetDevices]) => (
            <div key={subnet} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">{subnet}</h5>
                <Badge variant="outline" className="text-xs">
                  {subnetDevices.length} devices
                </Badge>
              </div>
              <div className="space-y-1">
                {subnetDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <span className="font-mono">{device.ipAddress}</span>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        device.status === "online"
                          ? "bg-green-500"
                          : device.status === "offline"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Add Network Device</CardTitle>
                <CardDescription>Configure a new switch or OLT device</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Core Switch Alpha"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Device Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as NetworkDevice["type"] })}
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
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Data Center - Rack A1"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Device Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Cisco Catalyst 9300"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                      value={formData.ports}
                      onChange={(e) => setFormData({ ...formData, ports: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connectedDevices">Connected Devices</Label>
                    <Input
                      id="connectedDevices"
                      type="number"
                      min="0"
                      max={formData.ports}
                      value={formData.connectedDevices}
                      onChange={(e) =>
                        setFormData({ ...formData, connectedDevices: Number.parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as NetworkDevice["status"] })}
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
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Device
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
