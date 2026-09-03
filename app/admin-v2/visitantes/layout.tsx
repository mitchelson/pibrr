"use client"

import { AcolhimentoGate } from "@/components/app-v2/acolhimento-gate"

export default function AcolhimentoLayout({ children }: { children: React.ReactNode }) {
  return <AcolhimentoGate>{children}</AcolhimentoGate>
}
