import { TasksClient } from "./tasks-client"
import { getTasksPageData } from "./data"

export default async function TasksPage() {
  const data = await getTasksPageData()

  console.log("TASKS PAGE DATA")
  console.log(data)

  return <TasksClient tasks={data.tasks} />
}
