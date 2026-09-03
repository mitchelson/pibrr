"use client"

import { useEffect } from "react"
import { setUiCookie, type AppUiVersion } from "@/lib/app-ui"

export function UiCookieSync({ version }: { version: AppUiVersion }) {
  useEffect(() => {
    setUiCookie(version)
  }, [version])
  return null
}
