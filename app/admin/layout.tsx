import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminShellV2 } from "@/components/app-v2/admin-shell"

export default async function AdminV2Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return <AdminShellV2>{children}</AdminShellV2>
}
