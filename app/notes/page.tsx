import { NoteEditor } from "@/components/notes/note-editor"

export default function NotesPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notes</h2>
        <p className="text-neutral-500 mt-1">Daily journal. Auto-saves as you type.</p>
      </div>
      <NoteEditor showHistory={true} />
    </div>
  )
}
