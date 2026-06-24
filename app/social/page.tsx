"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Gift, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { SocialEvent } from "@/lib/db/schema"
import { differenceInDays, parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"

const GIFT_COLORS: Record<string, string> = { none: "text-[#C8553D]", needed: "text-[#D4A574]", bought: "text-[#87A96B]", sent: "text-[#87A96B]" }
const RSVP_COLORS: Record<string, string> = { pending: "bg-[#D4A574] text-white", yes: "bg-[#87A96B] text-white", no: "bg-neutral-400 text-white" }

export default function SocialPage() {
  const [events, setEvents] = useState<SocialEvent[]>([])
  const [form, setForm] = useState({ personName: "", eventType: "birthday", eventDate: "", giftStatus: "none", rsvpStatus: "pending", rsvpDeadline: "", notes: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => { fetch("/api/social").then(r => r.json()).then(setEvents) }, [])

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const event = await res.json()
    setEvents(prev => [...prev, event].sort((a, b) => a.eventDate.localeCompare(b.eventDate)))
    setForm({ personName: "", eventType: "birthday", eventDate: "", giftStatus: "none", rsvpStatus: "pending", rsvpDeadline: "", notes: "" })
    setOpen(false)
  }

  async function updateGift(event: SocialEvent, giftStatus: string) {
    const res = await fetch(`/api/social/${event.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftStatus }) })
    const updated = await res.json()
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function updateRsvp(event: SocialEvent, rsvpStatus: string) {
    const res = await fetch(`/api/social/${event.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rsvpStatus }) })
    const updated = await res.json()
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/social/${id}`, { method: "DELETE" })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const upcoming = events.filter(e => differenceInDays(parseISO(e.eventDate), new Date()) >= -1)
  const past = events.filter(e => differenceInDays(parseISO(e.eventDate), new Date()) < -1)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Social & Birthdays</h2>
          <p className="text-[#8B7355] mt-1">Birthdays, RSVPs, visits, anniversaries.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-[#C8553D] hover:bg-[#A8442F]"><Plus className="h-4 w-4" /> Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Social Event</DialogTitle></DialogHeader>
            <form onSubmit={addEvent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Person / Event</Label><Input required placeholder="Grandma's 70th" value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Type</Label>
                  <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="birthday">Birthday</SelectItem><SelectItem value="anniversary">Anniversary</SelectItem><SelectItem value="rsvp">RSVP/Party</SelectItem><SelectItem value="visit">Visit</SelectItem><SelectItem value="holiday">Holiday</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date</Label><Input type="date" required value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label>RSVP Deadline</Label><Input type="date" value={form.rsvpDeadline} onChange={e => setForm(f => ({ ...f, rsvpDeadline: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Gift Status</Label>
                  <Select value={form.giftStatus} onValueChange={v => setForm(f => ({ ...f, giftStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Not needed</SelectItem><SelectItem value="needed">Needed</SelectItem><SelectItem value="bought">Bought</SelectItem><SelectItem value="sent">Sent</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>RSVP Status</Label>
                  <Select value={form.rsvpStatus} onValueChange={v => setForm(f => ({ ...f, rsvpStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Input placeholder="Gift ideas, location..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button type="submit" className="w-full bg-[#C8553D] hover:bg-[#A8442F]">Add Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length === 0 && <p className="text-sm text-[#8B7355] italic text-center py-8">No upcoming events.</p>}

      <div className="space-y-3">
        {upcoming.map(event => {
          const d = differenceInDays(parseISO(event.eventDate), new Date())
          return (
            <Card key={event.id} className={cn(d <= 7 && "border-[#C8553D]")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#2C2416]">{event.personName}</p>
                      <span className="text-xs capitalize text-[#8B7355]">{event.eventType}</span>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                        d <= 0 ? "bg-[#C8553D] text-white" : d <= 3 ? "bg-[#D4A574] text-white" : "bg-[#EBF2E5] text-[#87A96B]"
                      )}>{d <= 0 ? "Today!" : `${d}d`}</span>
                    </div>
                    <p className="text-xs text-[#8B7355] mt-0.5">{format(parseISO(event.eventDate), "EEEE, MMMM d, yyyy")}</p>
                    {event.notes && <p className="text-xs text-[#8B7355] italic mt-1">{event.notes}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {event.eventType === "birthday" || event.giftStatus !== "none" ? (
                        <div className="flex items-center gap-1">
                          <Gift className={cn("h-3.5 w-3.5", GIFT_COLORS[event.giftStatus ?? "none"])} />
                          <Select value={event.giftStatus ?? "none"} onValueChange={v => updateGift(event, v)}>
                            <SelectTrigger className="h-6 text-xs border-0 p-0 w-24 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent><SelectItem value="none">No gift</SelectItem><SelectItem value="needed">Gift needed</SelectItem><SelectItem value="bought">Bought</SelectItem><SelectItem value="sent">Sent</SelectItem></SelectContent>
                          </Select>
                        </div>
                      ) : null}
                      {(event.eventType === "rsvp" || event.rsvpStatus !== "pending") && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#8B7355]" />
                          <Select value={event.rsvpStatus ?? "pending"} onValueChange={v => updateRsvp(event, v)}>
                            <SelectTrigger className="h-6 text-xs border-0 p-0 w-20 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent><SelectItem value="pending">RSVP pending</SelectItem><SelectItem value="yes">Going</SelectItem><SelectItem value="no">Not going</SelectItem></SelectContent>
                          </Select>
                        </div>
                      )}
                      {event.rsvpDeadline && event.rsvpStatus === "pending" && (
                        <span className="text-xs text-[#D4A574]">RSVP by {format(parseISO(event.rsvpDeadline), "MMM d")}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteEvent(event.id)} className="text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
