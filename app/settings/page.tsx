import { getSettingsPageData } from "./data"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const { organisation, stats } = await getSettingsPageData()
  return <SettingsClient organisation={organisation} stats={stats} />
}