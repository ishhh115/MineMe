import NotificationsClient from "./notifications-client"
import { getNotificationsPageData } from "./data"

export default async function NotificationsPage() {
  const { notifications } = await getNotificationsPageData()
  return <NotificationsClient notifications={notifications} />
}
