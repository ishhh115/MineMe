import { getSettingsPageData } from "./data"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const { organisation, groups } = await getSettingsPageData()
  return <SettingsClient organisation={organisation} groups={groups} />
}