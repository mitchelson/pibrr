"use client"

import { AppShell } from "@/components/app-shell"
import { AppShellV2 } from "@/components/app-v2/app-shell"
import { useAppUi } from "@/hooks/use-app-ui"

export function MemberShell({
  children,
  showTabs = true,
}: {
  children: React.ReactNode
  showTabs?: boolean
}) {
  const { version } = useAppUi()
  if (version === "v2") {
    return <AppShellV2 showTabs={showTabs}>{children}</AppShellV2>
  }
  return <AppShell showTabs={showTabs}>{children}</AppShell>
}
