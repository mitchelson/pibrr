"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  APP_PATHS,
  envUiVersion,
  readUiCookieFromDocument,
  resolveUiVersion,
  setUiCookie,
  type AppPaths,
  type AppUiVersion,
} from "@/lib/app-ui"

export function useAppUi() {
  const [version, setVersion] = useState<AppUiVersion>(envUiVersion)

  useEffect(() => {
    setVersion(resolveUiVersion(readUiCookieFromDocument()))
  }, [])

  const switchTo = useCallback((next: AppUiVersion) => {
    setUiCookie(next)
    setVersion(envUiVersion() === "v2" ? "v2" : next)
  }, [])

  const paths: AppPaths = useMemo(() => APP_PATHS[version], [version])
  const isPreview = version === "v2" && envUiVersion() !== "v2"

  return { version, paths, isPreview, switchTo }
}
