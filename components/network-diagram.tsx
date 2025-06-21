"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Router, Cable, Server, Plus, Link, X, ZoomIn, ZoomOut, Move, Edit, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Fault, NetworkDevice, NetworkLink } from "@/app/page"

interface NetworkDiagramProps {
  faults: Fault[]
  networkDevices?: NetworkDevice[]
  networkLinks?: NetworkLink[]
  onAddDevice: (device: Omit<NetworkDevice, "id" | "lastSeen">) => void
  onUpdateDevice: (id: string, device: Partial<NetworkDevice>) => void
  onDeleteDevice: (id: string) => void
  onAddLink: (link: Omit<NetworkLink, "id">) => void
  onDeleteLink: (id: string) => void
}

interface DevicePosition {
  id: string
  x: number
  y: number
}

type InteractionMode = "pan" | "edit" | "link"

export function NetworkDiagram({
  faults,
  networkDevices = [],
  networkLinks = [],
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  onAddLink,
  onDeleteLink,
}: NetworkDiagramProps) {
  const [zoomLevel, setZoomLevel] = useState(0.8)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("pan")
  const [linkSource, setLinkSource] = useState<string | null>(null)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [showAddLink, setShowAddLink] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedDevice, setDraggedDevice] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showFaultOverlay, setShowFaultOverlay] = useState(true)

  const svgRef = useRef<SVGSVGElement>(null)

  const [devicePositions, setDevicePositions] = useState<DevicePosition[]>(() => {
    const positions: DevicePosition[] = []

    // Layout based on the provided network diagram
    // Top row - Northern region
    positions.push({ id: "OLT001", x: 400, y: 50 }) // Shermathan
    positions.push({ id: "OLT002", x: 550, y: 50 }) // Panchpokhari

    // Second row - Main distribution
    positions.push({ id: "OLT003", x: 300, y: 120 }) // Talamarang
    positions.push({ id: "SW001", x: 450, y: 120 }) // Melamchi_2.58
    positions.push({ id: "OLT021", x: 600, y: 120 }) // Kurla_2.12
    positions.push({ id: "SW010", x: 750, y: 120 }) // Panchkhal_2.01
    positions.push({ id: "OLT022", x: 900, y: 120 }) // Dolaghat

    // Third row - Core backbone
    positions.push({ id: "OLT004", x: 200, y: 200 }) // Shoteshar_4.82 Ep
    positions.push({ id: "SW002", x: 450, y: 200 }) // Nagarkot_2.42
    positions.push({ id: "SW009", x: 750, y: 200 }) // Dhulikhel_2.14

    // Fourth row - Distribution layer
    positions.push({ id: "OLT005", x: 150, y: 280 }) // Sankhu_4.200 Gp
    positions.push({ id: "SW003", x: 300, y: 280 }) // Kharipath_2.22
    positions.push({ id: "OLT006", x: 450, y: 280 }) // Jitpur_4.35
    positions.push({ id: "SW006", x: 600, y: 280 }) // Mahadevi_2.39
    positions.push({ id: "SW007", x: 750, y: 280 }) // Jagat_2.43
    positions.push({ id: "SW008", x: 900, y: 280 }) // Trathali_2.46

    // Fifth row - Access layer
    positions.push({ id: "SW004", x: 200, y: 360 }) // Bhadrapur_2.21
    positions.push({ id: "OLT007", x: 300, y: 360 }) // RTC_4.33 Ep
    positions.push({ id: "OLT008", x: 400, y: 360 }) // Purano Thimi_4.48 Ep
    positions.push({ id: "SW005", x: 500, y: 360 }) // Bhadrapur_2.35
    positions.push({ id: "OLT009", x: 600, y: 360 }) // Banachaur_4.38
    positions.push({ id: "OLT010", x: 750, y: 360 }) // Palanse_4.50
    positions.push({ id: "OLT011", x: 900, y: 360 }) // Kankraban_4.145

    // Sixth row - Terminal endpoints
    positions.push({ id: "OLT012", x: 650, y: 440 }) // KBC_4.49 Ep
    positions.push({ id: "OLT013", x: 750, y: 440 }) // BhakundeBesi_4.51
    positions.push({ id: "OLT014", x: 850, y: 440 }) // BhakundeBesi_4.59
    positions.push({ id: "OLT018", x: 950, y: 440 }) // Panchkhal_4.80 GP

    // Seventh row - Extended endpoints
    positions.push({ id: "OLT019", x: 850, y: 520 }) // Panchkhal_4.01 EP
    positions.push({ id: "OLT020", x: 950, y: 520 }) // Aadghari_4.69 Ep

    // Left side branch - Western region
    positions.push({ id: "SW011", x: 50, y: 200 }) // Swoyambhu_2.17
    positions.push({ id: "SW012", x: 50, y: 280 }) // Kalank_2.32
    positions.push({ id: "OLT015", x: 50, y: 360 }) // Dhunge Adda_4.18 Ep
    positions.push({ id: "OLT016", x: 50, y: 440 }) // Raul Tole_4.22 Gp
    positions.push({ id: "OLT017", x: 50, y: 520 }) // Machhegaun_4.13 Ep

    return positions
  })

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
    linkType: "fiber" as NetworkLink["linkType"],
    bandwidth: "1Gbps",
    status: "active" as NetworkLink["status"],
  })

  const getDevicePosition = useCallback(
    (deviceId: string) => {
      return devicePositions.find((pos) => pos.id === deviceId) || { x: 100, y: 100 }
    },
    [devicePositions],
  )

  const DEVICE_WIDTH = 120
  const DEVICE_HEIGHT = 40
  const MIN_SPACING = 20

  const checkDeviceCollision = (x: number, y: number, excludeId?: string) => {
    return devicePositions.some((pos) => {
      if (pos.id === excludeId) return false

      const dx = Math.abs(x - pos.x)
      const dy = Math.abs(y - pos.y)

      return dx < DEVICE_WIDTH + MIN_SPACING && dy < DEVICE_HEIGHT + MIN_SPACING
    })
  }

  const findNearestValidPosition = (targetX: number, targetY: number, excludeId?: string) => {
    let x = targetX
    let y = targetY
    let attempts = 0
    const maxAttempts = 100
    const step = 10

    while (checkDeviceCollision(x, y, excludeId) && attempts < maxAttempts) {
      // Try positions in a spiral pattern
      const angle = (attempts * 0.5) % (2 * Math.PI)
      const radius = Math.floor(attempts / 8) * step + MIN_SPACING

      x = targetX + Math.cos(angle) * radius
      y = targetY + Math.sin(angle) * radius

      // Keep within bounds
      x = Math.max(MIN_SPACING, Math.min(1800, x))
      y = Math.max(MIN_SPACING, Math.min(900, y))

      attempts++
    }

    return { x, y }
  }

  const calculateLinkPath = (sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
    const startX = sourcePos.x + DEVICE_WIDTH / 2
    const startY = sourcePos.y + DEVICE_HEIGHT / 2
    const endX = targetPos.x + DEVICE_WIDTH / 2
    const endY = targetPos.y + DEVICE_HEIGHT / 2

    // Check if direct path intersects with any devices
    const directPath = { startX, startY, endX, endY }

    // Simple collision check - if direct path is clear, use it
    let pathClear = true
    for (const pos of devicePositions) {
      if ((pos.x === sourcePos.x && pos.y === sourcePos.y) || (pos.x === targetPos.x && pos.y === targetPos.y)) continue

      // Check if line intersects with device rectangle
      if (lineIntersectsRect(startX, startY, endX, endY, pos.x, pos.y, DEVICE_WIDTH, DEVICE_HEIGHT)) {
        pathClear = false
        break
      }
    }

    if (pathClear) {
      return `M ${startX} ${startY} L ${endX} ${endY}`
    }

    // Create a path that goes around obstacles
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    // Offset the middle point to avoid devices
    const offsetX = midX
    let offsetY = midY - 50 // Try going above first

    // Check if offset point is clear
    if (
      devicePositions.some(
        (pos) =>
          offsetX >= pos.x && offsetX <= pos.x + DEVICE_WIDTH && offsetY >= pos.y && offsetY <= pos.y + DEVICE_HEIGHT,
      )
    ) {
      offsetY = midY + 50 // Try going below
    }

    return `M ${startX} ${startY} Q ${offsetX} ${offsetY} ${endX} ${endY}`
  }

  const lineIntersectsRect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    rectX: number,
    rectY: number,
    rectW: number,
    rectH: number,
  ) => {
    // Simple bounding box check
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)

    return !(maxX < rectX || minX > rectX + rectW || maxY < rectY || minY > rectY + rectH)
  }

  const updateDevicePosition = useCallback(
    (deviceId: string, x: number, y: number) => {
      const validPosition = findNearestValidPosition(x, y, deviceId)
      setDevicePositions((prev) =>
        prev.map((pos) => (pos.id === deviceId ? { ...pos, x: validPosition.x, y: validPosition.y } : pos)),
      )
    },
    [devicePositions],
  )

  const getDeviceIcon = (type: NetworkDevice["type"]) => {
    switch (type) {
      case "switch":
        return <Router className="h-4 w-4 text-green-600" />
      case "olt":
        return <Cable className="h-4 w-4 text-yellow-600" />
      default:
        return <Server className="h-4 w-4 text-gray-600" />
    }
  }

  const getDeviceBackgroundColor = (type: NetworkDevice["type"], isSelected: boolean, isLinkSource: boolean) => {
    if (isSelected) return "#dbeafe"
    if (isLinkSource) return "#fef3c7"

    switch (type) {
      case "switch":
        return "#dcfce7" // Light green background for switches
      case "olt":
        return "#fef3c7" // Light yellow background for OLTs
      default:
        return "#ffffff"
    }
  }

  const getLinkStyle = (link: NetworkLink) => {
    const bandwidth = link.bandwidth.toLowerCase()
    let strokeWidth = 2
    if (bandwidth.includes("100gbps")) strokeWidth = 4
    else if (bandwidth.includes("40gbps")) strokeWidth = 3.5
    else if (bandwidth.includes("10gbps")) strokeWidth = 3
    else if (bandwidth.includes("1gbps")) strokeWidth = 2.5
    else if (bandwidth.includes("100mbps")) strokeWidth = 2

    let strokeColor = link.status === "active" ? "#10b981" : "#ef4444"
    if (link.linkType === "fiber") strokeColor = link.status === "active" ? "#8b5cf6" : "#ef4444"
    else if (link.linkType === "ethernet") strokeColor = link.status === "active" ? "#10b981" : "#ef4444"

    return { strokeWidth, strokeColor }
  }

  const getStatusColor = (status: NetworkDevice["status"]) => {
    switch (status) {
      case "online":
        return "#10b981"
      case "offline":
        return "#ef4444"
      case "maintenance":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  const handleMouseDown = (e: React.MouseEvent<SVGElement>) => {
    if (interactionMode === "pan" && !isDragging) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (isPanning && interactionMode === "pan") {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))

      setLastPanPoint({ x: e.clientX, y: e.clientY })
    } else if (isDragging && draggedDevice && interactionMode === "edit") {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoomLevel - dragOffset.x
        const y = (e.clientY - rect.top - panOffset.y) / zoomLevel - dragOffset.y
        updateDevicePosition(draggedDevice, Math.max(0, x), Math.max(0, y))
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setIsDragging(false)
    setDraggedDevice(null)
  }

  const handleDeviceMouseDown = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (interactionMode === "edit") {
      // Check if we're starting to drag or just selecting
      setIsDragging(true)
      setDraggedDevice(deviceId)
      setSelectedDevice(deviceId) // Also select the device

      const rect = svgRef.current?.getBoundingClientRect()
      const devicePos = getDevicePosition(deviceId)
      if (rect) {
        const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel
        const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel
        setDragOffset({
          x: mouseX - devicePos.x,
          y: mouseY - devicePos.y,
        })
      }
    } else if (interactionMode === "link") {
      if (!linkSource) {
        setLinkSource(deviceId)
      } else if (linkSource !== deviceId) {
        setLinkForm({
          ...linkForm,
          sourceDeviceId: linkSource,
          targetDeviceId: deviceId,
        })
        setShowAddLink(true)
        setLinkSource(null)
      }
    }
  }

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDevice(deviceForm)

    const baseX = 400
    const baseY = 300
    const validPosition = findNearestValidPosition(baseX, baseY)

    const newPosition: DevicePosition = {
      id: `${deviceForm.type.toUpperCase()}${String(networkDevices.filter((d) => d.type === deviceForm.type).length + 1).padStart(3, "0")}`,
      x: validPosition.x,
      y: validPosition.y,
    }
    setDevicePositions((prev) => [...prev, newPosition])

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
      linkType: "fiber",
      bandwidth: "1Gbps",
      status: "active",
    })
    setShowAddLink(false)
  }

  const getDeviceName = (deviceId: string) => {
    const device = networkDevices.find((d) => d.id === deviceId)
    return device ? device.name : "Unknown"
  }

  const getDeviceFaults = (deviceId: string) => {
    const device = networkDevices.find((d) => d.id === deviceId)
    if (!device) return []

    return faults.filter(
      (fault) =>
        fault.status !== "resolved" &&
        (fault.trunkLine === device.trunkLine ||
          fault.location.toLowerCase().includes(device.location.toLowerCase()) ||
          fault.location.toLowerCase().includes(device.name.toLowerCase())),
    )
  }

  const getLinkFaults = (link: NetworkLink) => {
    const sourceDevice = networkDevices.find((d) => d.id === link.sourceDeviceId)
    const targetDevice = networkDevices.find((d) => d.id === link.targetDeviceId)

    return faults.filter(
      (fault) =>
        fault.status !== "resolved" &&
        (fault.trunkLine === sourceDevice?.trunkLine ||
          fault.trunkLine === targetDevice?.trunkLine ||
          fault.location.toLowerCase().includes("fiber") ||
          fault.location.toLowerCase().includes("cable") ||
          fault.location.toLowerCase().includes("link") ||
          fault.location.toLowerCase().includes("connection")),
    )
  }

  const getFaultSeverityColor = (faultSeverity: string) => {
    switch (faultSeverity) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#d97706"
      case "low":
        return "#2563eb"
      default:
        return "#6b7280"
    }
  }

  const resetView = () => {
    setZoomLevel(0.8)
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <div className="space-y-4">
      <style jsx>{`
        @keyframes faultPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes faultFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        
        @keyframes criticalBlink {
          0%, 100% { opacity: 1; }
          25% { opacity: 0.2; }
          50% { opacity: 1; }
          75% { opacity: 0.2; }
        }
        
        .fault-pulse {
          animation: faultPulse 2s ease-in-out infinite;
        }
        
        .fault-flow {
          animation: faultFlow 1s linear infinite;
        }
        
        .critical-blink {
          animation: criticalBlink 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Fiber Network Topology</h3>
          <div className="flex gap-2">
            <Button
              variant={interactionMode === "pan" ? "default" : "outline"}
              size="sm"
              onClick={() => setInteractionMode("pan")}
            >
              <Move className="h-4 w-4 mr-2" />
              Pan & Drag
            </Button>
            <Button
              variant={interactionMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setInteractionMode("edit")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Mode
            </Button>
            <Button
              variant={interactionMode === "link" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setInteractionMode("link")
                setLinkSource(null)
              }}
              disabled={networkDevices.length < 2}
            >
              <Link className="h-4 w-4 mr-2" />
              Link Mode
            </Button>
            <Button
              variant={showFaultOverlay ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFaultOverlay(!showFaultOverlay)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fault Overlay
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddDevice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            Reset View
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono">{Math.round(zoomLevel * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          {interactionMode === "pan" && (
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              <span>Pan Mode: Drag to pan the view • Drag devices to reposition them</span>
            </div>
          )}
          {interactionMode === "edit" && (
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>Edit Mode: Click devices to select and edit them • Drag devices to reposition them</span>
            </div>
          )}
          {interactionMode === "link" && (
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span>
                Link Mode:{" "}
                {linkSource
                  ? `Click another device to create a fiber link from "${getDeviceName(linkSource)}"`
                  : "Click a device to start creating a fiber link"}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-hidden" style={{ height: "700px" }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              className={`border ${interactionMode === "pan" ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="fiberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="ethernetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#059669" opacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <rect width="2000" height="1000" fill="url(#grid)" />

                {networkLinks.map((link) => {
                  const sourcePos = getDevicePosition(link.sourceDeviceId)
                  const targetPos = getDevicePosition(link.targetDeviceId)
                  const linkStyle = getLinkStyle(link)
                  const linkFaults = getLinkFaults(link)
                  const hasFaults = linkFaults.length > 0
                  const criticalFaults = linkFaults.filter((f) => f.severity === "critical")

                  const linkPath = calculateLinkPath(sourcePos, targetPos)
                  const animationClass =
                    hasFaults && showFaultOverlay ? (criticalFaults.length > 0 ? "critical-blink" : "fault-pulse") : ""

                  return (
                    <g key={link.id}>
                      {/* Main fiber link */}
                      <path
                        d={linkPath}
                        stroke={
                          hasFaults && showFaultOverlay
                            ? getFaultSeverityColor(linkFaults[0].severity)
                            : link.linkType === "fiber"
                              ? "url(#fiberGradient)"
                              : "url(#ethernetGradient)"
                        }
                        strokeWidth={hasFaults && showFaultOverlay ? linkStyle.strokeWidth + 1 : linkStyle.strokeWidth}
                        strokeDasharray={hasFaults && showFaultOverlay ? "10,5" : "none"}
                        fill="none"
                        opacity="0.9"
                        className={animationClass}
                      />

                      {/* Animated fault flow for faulty links */}
                      {hasFaults && showFaultOverlay && (
                        <path
                          d={linkPath}
                          stroke={getFaultSeverityColor(linkFaults[0].severity)}
                          strokeWidth="2"
                          strokeDasharray="8,12"
                          fill="none"
                          opacity="0.7"
                          className="fault-flow"
                        />
                      )}

                      {/* Fiber optic core visualization for normal links */}
                      {!hasFaults && link.linkType === "fiber" && (
                        <path
                          d={linkPath}
                          stroke="#c084fc"
                          strokeWidth="1"
                          fill="none"
                          opacity="0.6"
                          strokeDasharray="2,3"
                        />
                      )}

                      {/* Bandwidth label at midpoint */}
                      <rect
                        x={(sourcePos.x + targetPos.x) / 2 + 45}
                        y={(sourcePos.y + targetPos.y) / 2 + 10}
                        width="30"
                        height="16"
                        rx="8"
                        fill="white"
                        stroke={
                          hasFaults && showFaultOverlay
                            ? getFaultSeverityColor(linkFaults[0].severity)
                            : linkStyle.strokeColor
                        }
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={(sourcePos.x + targetPos.x) / 2 + 60}
                        y={(sourcePos.y + targetPos.y) / 2 + 20}
                        textAnchor="middle"
                        fontSize="10"
                        fill={
                          hasFaults && showFaultOverlay
                            ? getFaultSeverityColor(linkFaults[0].severity)
                            : linkStyle.strokeColor
                        }
                        fontWeight="500"
                        className="pointer-events-none"
                      >
                        {link.bandwidth.replace("bps", "")}
                      </text>

                      {/* Fault indicator on link */}
                      {hasFaults && showFaultOverlay && (
                        <g>
                          <circle
                            cx={(sourcePos.x + targetPos.x) / 2 + 30}
                            cy={(sourcePos.y + targetPos.y) / 2 + 18}
                            r="8"
                            fill={getFaultSeverityColor(linkFaults[0].severity)}
                            stroke="white"
                            strokeWidth="2"
                            className={criticalFaults.length > 0 ? "critical-blink" : "fault-pulse"}
                          />
                          <text
                            x={(sourcePos.x + targetPos.x) / 2 + 30}
                            y={(sourcePos.y + targetPos.y) / 2 + 22}
                            textAnchor="middle"
                            fontSize="10"
                            fill="white"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            !
                          </text>
                          <text
                            x={(sourcePos.x + targetPos.x) / 2 + 30}
                            y={(sourcePos.y + targetPos.y) / 2 + 35}
                            textAnchor="middle"
                            fontSize="8"
                            fill={getFaultSeverityColor(linkFaults[0].severity)}
                            fontWeight="600"
                            className="pointer-events-none"
                          >
                            {linkFaults.length} fault{linkFaults.length > 1 ? "s" : ""}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {networkDevices.map((device) => {
                  const position = getDevicePosition(device.id)
                  const isSelected = selectedDevice === device.id
                  const isLinkSource = linkSource === device.id
                  const deviceFaults = getDeviceFaults(device.id)
                  const hasFaults = deviceFaults.length > 0
                  const criticalFaults = deviceFaults.filter((f) => f.severity === "critical")

                  return (
                    <g key={device.id}>
                      <rect
                        x={position.x}
                        y={position.y}
                        width="120"
                        height="40"
                        rx="8"
                        fill={getDeviceBackgroundColor(device.type, isSelected, isLinkSource)}
                        stroke={
                          hasFaults && showFaultOverlay
                            ? getFaultSeverityColor(deviceFaults[0].severity)
                            : isLinkSource
                              ? "#f59e0b"
                              : isSelected
                                ? "#2563eb"
                                : getStatusColor(device.status)
                        }
                        strokeWidth={hasFaults && showFaultOverlay ? "3" : isSelected || isLinkSource ? "2" : "1.5"}
                        className={`${interactionMode === "edit" ? "cursor-move" : "cursor-pointer"} hover:stroke-blue-400 transition-colors ${
                          hasFaults && showFaultOverlay && criticalFaults.length > 0 ? "critical-blink" : ""
                        } ${isDragging && draggedDevice === device.id ? "opacity-75" : ""}`}
                        onMouseDown={(e) => handleDeviceMouseDown(device.id, e)}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      />

                      <g transform={`translate(${position.x + 8}, ${position.y + 8})`}>{getDeviceIcon(device.type)}</g>

                      {/* Status indicator */}
                      <circle
                        cx={position.x + 110}
                        cy={position.y + 10}
                        r="3"
                        fill={
                          hasFaults && showFaultOverlay
                            ? getFaultSeverityColor(deviceFaults[0].severity)
                            : getStatusColor(device.status)
                        }
                        stroke="white"
                        strokeWidth="1"
                        className={hasFaults && showFaultOverlay ? "fault-pulse" : ""}
                      />

                      {/* Device name */}
                      <text
                        x={position.x + 30}
                        y={position.y + 16}
                        fontSize="11"
                        fontWeight="600"
                        fill="#374151"
                        className="pointer-events-none"
                      >
                        {device.name.length > 15 ? device.name.substring(0, 15) + "..." : device.name}
                      </text>

                      {/* Device type badge */}
                      <rect
                        x={position.x + 30}
                        y={position.y + 22}
                        width={device.type === "switch" ? "28" : "20"}
                        height="12"
                        rx="6"
                        fill={device.type === "switch" ? "#16a34a" : "#eab308"} // Green for switches, yellow for OLTs
                        opacity="0.8"
                      />
                      <text
                        x={position.x + (device.type === "switch" ? 44 : 40)}
                        y={position.y + 30}
                        textAnchor="middle"
                        fontSize="8"
                        fill="white"
                        fontWeight="600"
                        className="pointer-events-none"
                      >
                        {device.type.toUpperCase()}
                      </text>

                      {/* IP Address */}
                      <text
                        x={position.x + 75}
                        y={position.y + 30}
                        fontSize="8"
                        fill="#6b7280"
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        {device.ipAddress}
                      </text>

                      {/* Fault indicator */}
                      {hasFaults && showFaultOverlay && (
                        <g>
                          <circle
                            cx={position.x + 130}
                            cy={position.y + 8}
                            r="10"
                            fill={getFaultSeverityColor(deviceFaults[0].severity)}
                            stroke="white"
                            strokeWidth="2"
                            className={criticalFaults.length > 0 ? "critical-blink" : "fault-pulse"}
                          />
                          <text
                            x={position.x + 130}
                            y={position.y + 12}
                            textAnchor="middle"
                            fontSize="12"
                            fill="white"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            !
                          </text>

                          {/* Fault count badge */}
                          <rect
                            x={position.x + 125}
                            y={position.y + 20}
                            width="20"
                            height="12"
                            rx="6"
                            fill={getFaultSeverityColor(deviceFaults[0].severity)}
                            opacity="0.9"
                          />
                          <text
                            x={position.x + 135}
                            y={position.y + 28}
                            textAnchor="middle"
                            fontSize="8"
                            fill="white"
                            fontWeight="600"
                            className="pointer-events-none"
                          >
                            {deviceFaults.length}
                          </text>

                          {/* Fault severity indicator */}
                          <text
                            x={position.x + 130}
                            y={position.y + 40}
                            textAnchor="middle"
                            fontSize="7"
                            fill={getFaultSeverityColor(deviceFaults[0].severity)}
                            fontWeight="600"
                            className="pointer-events-none"
                          >
                            {deviceFaults[0].severity.toUpperCase()}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Fault Summary Panel */}
                {showFaultOverlay && (
                  <g transform="translate(20, 20)">
                    <rect
                      width="220"
                      height="140"
                      rx="8"
                      fill="white"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.95"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                    />
                    <text x="10" y="20" fontSize="12" fontWeight="600" fill="#374151">
                      Fiber Network Fault Status
                    </text>

                    {["critical", "high", "medium", "low"].map((severity, index) => {
                      const severityFaults = faults.filter((f) => f.severity === severity && f.status !== "resolved")
                      return (
                        <g key={severity} transform={`translate(10, ${35 + index * 18})`}>
                          <circle
                            cx="6"
                            cy="6"
                            r="4"
                            fill={getFaultSeverityColor(severity)}
                            className={severity === "critical" && severityFaults.length > 0 ? "critical-blink" : ""}
                          />
                          <text x="16" y="10" fontSize="10" fill="#374151">
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}: {severityFaults.length}
                          </text>
                        </g>
                      )
                    })}

                    <text x="10" y="125" fontSize="9" fill="#6b7280">
                      🔴 Critical faults blink rapidly
                    </text>
                  </g>
                )}
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      {selectedDevice && interactionMode === "edit" && (
        <Card>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const device = networkDevices.find((d) => d.id === selectedDevice)
              if (!device) return null

              const deviceLinks = networkLinks.filter(
                (link) => link.sourceDeviceId === device.id || link.targetDeviceId === device.id,
              )

              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm">{device.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IP Address:</span>
                      <span className="text-sm font-mono">{device.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge
                        className={`text-xs`}
                        style={{ backgroundColor: getStatusColor(device.status), color: "white" }}
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Model:</span>
                      <span className="text-sm">{device.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm">{device.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ports:</span>
                      <span className="text-sm">
                        {device.connectedDevices}/{device.ports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fiber Links:</span>
                      <span className="text-sm">{deviceLinks.length}</span>
                    </div>
                  </div>
                  <div className="col-span-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDevice(device.id)
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
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Device
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Add Network Device</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddDevice(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Core Switch 1"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={deviceForm.type}
                      onValueChange={(value) => setDeviceForm({ ...deviceForm, type: value as NetworkDevice["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="olt">OLT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Data Center - Rack A1"
                    value={deviceForm.location}
                    onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="Cisco Catalyst 9300"
                      value={deviceForm.model}
                      onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ports">Ports</Label>
                    <Input
                      id="ports"
                      type="number"
                      min="1"
                      value={deviceForm.ports}
                      onChange={(e) => setDeviceForm({ ...deviceForm, ports: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDevice(false)} className="flex-1">
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

      {editingDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Edit Device</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingDevice(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdateDevice(editingDevice, deviceForm)
                  setEditingDevice(null)
                  setSelectedDevice(null)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Device Name</Label>
                    <Input
                      id="editName"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editStatus">Status</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location</Label>
                  <Input
                    id="editLocation"
                    value={deviceForm.location}
                    onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingDevice(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Update Device
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showAddLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Add Fiber Link</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddLink(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div className="space-y-2">
                  <Label>From: {getDeviceName(linkForm.sourceDeviceId)}</Label>
                  <Label>To: {getDeviceName(linkForm.targetDeviceId)}</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourcePort">Source Port</Label>
                    <Input
                      id="sourcePort"
                      placeholder="Gi0/1"
                      value={linkForm.sourcePort}
                      onChange={(e) => setLinkForm({ ...linkForm, sourcePort: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetPort">Target Port</Label>
                    <Input
                      id="targetPort"
                      placeholder="Gi0/2"
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
                        <SelectItem value="fiber">Fiber Optic</SelectItem>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
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

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddLink(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Fiber Link
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium mb-3">Device Types</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 border border-blue-500 rounded flex items-center justify-center">
                <Router className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-sm">Network Switch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-50 border border-purple-500 rounded flex items-center justify-center">
                <Cable className="h-3 w-3 text-purple-600" />
              </div>
              <span className="text-sm">OLT (Optical Line Terminal)</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Fiber Network</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-purple-400" />
              <span className="text-sm">Fiber Optic Link</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-green-500" />
              <span className="text-sm">Ethernet Backup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-red-500 animate-pulse" />
              <span className="text-sm">Faulty Connection</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Fault Indicators</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
              <span className="text-sm">Critical Fault</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Medium/Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
