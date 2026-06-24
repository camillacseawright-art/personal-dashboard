"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn, todayISO, formatDate } from "@/lib/utils"
import { format, parseISO, addDays, subDays } from "date-fns"
import type { Note } from "@/lib/db/schema"

export function NoteEditor({ showHistory = true }: { showHistory?: boolean }) {
  const [currentDate, setCurrentDate] = useState(todayISO())
  const [content, setContent] = useState("")
  const [savedContent, setSavedContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (showHistory) {
      fetch("/api/notes").then(r => r.json()).then(setAllNotes)
    }
  }, [showHistory])

  useEffect(() => {
    fetch(`/api/notes/${currentDate}`)
      .then(r => r.json())
      .then(note => {
        const c = note?.content ?? ""
        setContent(c)
        setSavedContent(c)
      })
  }, [currentDate])

  const save = useCallback(async (text: string) => {
    setSaving(true)
    await fetch(`/api/notes/${currentDate}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    })
    setSavedContent(text)
    setSaving(false)
    if (showHistory) {
      setAllNotes(prev => {
        const exists = prev.find(n => n.noteDate === currentDate)
        if (exists) return prev.map(n => n.noteDate === currentDate ? { ...n, content: text } : n)
        return [{ id: Date.now(), noteDate: currentDate, content: text, createdAt: new Date(), updatedAt: new Date() } as Note, ...prev]
      })
    }
  }, [currentDate, showHistory])

  function handleChange(text: string) {
    setContent(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(text), 1500)
  }

  async function deleteNote() {
    await fetch(`/api/notes/${currentDate}`, { method: "DELETE" })
    setContent("")
    setSavedContent("")
    setAllNotes(prev => prev.filter(n => n.noteDate !== currentDate))
  }

  const isDirty = content !== savedContent

  return (
    <div className="flex gap-4 h-full">
      {showHistory && (
        <div className="w-44 flex-shrink-0 space-y-1 overflow-y-auto max-h-96">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-2 pb-1">History</p>
          {allNotes.length === 0 ? (
            <p className="text-xs text-neutral-400 px-2">No previous notes</p>
          ) : (
            allNotes.map(note => (
              <button
                key={note.noteDate}
                onClick={() => setCurrentDate(note.noteDate)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors",
                  note.noteDate === currentDate ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <p className="font-medium">{formatDate(note.noteDate)}</p>
                <p className="truncate opacity-60">{note.content.slice(0, 40) || "Empty"}</p>
              </button>
            ))
          )}
        </div>
      )}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(format(subDays(parseISO(currentDate), 1), "yyyy-MM-dd"))}
              className="p-1 rounded hover:bg-neutral-100 text-neutral-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-20 text-center">{formatDate(currentDate)}</span>
            <button
              onClick={() => setCurrentDate(format(addDays(parseISO(currentDate), 1), "yyyy-MM-dd"))}
              disabled={currentDate >= todayISO()}
              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button size="sm" variant="outline" onClick={() => save(content)}>
                <Save className="h-3 w-3" /> Save
              </Button>
            )}
            {savedContent && (
              <button onClick={deleteNote} className="text-neutral-300 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <span className="text-xs text-neutral-400">{saving ? "Saving..." : isDirty ? "Unsaved" : "Saved"}</span>
          </div>
        </div>
        <Textarea
          placeholder={`What's on your mind for ${formatDate(currentDate)}?`}
          value={content}
          onChange={e => handleChange(e.target.value)}
          className="min-h-[300px] resize-none text-sm leading-relaxed"
        />
        <p className="text-xs text-neutral-400 text-right">{content.length} chars · {content.split(/\s+/).filter(Boolean).length} words</p>
      </div>
    </div>
  )
}
