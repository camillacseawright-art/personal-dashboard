"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, User, Baby, PawPrint, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { FamilyMember } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { differenceInYears, parseISO } from "date-fns"

const COLORS: Record<string, string> = {
  terracotta: "bg-[#C8553D]", sage: "bg-[#87A96B]", amber: "bg-[#D4A574]",
  blue: "bg-blue-400", purple: "bg-purple-400", pink: "bg-pink-400",
}

function MemberCard({ member, onDelete, onEdit }: { member: FamilyMember; onDelete: () => void; onEdit: () => void }) {
  const Icon = member.role === "kid" ? Baby : member.role === "pet" ? PawPrint : User
  const age = member.birthdate ? differenceInYears(new Date(), parseISO(member.birthdate)) : null
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3 group">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white", COLORS[member.avatarColor] ?? "bg-neutral-400")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#2C2416]">{member.name}</p>
            <span className="text-xs capitalize text-[#8B7355] bg-[#FAF4EC] border border-[#E8DDD0] px-2 py-0.5 rounded-full">{member.role}</span>
          </div>
          {age !== null && <p className="text-xs text-[#8B7355]">Age {age}{member.birthdate ? ` · Born ${member.birthdate}` : ""}</p>}
          {member.school && <p className="text-xs text-[#8B7355]">{member.grade ? `${member.grade} · ` : ""}{member.school}</p>}
          {member.phone && <p className="text-xs text-[#8B7355]">📞 {member.phone}</p>}
          {member.notes && <p className="text-xs text-[#8B7355] mt-1 italic">{member.notes}</p>}
        </div>
        <button onClick={onEdit} className="text-neutral-300 hover:text-[#C8553D] transition-colors opacity-0 group-hover:opacity-100"><Pencil className="h-4 w-4" /></button>
        <button onClick={onDelete} className="text-neutral-300 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
      </CardContent>
    </Card>
  )
}

function AddMemberDialog({ onAdd }: { onAdd: (m: FamilyMember) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", role: "adult", birthdate: "", school: "", grade: "", phone: "", email: "", avatarColor: "terracotta", notes: "" })
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const member = await res.json()
    onAdd(member)
    setForm({ name: "", role: "adult", birthdate: "", school: "", grade: "", phone: "", email: "", avatarColor: "terracotta", notes: "" })
    setLoading(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#C8553D] hover:bg-[#A8442F]"><Plus className="h-4 w-4" /> Add Person</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={e => set("name")(e.target.value)} /></div>
            <div className="space-y-1"><Label>Role</Label>
              <Select value={form.role} onValueChange={set("role")}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="adult">Adult</SelectItem><SelectItem value="kid">Kid</SelectItem><SelectItem value="pet">Pet</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Birthdate</Label><Input type="date" value={form.birthdate} onChange={e => set("birthdate")(e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone")(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>School</Label><Input value={form.school} onChange={e => set("school")(e.target.value)} /></div>
            <div className="space-y-1"><Label>Grade</Label><Input value={form.grade} onChange={e => set("grade")(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Allergies, meds, bedtime..." /></div>
          <div className="space-y-1"><Label>Color</Label>
            <div className="flex gap-2">
              {Object.entries(COLORS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set("avatarColor")(k)}
                  className={cn("w-7 h-7 rounded-full transition-transform", v, form.avatarColor === k ? "ring-2 ring-offset-2 ring-neutral-800 scale-110" : "")} />
              ))}
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#C8553D] hover:bg-[#A8442F]">{loading ? "Adding..." : "Add Member"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const adults = members.filter(m => m.role === "adult")
  const kids = members.filter(m => m.role === "kid")
  const pets = members.filter(m => m.role === "pet")

  useEffect(() => { fetch("/api/family").then(r => r.json()).then(setMembers) }, [])

  async function deleteMember(id: number) {
    await fetch(`/api/family/${id}`, { method: "DELETE" })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  function startEdit(member: FamilyMember) {
    setEditingMember(member)
    setEditOpen(true)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember) return
    const res = await fetch(`/api/family/${editingMember.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingMember) })
    const updated = await res.json()
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
    setEditOpen(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Family Members</h2>
          <p className="text-[#8B7355] mt-1">Everyone in the household.</p></div>
        <AddMemberDialog onAdd={m => setMembers(prev => [...prev, m])} />
      </div>

      {editingMember && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit {editingMember.name}</DialogTitle></DialogHeader>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Name</Label><Input required value={editingMember.name} onChange={e => setEditingMember(m => m ? { ...m, name: e.target.value } : m)} /></div>
                <div className="space-y-1"><Label>Role</Label>
                  <Select value={editingMember.role ?? "adult"} onValueChange={v => setEditingMember(m => m ? { ...m, role: v } : m)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="adult">Adult</SelectItem><SelectItem value="kid">Kid</SelectItem><SelectItem value="pet">Pet</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Birthdate</Label><Input type="date" value={editingMember.birthdate ?? ""} onChange={e => setEditingMember(m => m ? { ...m, birthdate: e.target.value } : m)} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input value={editingMember.phone ?? ""} onChange={e => setEditingMember(m => m ? { ...m, phone: e.target.value } : m)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>School</Label><Input value={editingMember.school ?? ""} onChange={e => setEditingMember(m => m ? { ...m, school: e.target.value } : m)} /></div>
                <div className="space-y-1"><Label>Grade</Label><Input value={editingMember.grade ?? ""} onChange={e => setEditingMember(m => m ? { ...m, grade: e.target.value } : m)} /></div>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Input value={editingMember.notes ?? ""} onChange={e => setEditingMember(m => m ? { ...m, notes: e.target.value } : m)} placeholder="Allergies, meds, bedtime..." /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-[#C8553D] hover:bg-[#A8442F]">Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {[{ label: "Adults", items: adults }, { label: "Kids", items: kids }, { label: "Pets", items: pets }].map(({ label, items }) =>
        items.length > 0 && (
          <div key={label}>
            <h3 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">{label}</h3>
            <div className="space-y-2">{items.map(m => <MemberCard key={m.id} member={m} onDelete={() => deleteMember(m.id)} onEdit={() => startEdit(m)} />)}</div>
          </div>
        )
      )}
      {members.length === 0 && <p className="text-[#8B7355] text-sm text-center py-8">No family members yet — add your household above.</p>}
    </div>
  )
}
