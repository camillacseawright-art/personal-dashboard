import { GoalList } from "@/components/goals/goal-list"

export default function GoalsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Goals</h2>
        <p className="text-neutral-500 mt-1">Track long-term goals and measure your progress.</p>
      </div>
      <GoalList />
    </div>
  )
}
