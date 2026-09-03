"use client"

import {
  Baby,
  Camera,
  Church,
  Guitar,
  HandHeart,
  Handshake,
  HardHat,
  Heart,
  Mic,
  Music,
  Sparkles,
  Users,
  Volume2,
  BookOpen,
  Cross,
  Flower2,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** Curated Lucide icons available for ministries */
export const MINISTRY_ICON_OPTIONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "Church", label: "Igreja", Icon: Church },
  { name: "Volume2", label: "Som", Icon: Volume2 },
  { name: "Mic", label: "Microfone", Icon: Mic },
  { name: "Music", label: "Música", Icon: Music },
  { name: "Guitar", label: "Violão", Icon: Guitar },
  { name: "HandHeart", label: "Oração", Icon: HandHeart },
  { name: "Handshake", label: "Comunhão", Icon: Handshake },
  { name: "Camera", label: "Mídia", Icon: Camera },
  { name: "Baby", label: "Crianças", Icon: Baby },
  { name: "HardHat", label: "Serviço", Icon: HardHat },
  { name: "Sparkles", label: "Dança", Icon: Sparkles },
  { name: "Users", label: "Pessoas", Icon: Users },
  { name: "Heart", label: "Coração", Icon: Heart },
  { name: "BookOpen", label: "Estudo", Icon: BookOpen },
  { name: "Cross", label: "Cruz", Icon: Cross },
  { name: "Flower2", label: "Flor", Icon: Flower2 },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  MINISTRY_ICON_OPTIONS.map(({ name, Icon }) => [name, Icon])
)

function isEmoji(value: string): boolean {
  // Rough check: emoji / pictograph range or multi-byte symbols
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(value)
}

function initialsFromName(name?: string | null): string {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0] ?? ""
  const second = parts[1]
  if (!second) return first.slice(0, 2).toUpperCase()
  return ((first[0] ?? "") + (second[0] ?? "")).toUpperCase() || "?"
}

export type MinistryIconProps = {
  name?: string | null
  ministryName?: string | null
  color?: string | null
  /** App v2: always ink — ignore ministry color */
  mono?: boolean
  className?: string
  size?: number
} & Omit<LucideProps, "ref">

export function MinistryIcon({
  name,
  ministryName,
  color,
  mono = false,
  className,
  size = 20,
  ...props
}: MinistryIconProps) {
  const key = name?.trim()
  const Icon = key && !isEmoji(key) ? ICON_MAP[key] : undefined
  const ink = "#0a0a0a"
  const resolved = mono ? ink : color || undefined

  if (Icon) {
    return (
      <Icon
        className={cn("shrink-0", className)}
        size={size}
        style={resolved ? { color: resolved } : undefined}
        aria-hidden
        {...props}
      />
    )
  }

  // Fallback: initials in a tinted circle (no emoji)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.4),
        backgroundColor: mono ? "#e5e5e5" : resolved ? `${resolved}22` : "#e5e5e5",
        color: mono ? ink : resolved || ink,
      }}
      aria-hidden
    >
      {initialsFromName(ministryName || key)}
    </span>
  )
}

export function MinistryIconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (name: string) => void
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {MINISTRY_ICON_OPTIONS.map(({ name, label, Icon }) => {
        const selected = value === name
        return (
          <button
            key={name}
            type="button"
            title={label}
            onClick={() => onChange(name)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-[10px] transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate w-full text-center">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
