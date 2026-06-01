import { TasksClient } from "./tasks-client"
import { getTasksPageData } from "./data"

export default async function TasksPage() {
  const data = await getTasksPageData()
  return <TasksClient tasks={data.tasks} />
}