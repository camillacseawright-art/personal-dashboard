"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn, formatDate, PRIORITY_COLORS } from "@/lib/utils"
import type { Task } from "@/lib/db/schema"

function AddTaskDialog({ onAdd }: { onAdd: (task: Task) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, priority, dueDate: dueDate || null }),
    })
    const task = await res.json()
    onAdd(task)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setDueDate("")
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Add details..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TaskList({ filter }: { filter?: "todo" | "done" | "all" }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>(filter ?? "todo")

  useEffect(() => {
    fetch("/api/tasks")
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false) })
  }, [])

  async function toggleStatus(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done"
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => {
    if (activeFilter === "todo") return t.status === "todo"
    if (activeFilter === "done") return t.status === "done"
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {["todo", "done", "all"].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                activeFilter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "todo" && ` (${tasks.filter(t => t.status === "todo").length})`}
            </button>
          ))}
        </div>
        <AddTaskDialog onAdd={task => setTasks(prev => [task, ...prev])} />
      </div>

      {loading ? (
        <div className="text-sm text-neutral-400 py-8 text-center">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">
          {activeFilter === "todo" ? "All caught up! Add a task above." : "No tasks here."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card key={task.id} className={cn("transition-opacity", task.status === "done" && "opacity-60")}>
              <CardContent className="p-3 flex items-start gap-3">
                <button onClick={() => toggleStatus(task)} className="mt-0.5 flex-shrink-0 text-neutral-400 hover:text-neutral-900 transition-colors">
                  {task.status === "done"
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-neutral-400")}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", PRIORITY_COLORS[task.priority])}>
                      <Flag className="h-2.5 w-2.5 inline mr-0.5" />{task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="flex-shrink-0 text-neutral-300 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
