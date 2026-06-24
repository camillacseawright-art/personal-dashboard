import { HabitTracker } from "@/components/habits/habit-tracker"

export default function HabitsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Habits</h2>
        <p className="text-neutral-500 mt-1">Build consistency with daily habit tracking.</p>
      </div>
      <HabitTracker />
    </div>
  )
}
