"use client"

import { useState } from "react"
import { AlertTriangle, Plus, Network, Activity, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaultList } from "@/components/fault-list"
import { AddFaultForm } from "@/components/add-fault-form"
import { NetworkDiagram } from "@/components/network-diagram"

export interface Fault {
  id: string
  location: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  status: "active" | "investigating" | "resolved"
  reportedAt: Date
  estimatedRepair?: Date
  trunkLine: string
}

export interface NetworkDevice {
  id: string
  name: string
  type: "switch" | "olt"
  ipAddress: string
  location: string
  status: "online" | "offline" | "maintenance"
  model: string
  ports: number
  connectedDevices: number
  lastSeen: Date
  trunkLine: string
}

export interface NetworkLink {
  id: string
  sourceDeviceId: string
  targetDeviceId: string
  sourcePort: string
  targetPort: string
  linkType: "ethernet" | "fiber" | "wireless"
  bandwidth: string
  status: "active" | "inactive"
}

// Generate dummy data
const generateDummyFaults = (): Fault[] => [
  {
    id: "F001",
    location: "Talamarang - Melamchi Fiber Link",
    description:
      "Complete fiber cable cut detected on the main trunk line between Talamarang OLT and Melamchi distribution center. Construction work has severed the primary fiber bundle. Emergency repair crew dispatched. Service completely down for Talamarang region affecting 200+ customers.",
    severity: "critical",
    status: "active",
    reportedAt: new Date("2024-01-15T10:30:00"),
    estimatedRepair: new Date("2024-01-16T14:00:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "F002",
    location: "Bhadrapur_2.21 Switch - Power Failure",
    description:
      "Complete power outage at Bhadrapur central switch location. UPS backup depleted after 4 hours. Generator failed to start automatically. All downstream OLTs including RTC endpoint are affected. Local power company estimates 6-8 hours for restoration.",
    severity: "critical",
    status: "active",
    reportedAt: new Date("2024-01-15T08:15:00"),
    estimatedRepair: new Date("2024-01-15T16:30:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "F003",
    location: "Kankraban_4.145 OLT - Equipment Failure",
    description:
      "OLT device experiencing hardware failure with multiple PON ports down. Temperature sensors showing overheating. Cooling system malfunction detected. Device needs replacement. Backup equipment being prepared for deployment.",
    severity: "high",
    status: "investigating",
    reportedAt: new Date("2024-01-14T16:45:00"),
    estimatedRepair: new Date("2024-01-15T18:00:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "F004",
    location: "Kharipath_2.22 Switch - Maintenance Mode",
    description:
      "Scheduled maintenance in progress for firmware upgrade and port cleaning. Some services temporarily rerouted through backup paths. Performance monitoring shows normal operation on alternate routes.",
    severity: "medium",
    status: "investigating",
    reportedAt: new Date("2024-01-15T06:00:00"),
    estimatedRepair: new Date("2024-01-15T14:00:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "F005",
    location: "Jitpur_4.35 OLT - Signal Degradation",
    description:
      "Optical signal strength degradation detected on multiple PON ports. Possible fiber connector contamination or loose connections. Field technician dispatched for cleaning and inspection. Service quality affected but not completely down.",
    severity: "medium",
    status: "active",
    reportedAt: new Date("2024-01-15T09:20:00"),
    estimatedRepair: new Date("2024-01-15T15:30:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "F006",
    location: "BhakundeBesi_4.59 OLT - Maintenance",
    description:
      "Routine preventive maintenance being performed on OLT equipment. Software updates and optical power level optimization in progress. Service temporarily reduced to essential connections only.",
    severity: "low",
    status: "investigating",
    reportedAt: new Date("2024-01-15T07:30:00"),
    estimatedRepair: new Date("2024-01-15T12:00:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "F007",
    location: "Kalank_2.32 Switch - Port Congestion",
    description:
      "High traffic congestion detected on multiple switch ports during peak hours. Bandwidth utilization exceeding 85% threshold. Network optimization and load balancing adjustments being implemented.",
    severity: "medium",
    status: "active",
    reportedAt: new Date("2024-01-14T19:15:00"),
    estimatedRepair: new Date("2024-01-15T16:00:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "F008",
    location: "Nagarkot_2.42 - Kurla_2.12 Fiber Link",
    description:
      "Intermittent packet loss detected on 20Gbps fiber link between Nagarkot hub and Kurla distribution point. Possible fiber bend or micro-fracture. Link performance degraded but operational. Inspection scheduled.",
    severity: "high",
    status: "active",
    reportedAt: new Date("2024-01-15T11:00:00"),
    estimatedRepair: new Date("2024-01-15T20:00:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "F009",
    location: "Shoteshar_4.82 Ep - Environmental Alert",
    description:
      "Temperature and humidity sensors at Shoteshar endpoint showing readings outside normal parameters. Equipment room HVAC system working at maximum capacity. Monitoring for potential equipment stress.",
    severity: "low",
    status: "active",
    reportedAt: new Date("2024-01-15T05:45:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "F010",
    location: "Dolaghat Terminal - Backup Power Test",
    description:
      "Monthly backup power system test completed successfully. All UPS units and generator systems functioning within specifications. No service impact during testing period.",
    severity: "low",
    status: "resolved",
    reportedAt: new Date("2024-01-14T10:00:00"),
    estimatedRepair: new Date("2024-01-14T12:00:00"),
    trunkLine: "trunk-d",
  },
]

const generateDummyDevices = (): NetworkDevice[] => [
  // Switches (Green)
  {
    id: "SW001",
    name: "Melamchi_2.58",
    type: "switch",
    ipAddress: "10.1.2.58",
    location: "Melamchi Distribution Center",
    status: "online",
    model: "Cisco Catalyst 9300",
    ports: 24,
    connectedDevices: 18,
    lastSeen: new Date("2024-01-15T11:45:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "SW002",
    name: "Nagarkot_2.42",
    type: "switch",
    ipAddress: "10.1.2.42",
    location: "Nagarkot Hub",
    status: "online",
    model: "Cisco Catalyst 9300",
    ports: 48,
    connectedDevices: 35,
    lastSeen: new Date("2024-01-15T11:44:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "SW003",
    name: "Kharipath_2.22",
    type: "switch",
    ipAddress: "10.1.2.22",
    location: "Kharipath Junction",
    status: "maintenance",
    model: "Juniper EX4300",
    ports: 24,
    connectedDevices: 20,
    lastSeen: new Date("2024-01-15T10:30:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "SW004",
    name: "Bhadrapur_2.21",
    type: "switch",
    ipAddress: "10.1.2.21",
    location: "Bhadrapur Central",
    status: "offline",
    model: "Cisco Catalyst 2960X",
    ports: 24,
    connectedDevices: 0,
    lastSeen: new Date("2024-01-14T16:20:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "SW005",
    name: "Bhadrapur_2.35",
    type: "switch",
    ipAddress: "10.1.2.35",
    location: "Bhadrapur Secondary",
    status: "online",
    model: "Arista 7050SX",
    ports: 32,
    connectedDevices: 28,
    lastSeen: new Date("2024-01-15T11:42:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "SW006",
    name: "Mahadevi_2.39",
    type: "switch",
    ipAddress: "10.1.2.39",
    location: "Mahadevi Station",
    status: "online",
    model: "Cisco Catalyst 9300",
    ports: 24,
    connectedDevices: 16,
    lastSeen: new Date("2024-01-15T11:41:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "SW007",
    name: "Jagat_2.43",
    type: "switch",
    ipAddress: "10.1.2.43",
    location: "Jagat Distribution Point",
    status: "online",
    model: "Juniper EX4300",
    ports: 24,
    connectedDevices: 22,
    lastSeen: new Date("2024-01-15T11:40:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "SW008",
    name: "Trathali_2.46",
    type: "switch",
    ipAddress: "10.1.2.46",
    location: "Trathali Hub",
    status: "online",
    model: "Cisco Catalyst 9600",
    ports: 48,
    connectedDevices: 42,
    lastSeen: new Date("2024-01-15T11:39:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "SW009",
    name: "Dhulikhel_2.14",
    type: "switch",
    ipAddress: "10.1.2.14",
    location: "Dhulikhel Central",
    status: "online",
    model: "Arista 7050SX",
    ports: 32,
    connectedDevices: 25,
    lastSeen: new Date("2024-01-15T11:38:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "SW010",
    name: "Panchkhal_2.01",
    type: "switch",
    ipAddress: "10.1.2.1",
    location: "Panchkhal Main",
    status: "online",
    model: "Cisco Catalyst 9600",
    ports: 48,
    connectedDevices: 38,
    lastSeen: new Date("2024-01-15T11:37:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "SW011",
    name: "Swoyambhu_2.17",
    type: "switch",
    ipAddress: "10.1.2.17",
    location: "Swoyambhu Temple Area",
    status: "online",
    model: "Cisco Catalyst 2960X",
    ports: 24,
    connectedDevices: 18,
    lastSeen: new Date("2024-01-15T11:36:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "SW012",
    name: "Kalank_2.32",
    type: "switch",
    ipAddress: "10.1.2.32",
    location: "Kalank Industrial Zone",
    status: "maintenance",
    model: "Juniper EX4300",
    ports: 24,
    connectedDevices: 15,
    lastSeen: new Date("2024-01-15T09:15:00"),
    trunkLine: "trunk-a",
  },

  // OLTs (Yellow)
  {
    id: "OLT001",
    name: "Shermathan",
    type: "olt",
    ipAddress: "10.2.1.1",
    location: "Shermathan Distribution Hub",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 14,
    lastSeen: new Date("2024-01-15T11:35:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT002",
    name: "Panchpokhari",
    type: "olt",
    ipAddress: "10.2.1.2",
    location: "Panchpokhari Access Point",
    status: "online",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 6,
    lastSeen: new Date("2024-01-15T11:34:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT003",
    name: "Talamarang",
    type: "olt",
    ipAddress: "10.2.1.3",
    location: "Talamarang Terminal",
    status: "offline",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 0,
    lastSeen: new Date("2024-01-14T18:20:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT004",
    name: "Shoteshar_4.82 Ep",
    type: "olt",
    ipAddress: "10.2.4.82",
    location: "Shoteshar Endpoint",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 12,
    lastSeen: new Date("2024-01-15T11:33:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "OLT005",
    name: "Sankhu_4.200 Gp",
    type: "olt",
    ipAddress: "10.2.4.200",
    location: "Sankhu Gateway Point",
    status: "online",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 7,
    lastSeen: new Date("2024-01-15T11:32:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "OLT006",
    name: "Jitpur_4.35",
    type: "olt",
    ipAddress: "10.2.4.35",
    location: "Jitpur Access Hub",
    status: "maintenance",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 8,
    lastSeen: new Date("2024-01-15T08:45:00"),
    trunkLine: "trunk-b",
  },
  {
    id: "OLT007",
    name: "RTC_4.33 Ep",
    type: "olt",
    ipAddress: "10.2.4.33",
    location: "RTC Endpoint",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 13,
    lastSeen: new Date("2024-01-15T11:31:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "OLT008",
    name: "Purano Thimi_4.48 Ep",
    type: "olt",
    ipAddress: "10.2.4.48",
    location: "Purano Thimi Endpoint",
    status: "online",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 6,
    lastSeen: new Date("2024-01-15T11:30:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "OLT009",
    name: "Banachaur_4.38",
    type: "olt",
    ipAddress: "10.2.4.38",
    location: "Banachaur Terminal",
    status: "online",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 10,
    lastSeen: new Date("2024-01-15T11:29:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "OLT010",
    name: "Palanse_4.50",
    type: "olt",
    ipAddress: "10.2.4.50",
    location: "Palanse Distribution",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 14,
    lastSeen: new Date("2024-01-15T11:28:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "OLT011",
    name: "Kankraban_4.145",
    type: "olt",
    ipAddress: "10.2.4.145",
    location: "Kankraban Access Point",
    status: "offline",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 0,
    lastSeen: new Date("2024-01-14T14:15:00"),
    trunkLine: "trunk-c",
  },
  {
    id: "OLT012",
    name: "KBC_4.49 Ep",
    type: "olt",
    ipAddress: "10.2.4.49",
    location: "KBC Endpoint",
    status: "online",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 9,
    lastSeen: new Date("2024-01-15T11:27:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT013",
    name: "BhakundeBesi_4.51",
    type: "olt",
    ipAddress: "10.2.4.51",
    location: "BhakundeBesi Terminal",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 12,
    lastSeen: new Date("2024-01-15T11:26:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT014",
    name: "BhakundeBesi_4.59",
    type: "olt",
    ipAddress: "10.2.4.59",
    location: "BhakundeBesi Secondary",
    status: "maintenance",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 5,
    lastSeen: new Date("2024-01-15T07:30:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT015",
    name: "Dhunge Adda_4.18 Ep",
    type: "olt",
    ipAddress: "10.2.4.18",
    location: "Dhunge Adda Endpoint",
    status: "online",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 8,
    lastSeen: new Date("2024-01-15T11:25:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT016",
    name: "Raul Tole_4.22 Gp",
    type: "olt",
    ipAddress: "10.2.4.22",
    location: "Raul Tole Gateway",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 11,
    lastSeen: new Date("2024-01-15T11:24:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT017",
    name: "Machhegaun_4.13 Ep",
    type: "olt",
    ipAddress: "10.2.4.13",
    location: "Machhegaun Endpoint",
    status: "online",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 6,
    lastSeen: new Date("2024-01-15T11:23:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT018",
    name: "Panchkhal_4.80 GP",
    type: "olt",
    ipAddress: "10.2.4.80",
    location: "Panchkhal Gateway Point",
    status: "online",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 10,
    lastSeen: new Date("2024-01-15T11:22:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT019",
    name: "Panchkhal_4.01 EP",
    type: "olt",
    ipAddress: "10.2.4.1",
    location: "Panchkhal Primary Endpoint",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 15,
    lastSeen: new Date("2024-01-15T11:21:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT020",
    name: "Aadghari_4.69 Ep",
    type: "olt",
    ipAddress: "10.2.4.69",
    location: "Aadghari Endpoint",
    status: "online",
    model: "Nokia 7360 ISAM FX",
    ports: 8,
    connectedDevices: 7,
    lastSeen: new Date("2024-01-15T11:20:00"),
    trunkLine: "trunk-d",
  },
  {
    id: "OLT021",
    name: "Kurla_2.12",
    type: "olt",
    ipAddress: "10.2.2.12",
    location: "Kurla Distribution Hub",
    status: "online",
    model: "ZTE C320",
    ports: 12,
    connectedDevices: 9,
    lastSeen: new Date("2024-01-15T11:19:00"),
    trunkLine: "trunk-a",
  },
  {
    id: "OLT022",
    name: "Dolaghat",
    type: "olt",
    ipAddress: "10.2.5.1",
    location: "Dolaghat Terminal",
    status: "online",
    model: "Huawei MA5800-X7",
    ports: 16,
    connectedDevices: 13,
    lastSeen: new Date("2024-01-15T11:18:00"),
    trunkLine: "trunk-d",
  },
]

const generateDummyLinks = (devices: NetworkDevice[]): NetworkLink[] => [
  // Main backbone connections
  {
    id: "LINK001",
    sourceDeviceId: "SW001", // Melamchi_2.58
    targetDeviceId: "OLT021", // Kurla_2.12
    sourcePort: "Gi0/1",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "20Gbps",
    status: "active",
  },
  {
    id: "LINK002",
    sourceDeviceId: "SW001", // Melamchi_2.58
    targetDeviceId: "SW002", // Nagarkot_2.42
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "20Gbps",
    status: "active",
  },
  {
    id: "LINK003",
    sourceDeviceId: "SW002", // Nagarkot_2.42
    targetDeviceId: "SW010", // Panchkhal_2.01
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "14Gbps",
    status: "active",
  },
  {
    id: "LINK004",
    sourceDeviceId: "SW010", // Panchkhal_2.01
    targetDeviceId: "SW009", // Dhulikhel_2.14
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "9Gbps",
    status: "active",
  },
  {
    id: "LINK005",
    sourceDeviceId: "SW010", // Panchkhal_2.01
    targetDeviceId: "OLT022", // Dolaghat
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "20Gbps",
    status: "active",
  },
  {
    id: "LINK006",
    sourceDeviceId: "SW001", // Melamchi_2.58
    targetDeviceId: "OLT001", // Shermathan
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK007",
    sourceDeviceId: "OLT001", // Shermathan
    targetDeviceId: "OLT002", // Panchpokhari
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK008",
    sourceDeviceId: "SW001", // Melamchi_2.58
    targetDeviceId: "OLT003", // Talamarang
    sourcePort: "Gi0/4",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "inactive",
  },
  {
    id: "LINK009",
    sourceDeviceId: "OLT004", // Shoteshar_4.82 Ep
    targetDeviceId: "SW003", // Kharipath_2.22
    sourcePort: "GE0/1",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "10Gbps",
    status: "active",
  },
  {
    id: "LINK010",
    sourceDeviceId: "OLT005", // Sankhu_4.200 Gp
    targetDeviceId: "SW003", // Kharipath_2.22
    sourcePort: "GE0/1",
    targetPort: "Gi0/2",
    linkType: "fiber",
    bandwidth: "10Gbps",
    status: "active",
  },
  {
    id: "LINK011",
    sourceDeviceId: "SW003", // Kharipath_2.22
    targetDeviceId: "OLT006", // Jitpur_4.35
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK012",
    sourceDeviceId: "SW003", // Kharipath_2.22
    targetDeviceId: "SW005", // Bhadrapur_2.35
    sourcePort: "Gi0/4",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK013",
    sourceDeviceId: "SW005", // Bhadrapur_2.35
    targetDeviceId: "SW006", // Mahadevi_2.39
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK014",
    sourceDeviceId: "SW006", // Mahadevi_2.39
    targetDeviceId: "SW007", // Jagat_2.43
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "30Gbps",
    status: "active",
  },
  {
    id: "LINK015",
    sourceDeviceId: "SW007", // Jagat_2.43
    targetDeviceId: "SW008", // Trathali_2.46
    sourcePort: "Gi0/2",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "30Gbps",
    status: "active",
  },
  {
    id: "LINK016",
    sourceDeviceId: "SW008", // Trathali_2.46
    targetDeviceId: "SW009", // Dhulikhel_2.14
    sourcePort: "Gi0/2",
    targetPort: "Gi0/2",
    linkType: "fiber",
    bandwidth: "18Gbps",
    status: "active",
  },
  {
    id: "LINK017",
    sourceDeviceId: "SW007", // Jagat_2.43
    targetDeviceId: "OLT010", // Palanse_4.50
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK018",
    sourceDeviceId: "SW005", // Bhadrapur_2.35
    targetDeviceId: "OLT009", // Banachaur_4.38
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK019",
    sourceDeviceId: "SW008", // Trathali_2.46
    targetDeviceId: "OLT011", // Kankraban_4.145
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "inactive",
  },
  {
    id: "LINK020",
    sourceDeviceId: "SW009", // Dhulikhel_2.14
    targetDeviceId: "OLT012", // KBC_4.49 Ep
    sourcePort: "Gi0/3",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK021",
    sourceDeviceId: "SW009", // Dhulikhel_2.14
    targetDeviceId: "OLT013", // BhakundeBesi_4.51
    sourcePort: "Gi0/4",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK022",
    sourceDeviceId: "OLT013", // BhakundeBesi_4.51
    targetDeviceId: "OLT014", // BhakundeBesi_4.59
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK023",
    sourceDeviceId: "SW010", // Panchkhal_2.01
    targetDeviceId: "OLT018", // Panchkhal_4.80 GP
    sourcePort: "Gi0/4",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK024",
    sourceDeviceId: "OLT018", // Panchkhal_4.80 GP
    targetDeviceId: "OLT019", // Panchkhal_4.01 EP
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK025",
    sourceDeviceId: "OLT019", // Panchkhal_4.01 EP
    targetDeviceId: "OLT020", // Aadghari_4.69 Ep
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  // Additional connections from diagram
  {
    id: "LINK026",
    sourceDeviceId: "SW011", // Swoyambhu_2.17
    targetDeviceId: "SW012", // Kalank_2.32
    sourcePort: "Gi0/1",
    targetPort: "Gi0/1",
    linkType: "fiber",
    bandwidth: "10Gbps",
    status: "active",
  },
  {
    id: "LINK027",
    sourceDeviceId: "SW012", // Kalank_2.32
    targetDeviceId: "OLT015", // Dhunge Adda_4.18 Ep
    sourcePort: "Gi0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK028",
    sourceDeviceId: "OLT015", // Dhunge Adda_4.18 Ep
    targetDeviceId: "OLT016", // Raul Tole_4.22 Gp
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK029",
    sourceDeviceId: "OLT016", // Raul Tole_4.22 Gp
    targetDeviceId: "OLT017", // Machhegaun_4.13 Ep
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
  {
    id: "LINK030",
    sourceDeviceId: "SW004", // Bhadrapur_2.21
    targetDeviceId: "OLT007", // RTC_4.33 Ep
    sourcePort: "Gi0/1",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "10Gbps",
    status: "inactive",
  },
  {
    id: "LINK031",
    sourceDeviceId: "OLT007", // RTC_4.33 Ep
    targetDeviceId: "OLT008", // Purano Thimi_4.48 Ep
    sourcePort: "GE0/2",
    targetPort: "GE0/1",
    linkType: "fiber",
    bandwidth: "1Gbps",
    status: "active",
  },
]

export default function NetworkFaultMonitor() {
  const [faults, setFaults] = useState<Fault[]>(generateDummyFaults())
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>(generateDummyDevices())
  const [networkLinks, setNetworkLinks] = useState<NetworkLink[]>(() => generateDummyLinks(generateDummyDevices()))
  const [showAddForm, setShowAddForm] = useState(false)

  const addFault = (newFault: Omit<Fault, "id" | "reportedAt">) => {
    const fault: Fault = {
      ...newFault,
      id: `F${String(faults.length + 1).padStart(3, "0")}`,
      reportedAt: new Date(),
    }
    setFaults([fault, ...faults])
    setShowAddForm(false)
  }

  const updateFaultStatus = (id: string, status: Fault["status"]) => {
    setFaults(faults.map((fault) => (fault.id === id ? { ...fault, status } : fault)))
  }

  const updateFault = (id: string, updates: Partial<Fault>) => {
    setFaults(faults.map((fault) => (fault.id === id ? { ...fault, ...updates } : fault)))
  }

  const addNetworkDevice = (newDevice: Omit<NetworkDevice, "id" | "lastSeen">) => {
    const device: NetworkDevice = {
      ...newDevice,
      id: `${newDevice.type.toUpperCase()}${String(networkDevices.filter((d) => d.type === newDevice.type).length + 1).padStart(3, "0")}`,
      lastSeen: new Date(),
      trunkLine: newDevice.trunkLine || "trunk-a",
    }
    setNetworkDevices([device, ...networkDevices])
  }

  const updateNetworkDevice = (id: string, updates: Partial<NetworkDevice>) => {
    setNetworkDevices(
      networkDevices.map((device) => (device.id === id ? { ...device, ...updates, lastSeen: new Date() } : device)),
    )
  }

  const deleteNetworkDevice = (id: string) => {
    setNetworkDevices(networkDevices.filter((device) => device.id !== id))
    // Also remove any links connected to this device
    setNetworkLinks(networkLinks.filter((link) => link.sourceDeviceId !== id && link.targetDeviceId !== id))
  }

  const addNetworkLink = (newLink: Omit<NetworkLink, "id">) => {
    const link: NetworkLink = {
      ...newLink,
      id: `LINK${String(networkLinks.length + 1).padStart(3, "0")}`,
    }
    setNetworkLinks([link, ...networkLinks])
  }

  const deleteNetworkLink = (id: string) => {
    setNetworkLinks(networkLinks.filter((link) => link.id !== id))
  }

  const updateDeviceStatus = (id: string, status: NetworkDevice["status"]) => {
    setNetworkDevices(
      networkDevices.map((device) => (device.id === id ? { ...device, status, lastSeen: new Date() } : device)),
    )
  }

  const activeFaults = faults.filter((fault) => fault.status === "active")
  const criticalFaults = faults.filter((fault) => fault.severity === "critical")
  const onlineDevices = networkDevices.filter((device) => device.status === "online")
  const offlineDevices = networkDevices.filter((device) => device.status === "offline")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Network Fault Monitor</h1>
              <p className="text-sm text-gray-600">Real-time network trunk line monitoring</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Report Fault
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Faults</p>
                    <p className="text-3xl font-bold text-gray-900">{faults.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Faults</p>
                    <p className="text-3xl font-bold text-red-600">{activeFaults.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                    <p className="text-3xl font-bold text-red-800">{criticalFaults.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network Devices</p>
                    <p className="text-3xl font-bold text-blue-600">{networkDevices.length}</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network Links</p>
                    <p className="text-3xl font-bold text-green-600">{networkLinks.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="diagram" className="space-y-4">
            <TabsList>
              <TabsTrigger value="diagram">Interactive Network Diagram</TabsTrigger>
              <TabsTrigger value="faults">Active Faults</TabsTrigger>
            </TabsList>

            <TabsContent value="diagram">
              <NetworkDiagram
                faults={faults}
                networkDevices={networkDevices}
                networkLinks={networkLinks}
                onAddDevice={addNetworkDevice}
                onUpdateDevice={updateNetworkDevice}
                onDeleteDevice={deleteNetworkDevice}
                onAddLink={addNetworkLink}
                onDeleteLink={deleteNetworkLink}
              />
            </TabsContent>

            <TabsContent value="faults">
              <Card>
                <CardHeader>
                  <CardTitle>Network Trunk Line Faults</CardTitle>
                  <CardDescription>Monitor and manage active faults across all network trunk lines</CardDescription>
                </CardHeader>
                <CardContent>
                  <FaultList faults={faults} onUpdateStatus={updateFaultStatus} onUpdateFault={updateFault} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add Fault Modal */}
      {showAddForm && (
        <AddFaultForm
          onSubmit={addFault}
          onCancel={() => setShowAddForm(false)}
          networkDevices={networkDevices}
          networkLinks={networkLinks}
        />
      )}
    </div>
  )
}
