"use client"
import { useState, useEffect } from "react"
import { Plus, Trash2, Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Meal, GroceryItem } from "@/lib/db/schema"
import { format, startOfWeek, addDays, parseISO } from "date-fns"
import { todayISO, cn } from "@/lib/utils"

const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d") }
})

const GROCERY_CATEGORIES = ["produce", "protein", "dairy", "pantry", "frozen", "beverages", "household", "other"]

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [grocery, setGrocery] = useState<GroceryItem[]>([])
  const [mealForm, setMealForm] = useState({ mealDate: todayISO(), mealType: "dinner", mealName: "", prepNotes: "" })
  const [groceryForm, setGroceryForm] = useState({ name: "", quantity: "", store: "", category: "produce" })
  const [mealOpen, setMealOpen] = useState(false)
  const [groceryOpen, setGroceryOpen] = useState(false)

  useEffect(() => {
    fetch("/api/meals").then(r => r.json()).then(setMeals)
    fetch("/api/grocery").then(r => r.json()).then(setGrocery)
  }, [])

  async function addMeal(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mealForm) })
    const meal = await res.json()
    setMeals(prev => [...prev, meal])
    setMealForm({ mealDate: todayISO(), mealType: "dinner", mealName: "", prepNotes: "" })
    setMealOpen(false)
  }

  async function deleteMeal(id: number) {
    await fetch(`/api/meals/${id}`, { method: "DELETE" })
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  async function addGrocery(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/grocery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(groceryForm) })
    const item = await res.json()
    setGrocery(prev => [...prev, item])
    setGroceryForm({ name: "", quantity: "", store: "", category: "produce" })
    setGroceryOpen(false)
  }

  async function toggleBought(item: GroceryItem) {
    const res = await fetch(`/api/grocery/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isBought: !item.isBought }) })
    const updated = await res.json()
    setGrocery(prev => prev.map(g => g.id === updated.id ? updated : g))
  }

  async function deleteGrocery(id: number) {
    await fetch(`/api/grocery/${id}`, { method: "DELETE" })
    setGrocery(prev => prev.filter(g => g.id !== id))
  }

  async function clearBought() {
    await fetch("/api/grocery", { method: "DELETE" })
    setGrocery(prev => prev.filter(g => !g.isBought))
  }

  const byCategory = GROCERY_CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    acc[cat] = grocery.filter(g => g.category === cat)
    return acc
  }, {})
  const remaining = grocery.filter(g => !g.isBought).length

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-[#2C2416]">Meals & Grocery</h2>
          <p className="text-[#8B7355] mt-1">Plan the week, track what to buy.</p></div>
        <div className="flex gap-2">
          <Dialog open={mealOpen} onOpenChange={setMealOpen}>
            <DialogTrigger asChild><Button className="bg-[#87A96B] hover:bg-[#6E9056]"><Plus className="h-4 w-4" /> Add Meal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Meal</DialogTitle></DialogHeader>
              <form onSubmit={addMeal} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Date</Label><Input type="date" value={mealForm.mealDate} onChange={e => setMealForm(f => ({ ...f, mealDate: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Type</Label>
                    <Select value={mealForm.mealType} onValueChange={v => setMealForm(f => ({ ...f, mealType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="breakfast">Breakfast</SelectItem><SelectItem value="lunch">Lunch</SelectItem><SelectItem value="dinner">Dinner</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Meal Name</Label><Input required placeholder="e.g. Sheet pan chicken" value={mealForm.mealName} onChange={e => setMealForm(f => ({ ...f, mealName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Prep Notes (optional)</Label><Input placeholder="Marinate night before..." value={mealForm.prepNotes} onChange={e => setMealForm(f => ({ ...f, prepNotes: e.target.value }))} /></div>
                <Button type="submit" className="w-full bg-[#87A96B] hover:bg-[#6E9056]">Add Meal</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={groceryOpen} onOpenChange={setGroceryOpen}>
            <DialogTrigger asChild><Button className="bg-[#C8553D] hover:bg-[#A8442F]"><ShoppingCart className="h-4 w-4" /> Add Item</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Grocery Item</DialogTitle></DialogHeader>
              <form onSubmit={addGrocery} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Item</Label><Input required placeholder="e.g. Eggs" value={groceryForm.name} onChange={e => setGroceryForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Quantity</Label><Input placeholder="1 dozen" value={groceryForm.quantity} onChange={e => setGroceryForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Category</Label>
                    <Select value={groceryForm.category} onValueChange={v => setGroceryForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GROCERY_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Store (optional)</Label><Input placeholder="Whole Foods" value={groceryForm.store} onChange={e => setGroceryForm(f => ({ ...f, store: e.target.value }))} /></div>
                </div>
                <Button type="submit" className="w-full bg-[#C8553D] hover:bg-[#A8442F]">Add Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly meal plan */}
        <Card>
          <CardHeader><CardTitle className="text-[#87A96B] text-sm uppercase tracking-wide">This Week</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {WEEK_DAYS.map(({ date, label }) => {
              const dayMeals = meals.filter(m => m.mealDate === date)
              const isToday = date === todayISO()
              return (
                <div key={date} className={cn("rounded-lg p-2.5", isToday ? "bg-[#EBF2E5] border border-[#87A96B]" : "border border-[#E8DDD0]")}>
                  <p className={cn("text-xs font-semibold mb-1", isToday ? "text-[#87A96B]" : "text-[#8B7355]")}>{label}{isToday ? " · Today" : ""}</p>
                  {dayMeals.length > 0 ? dayMeals.map(m => (
                    <div key={m.id} className="flex items-center justify-between group">
                      <span className="text-sm text-[#2C2416]">{m.mealName}</span>
                      <button onClick={() => deleteMeal(m.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )) : <p className="text-xs text-[#8B7355] italic">Not planned</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Grocery list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#C8553D] text-sm uppercase tracking-wide">
                Grocery List <span className="text-[#8B7355] normal-case font-normal text-xs ml-1">{remaining} remaining</span>
              </CardTitle>
              {grocery.some(g => g.isBought) && (
                <button onClick={clearBought} className="text-xs text-[#8B7355] hover:text-[#C8553D]">Clear bought</button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {grocery.length === 0 ? (
              <p className="text-sm text-[#8B7355] italic">Your list is empty.</p>
            ) : (
              <div className="space-y-4">
                {GROCERY_CATEGORIES.filter(c => byCategory[c]?.length > 0).map(cat => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-[#8B7355] uppercase mb-1 capitalize">{cat}</p>
                    <div className="space-y-1">
                      {byCategory[cat].map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <button onClick={() => toggleBought(item)}
                            className={cn("w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                              item.isBought ? "bg-[#87A96B] border-[#87A96B]" : "border-neutral-300 hover:border-[#87A96B]")}>
                            {item.isBought && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <span className={cn("text-sm flex-1", item.isBought && "line-through text-[#8B7355]")}>{item.name}</span>
                          {item.quantity && <span className="text-xs text-[#8B7355]">{item.quantity}</span>}
                          <button onClick={() => deleteGrocery(item.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
