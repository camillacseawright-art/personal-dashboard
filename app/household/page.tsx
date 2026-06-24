"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Check, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Bill } from "@/lib/db/schema"
import { differenceInDays, parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"

function urgencyClass(days: number) {
  if (days < 0) return "bg-[#C8553D] text-white"
  if (days <= 3) return "bg-[#C8553D] text-white"
  if (days <= 7) return "bg-[#D4A574] text-white"
  return "bg-[#EBF2E5] text-[#87A96B]"
}

export default function HouseholdPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [form, setForm] = useState({ name: "", amount: "", dueDate: "", isAutopay: false, frequency: "monthly", category: "utilities", notes: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => { fetch("/api/bills").then(r => r.json()).then(setBills) }, [])

  async function addBill(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const bill = await res.json()
    setBills(prev => [...prev, bill].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")))
    setForm({ name: "", amount: "", dueDate: "", isAutopay: false, frequency: "monthly", category: "utilities", notes: "" })
    setOpen(false)
  }

  async function togglePaid(bill: Bill) {
    const res = await fetch(`/api/bills/${bill.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPaid: !bill.isPaid }) })
    const updated = await res.json()
    setBills(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  async function deleteBill(id: number) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" })
    setBills(prev => prev.filter(b => b.id !== id))
  }

  const upcoming = bills.filter(b => !b.isPaid && b.dueDate && differenceInDays(parseISO(b.dueDate), new Date()) <= 14)
  const paid = bills.filter(b => b.isPaid)
  const totalDue = upcoming.reduce((s, b) => s + (b.amount ? parseFloat(b.amount) : 0), 0)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Household</h2>
          <p className="text-[#8B7355] mt-1">Bills, subscriptions, home services.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-[#C8553D] hover:bg-[#A8442F]"><Plus className="h-4 w-4" /> Add Bill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bill / Subscription</DialogTitle></DialogHeader>
            <form onSubmit={addBill} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Name</Label><Input required placeholder="Electric bill" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" placeholder="150" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="one-time">One-time</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["utilities","mortgage/rent","insurance","subscription","internet","phone","grocery","childcare","medical","other"].map(c => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex items-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                    <input type="checkbox" checked={form.isAutopay} onChange={e => setForm(f => ({ ...f, isAutopay: e.target.checked }))} className="accent-[#87A96B]" />
                    Autopay
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#C8553D] hover:bg-[#A8442F]">Add Bill</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-[#F5E6E3] border border-[#C8553D] rounded-xl p-4">
          <p className="text-sm font-semibold text-[#C8553D] mb-1">Due in next 14 days</p>
          <p className="text-2xl font-bold text-[#2C2416]">${totalDue.toFixed(2)} total</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm text-[#C8553D] uppercase tracking-wide">Upcoming Bills</CardTitle></CardHeader>
        <CardContent>
          {bills.filter(b => !b.isPaid).length === 0
            ? <p className="text-sm text-[#8B7355] italic">No outstanding bills.</p>
            : <div className="space-y-2">
                {bills.filter(b => !b.isPaid).map(bill => {
                  const d = bill.dueDate ? differenceInDays(parseISO(bill.dueDate), new Date()) : null
                  return (
                    <div key={bill.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDD0] group">
                      <button onClick={() => togglePaid(bill)} className="w-5 h-5 rounded border border-neutral-300 hover:border-[#87A96B] flex items-center justify-center flex-shrink-0">
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#2C2416]">{bill.name}</p>
                          {bill.isAutopay && <span className="text-xs flex items-center gap-0.5 text-[#87A96B]"><Zap className="h-2.5 w-2.5" />auto</span>}
                          <span className="text-xs text-[#8B7355] capitalize">{bill.frequency}</span>
                        </div>
                        {bill.dueDate && <p className="text-xs text-[#8B7355]">Due {format(parseISO(bill.dueDate), "MMM d, yyyy")}</p>}
                      </div>
                      {bill.amount && <span className="text-sm font-semibold text-[#2C2416]">${bill.amount}</span>}
                      {d !== null && <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", urgencyClass(d))}>{d < 0 ? "Overdue" : d === 0 ? "Today" : `${d}d`}</span>}
                      <button onClick={() => deleteBill(bill.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>}
        </CardContent>
      </Card>

      {paid.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-[#87A96B] uppercase tracking-wide">Paid ✓</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {paid.map(bill => (
                <div key={bill.id} className="flex items-center gap-2 text-sm opacity-60">
                  <Check className="h-3.5 w-3.5 text-[#87A96B]" />
                  <span className="flex-1 line-through text-[#8B7355]">{bill.name}</span>
                  {bill.amount && <span>${bill.amount}</span>}
                  <button onClick={() => deleteBill(bill.id)} className="text-neutral-300 hover:text-red-400 ml-2"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
