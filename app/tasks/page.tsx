import { TaskList } from "@/components/tasks/task-list"

export default function TasksPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tasks</h2>
        <p className="text-neutral-500 mt-1">Capture and manage everything you need to do.</p>
      </div>
      <TaskList />
    </div>
  )
}
