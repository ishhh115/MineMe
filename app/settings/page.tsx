import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSettingsPageData } from "./data"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const { organisation, stats } = await getSettingsPageData()
  return <SettingsClient organisation={organisation} stats={stats} />
}