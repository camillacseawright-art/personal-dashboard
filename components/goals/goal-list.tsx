"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Target, CheckCircle2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { cn, formatDate } from "@/lib/utils"
import type { Goal } from "@/lib/db/schema"

function GoalDialog({ onSave, existing }: { onSave: (goal: Goal) => void; existing?: Goal }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "")
  const [progress, setProgress] = useState(existing?.progress ?? 0)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const body = { title: title.trim(), description: description.trim() || null, targetDate: targetDate || null, progress }
    const res = existing
      ? await fetch(`/api/goals/${existing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const goal = await res.json()
    onSave(goal)
    if (!existing) { setTitle(""); setDescription(""); setTargetDate(""); setProgress(0) }
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing
          ? <button className="text-neutral-300 hover:text-neutral-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
          : <Button size="sm"><Plus className="h-4 w-4" /> Add Goal</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{existing ? "Edit Goal" : "New Goal"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Input placeholder="What do you want to achieve?" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Why does this matter to you?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Progress ({progress}%)</Label>
              <input
                type="range" min={0} max={100} value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : existing ? "Update Goal" : "Add Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GoalList() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active")

  useEffect(() => {
    fetch("/api/goals").then(r => r.json()).then(data => { setGoals(data); setLoading(false) })
  }, [])

  async function toggleStatus(goal: Goal) {
    const newStatus = goal.status === "completed" ? "active" : "completed"
    const newProgress = newStatus === "completed" ? 100 : goal.progress
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, progress: newProgress }),
    })
    const updated = await res.json()
    setGoals(prev => prev.map(g => (g.id === updated.id ? updated : g)))
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" })
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const filtered = goals.filter(g => filter === "all" ? true : g.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["active", "completed", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <GoalDialog onSave={goal => setGoals(prev => [goal, ...prev])} />
      </div>

      {loading ? (
        <div className="text-sm text-neutral-400 py-8 text-center">Loading goals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">
          {filter === "active" ? "No active goals. Set one!" : "Nothing here yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <Card key={goal.id} className={cn(goal.status === "completed" && "opacity-70")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleStatus(goal)} className="mt-0.5 flex-shrink-0 text-neutral-400 hover:text-neutral-900 transition-colors">
                    {goal.status === "completed"
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Target className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", goal.status === "completed" && "line-through text-neutral-400")}>
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{goal.description}</p>
                    )}
                    {goal.targetDate && (
                      <p className="text-xs text-neutral-400 mt-1">Target: {formatDate(goal.targetDate)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GoalDialog existing={goal} onSave={updated => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))} />
                    <button onClick={() => deleteGoal(goal.id)} className="text-neutral-300 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
