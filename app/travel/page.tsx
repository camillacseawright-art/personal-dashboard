"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Plane, Briefcase, Users, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { TravelPlan } from "@/lib/db/schema"
import { differenceInDays, parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"

export default function TravelPage() {
  const [trips, setTrips] = useState<TravelPlan[]>([])
  const [form, setForm] = useState({ travelerName: "", destination: "", departDate: "", returnDate: "", tripType: "personal", notes: "" })
  const [open, setOpen] = useState(false)

  useEffect(() => { fetch("/api/travel").then(r => r.json()).then(setTrips) }, [])

  async function addTrip(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/travel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const trip = await res.json()
    setTrips(prev => [...prev, trip].sort((a, b) => a.departDate.localeCompare(b.departDate)))
    setForm({ travelerName: "", destination: "", departDate: "", returnDate: "", tripType: "personal", notes: "" })
    setOpen(false)
  }

  async function togglePacking(trip: TravelPlan) {
    const res = await fetch(`/api/travel/${trip.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packingDone: !trip.packingDone }) })
    const updated = await res.json()
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  async function deleteTrip(id: number) {
    await fetch(`/api/travel/${id}`, { method: "DELETE" })
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  const upcoming = trips.filter(t => differenceInDays(parseISO(t.departDate), new Date()) >= 0)
  const past = trips.filter(t => differenceInDays(parseISO(t.departDate), new Date()) < 0)

  // Flag overlap days where both adults might be traveling
  const tripIcon = (type: string) => type === "work" ? Briefcase : type === "family" ? Users : Plane

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Travel</h2>
          <p className="text-[#8B7355] mt-1">Family trips, work travel, solo parenting days.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-[#C8553D] hover:bg-[#A8442F]"><Plus className="h-4 w-4" /> Add Trip</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Travel</DialogTitle></DialogHeader>
            <form onSubmit={addTrip} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Traveler</Label><Input required placeholder="Mom / Dad / Family" value={form.travelerName} onChange={e => setForm(f => ({ ...f, travelerName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Destination</Label><Input required placeholder="New York" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Depart</Label><Input type="date" required value={form.departDate} onChange={e => setForm(f => ({ ...f, departDate: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Return</Label><Input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Type</Label>
                <Select value={form.tripType} onValueChange={v => setForm(f => ({ ...f, tripType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="personal">Personal</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="family">Family</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Input placeholder="Flights, hotels, packing notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button type="submit" className="w-full bg-[#C8553D] hover:bg-[#A8442F]">Add Trip</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length === 0 && <p className="text-sm text-[#8B7355] italic text-center py-8">No upcoming travel planned.</p>}

      <div className="space-y-3">
        {upcoming.map(trip => {
          const daysUntil = differenceInDays(parseISO(trip.departDate), new Date())
          const TripIcon = tripIcon(trip.tripType ?? "personal")
          const isUrgent = daysUntil <= 7
          return (
            <Card key={trip.id} className={cn(isUrgent && "border-[#C8553D]")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", trip.tripType === "work" ? "bg-[#EBF2E5]" : "bg-[#F5E6E3]")}>
                    <TripIcon className={cn("h-5 w-5", trip.tripType === "work" ? "text-[#87A96B]" : "text-[#C8553D]")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#2C2416]">{trip.travelerName} → {trip.destination}</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                        trip.tripType === "work" ? "bg-[#EBF2E5] text-[#87A96B]" : trip.tripType === "family" ? "bg-[#F5E6E3] text-[#C8553D]" : "bg-neutral-100 text-neutral-600"
                      )}>{trip.tripType}</span>
                    </div>
                    <p className="text-sm text-[#8B7355] mt-0.5">
                      {format(parseISO(trip.departDate), "MMM d")}
                      {trip.returnDate ? ` – ${format(parseISO(trip.returnDate), "MMM d, yyyy")}` : ""}
                      {" · "}
                      <span className={cn("font-medium", isUrgent ? "text-[#C8553D]" : "text-[#8B7355]")}>
                        {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow!" : `${daysUntil} days away`}
                      </span>
                    </p>
                    {trip.notes && <p className="text-xs text-[#8B7355] mt-1 italic">{trip.notes}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => togglePacking(trip)} className="flex items-center gap-1.5 text-xs text-[#8B7355] hover:text-[#2C2416] transition-colors">
                        {trip.packingDone
                          ? <CheckCircle2 className="h-4 w-4 text-[#87A96B]" />
                          : <Circle className="h-4 w-4" />}
                        Packing {trip.packingDone ? "done" : "needed"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => deleteTrip(trip.id)} className="text-neutral-300 hover:text-red-400 transition-colors">
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
