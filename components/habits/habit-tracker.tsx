"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Flame, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn, computeStreak, todayISO, HABIT_COLORS } from "@/lib/utils"
import type { Habit, HabitLog } from "@/lib/db/schema"

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "red", label: "Red" },
  { value: "amber", label: "Amber" },
  { value: "pink", label: "Pink" },
  { value: "indigo", label: "Indigo" },
  { value: "teal", label: "Teal" },
]

function AddHabitDialog({ onAdd }: { onAdd: (habit: Habit) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("blue")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
    })
    const habit = await res.json()
    onAdd(habit)
    setName("")
    setDescription("")
    setColor("blue")
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Habit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Habit</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Habit Name</Label>
            <Input placeholder="e.g., Morning meditation" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Why this habit?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", HABIT_COLORS[color])} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", HABIT_COLORS[c.value])} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HabitCard({
  habit,
  logs,
  onToggle,
  onDelete,
}: {
  habit: Habit
  logs: HabitLog[]
  onToggle: () => void
  onDelete: () => void
}) {
  const today = todayISO()
  const habitLogs = logs.filter(l => l.habitId === habit.id)
  const completedToday = habitLogs.some(l => l.completedDate === today)
  const streak = computeStreak(habitLogs.map(l => l.completedDate))

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split("T")[0]
  })

  return (
    <Card className={cn("transition-all", completedToday && "ring-1 ring-offset-1", completedToday && `ring-${habit.color}-300`)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("h-3 w-3 rounded-full flex-shrink-0", HABIT_COLORS[habit.color])} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{habit.name}</p>
              {habit.description && (
                <p className="text-xs text-neutral-500 truncate">{habit.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <Flame className="h-3.5 w-3.5" />{streak}
              </span>
            )}
            <button
              onClick={onToggle}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center transition-all border-2",
                completedToday
                  ? "bg-neutral-900 border-neutral-900 text-white"
                  : "border-neutral-300 hover:border-neutral-400"
              )}
            >
              {completedToday && <Check className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onDelete} className="text-neutral-300 hover:text-red-400 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {last7.map(date => {
            const done = habitLogs.some(l => l.completedDate === date)
            return (
              <div
                key={date}
                className={cn(
                  "flex-1 h-1.5 rounded-full",
                  done ? HABIT_COLORS[habit.color] : "bg-neutral-100"
                )}
                title={date}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/habits")
      .then(r => r.json())
      .then(data => {
        setHabits(data.habits)
        setLogs(data.logs)
        setLoading(false)
      })
  }, [])

  async function toggleHabit(habitId: number) {
    const today = todayISO()
    const res = await fetch(`/api/habits/${habitId}/log`, { method: "POST" })
    const data = await res.json()
    if (data.toggled) {
      setLogs(prev => [...prev, { id: Date.now(), habitId, completedDate: today, createdAt: new Date() }])
    } else {
      setLogs(prev => prev.filter(l => !(l.habitId === habitId && l.completedDate === today)))
    }
  }

  async function deleteHabit(id: number) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" })
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => prev.filter(l => l.habitId !== id))
  }

  const todayDone = habits.filter(h => logs.some(l => l.habitId === h.id && l.completedDate === todayISO())).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {habits.length > 0 ? `${todayDone} / ${habits.length} done today` : "Track your daily habits"}
        </p>
        <AddHabitDialog onAdd={habit => setHabits(prev => [habit, ...prev])} />
      </div>
      {loading ? (
        <div className="text-sm text-neutral-400 py-8 text-center">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">No habits yet. Add one above!</div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              logs={logs}
              onToggle={() => toggleHabit(habit.id)}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
