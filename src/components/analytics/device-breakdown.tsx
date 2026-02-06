"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Monitor, Smartphone, Tablet } from "lucide-react"
import { formatPercentage } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeviceItem {
  name: string
  value: number
}

interface DeviceBreakdownProps {
  data: DeviceItem[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#4f46e5",
  Mobile: "#06b6d4",
  Tablet: "#8b5cf6",
}

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
}

// ---------------------------------------------------------------------------
// Custom legend
// ---------------------------------------------------------------------------

function CustomLegend({ data, total }: { data: DeviceItem[]; total: number }) {
  return (
    <div className="mt-4 space-y-2">
      {data.map((item) => {
        const Icon = DEVICE_ICONS[item.name] ?? Monitor
        const pct = total > 0 ? (item.value / total) * 100 : 0
        const color = DEVICE_COLORS[item.name] ?? "#6b7280"

        return (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <Icon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">
                {item.value.toLocaleString()}
              </span>
              <span className="w-12 text-right text-gray-500">
                {formatPercentage(pct)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Monitor className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">
          No device data available.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={DEVICE_COLORS[entry.name] ?? "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={((value: number | undefined, name: string | undefined) => [
                `${(value ?? 0).toLocaleString()} (${formatPercentage(
                  total > 0 ? ((value ?? 0) / total) * 100 : 0
                )})`,
                name ?? "",
              ]) as never}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend data={data} total={total} />
    </div>
  )
}
