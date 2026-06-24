"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, CheckCircle2, Circle, Stethoscope, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { HealthRecord } from "@/lib/db/schema"
import { differenceInDays, parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"

const RECORD_TYPES = ["appointment","well-visit","vaccination","dentist","prescription","therapy","specialist","checkup"]

type FormState = { memberName: string; recordType: string; provider: string; scheduledDate: string; notes: string }
const EMPTY_FORM: FormState = { memberName: "", recordType: "appointment", provider: "", scheduledDate: "", notes: "" }

function RecordForm({ initial, onSave, onCancel }: { initial: FormState; onSave: (f: FormState) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(initial)
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Family Member</Label><Input required placeholder="Mom / Dad / Kid name" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Type</Label>
          <Select value={form.recordType} onValueChange={v => setForm(f => ({ ...f, recordType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{RECORD_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Provider / Doctor</Label><Input placeholder="Dr. Smith" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} /></div>
      </div>
      <div className="space-y-1"><Label>Notes</Label><Input placeholder="Bring insurance card, fasting required..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1 bg-[#C8553D] hover:bg-[#A8442F]">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => { fetch("/api/health").then(r => r.json()).then(setRecords) }, [])

  async function addRecord(form: FormState) {
    const res = await fetch("/api/health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const record = await res.json()
    setRecords(prev => [...prev, record].sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "")))
    setAddOpen(false)
  }

  async function saveEdit(id: number, form: FormState) {
    const res = await fetch(`/api/health/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const updated = await res.json()
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r).sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "")))
    setEditingId(null)
  }

  async function toggleComplete(record: HealthRecord) {
    const res = await fetch(`/api/health/${record.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isCompleted: !record.isCompleted }) })
    const updated = await res.json()
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  async function deleteRecord(id: number) {
    await fetch(`/api/health/${id}`, { method: "DELETE" })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const upcoming = records.filter(r => !r.isCompleted)
  const completed = records.filter(r => r.isCompleted)

  const byMember = upcoming.reduce<Record<string, HealthRecord[]>>((acc, r) => {
    if (!acc[r.memberName]) acc[r.memberName] = []
    acc[r.memberName].push(r)
    return acc
  }, {})

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Health</h2>
          <p className="text-[#8B7355] mt-1">Appointments, vaccinations, prescriptions for the whole family.</p></div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button className="bg-[#C8553D] hover:bg-[#A8442F]"><Plus className="h-4 w-4 mr-1" /> Add Record</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Health Record</DialogTitle></DialogHeader>
            <RecordForm initial={EMPTY_FORM} onSave={addRecord} onCancel={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length === 0 && <p className="text-sm text-[#8B7355] italic text-center py-8">No upcoming appointments.</p>}

      {Object.entries(byMember).map(([member, memberRecords]) => (
        <div key={member}>
          <h3 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2 flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5" /> {member}
          </h3>
          <div className="space-y-2">
            {memberRecords.map(record => {
              const d = record.scheduledDate ? differenceInDays(parseISO(record.scheduledDate), new Date()) : null
              const isEditing = editingId === record.id
              return (
                <Card key={record.id}>
                  <CardContent className="p-3">
                    {isEditing ? (
                      <RecordForm
                        initial={{ memberName: record.memberName, recordType: record.recordType ?? "appointment", provider: record.provider ?? "", scheduledDate: record.scheduledDate ?? "", notes: record.notes ?? "" }}
                        onSave={form => saveEdit(record.id, form)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleComplete(record)} className="flex-shrink-0">
                          {record.isCompleted
                            ? <CheckCircle2 className="h-5 w-5 text-[#87A96B]" />
                            : <Circle className="h-5 w-5 text-neutral-300 hover:text-[#87A96B] transition-colors" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-[#2C2416] capitalize">{record.recordType}</p>
                            {record.provider && <span className="text-xs text-[#8B7355]">· {record.provider}</span>}
                          </div>
                          {record.scheduledDate && <p className="text-xs text-[#8B7355]">{format(parseISO(record.scheduledDate), "EEEE, MMMM d, yyyy")}</p>}
                          {record.notes && <p className="text-xs text-[#8B7355] italic mt-0.5">{record.notes}</p>}
                        </div>
                        {d !== null && (
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                            d < 0 ? "bg-[#C8553D] text-white" : d <= 3 ? "bg-[#D4A574] text-white" : "bg-[#EBF2E5] text-[#87A96B]"
                          )}>{d < 0 ? "Past" : d === 0 ? "Today" : `${d}d`}</span>
                        )}
                        <button onClick={() => setEditingId(record.id)} className="text-neutral-300 hover:text-[#C8553D] transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteRecord(record.id)} className="text-neutral-300 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {completed.length > 0 && (
        <details>
          <summary className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide cursor-pointer hover:text-[#2C2416]">
            Completed ({completed.length})
          </summary>
          <div className="mt-2 space-y-1">
            {completed.slice(0, 10).map(record => (
              <div key={record.id} className="flex items-center gap-2 text-sm opacity-60">
                <CheckCircle2 className="h-4 w-4 text-[#87A96B]" />
                <span className="line-through text-[#8B7355]">{record.memberName} · {record.recordType}</span>
                {record.scheduledDate && <span className="text-xs">{format(parseISO(record.scheduledDate), "MMM d")}</span>}
                <button onClick={() => deleteRecord(record.id)} className="ml-auto text-neutral-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
