"use client"
import { useState, useEffect, useRef } from "react"
import { Send, Trash2, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user"

  // Render markdown-ish: bold, code blocks, line breaks
  function renderContent(text: string) {
    const lines = text.split("\n")
    return lines.map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      return (
        <p key={i} className={cn("text-sm leading-relaxed", line === "" && "my-1")}
          dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />
      )
    })
  }

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-[#C8553D]" : "bg-[#87A96B]"
      )}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser ? "bg-[#C8553D] text-white rounded-tr-sm" : "bg-white border border-[#E8DDD0] text-[#2C2416] rounded-tl-sm"
      )}>
        {renderContent(msg.content)}
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  "What do I need to know this week?",
  "Give me my Monday brief",
  "What upcoming birthdays do I have?",
  "Check for any overdue items",
  "Help me plan meals for the week",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [hasApiKey, setHasApiKey] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data)
        setFetching(false)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content,
      createdAt: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = await res.json()
      if (data.error) {
        if (data.error.includes("API") || data.error.includes("key")) setHasApiKey(false)
        const errMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", content: `Error: ${data.error}`, createdAt: new Date() }
        setMessages(prev => [...prev, errMsg])
      } else {
        const assistantMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", content: data.message, createdAt: new Date() }
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch (e) {
      const errMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", content: "Failed to connect to the AI. Check your ANTHROPIC_API_KEY.", createdAt: new Date() }
      setMessages(prev => [...prev, errMsg])
    }
    setLoading(false)
  }

  async function clearChat() {
    await fetch("/api/chat", { method: "DELETE" })
    setMessages([])
  }

  return (
    <div className="max-w-3xl h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#2C2416]">AI Family Assistant</h2>
          <p className="text-sm text-[#8B7355]">Ask anything about your family schedule, week ahead, or get a briefing.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-[#8B7355]">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!hasApiKey && (
        <div className="bg-[#F5E6E3] border border-[#C8553D] rounded-xl p-4 mb-4 text-sm text-[#C8553D] flex-shrink-0">
          <strong>ANTHROPIC_API_KEY missing.</strong> Add it to your <code>.env.local</code> file:
          <pre className="mt-2 bg-white rounded p-2 text-xs">ANTHROPIC_API_KEY=sk-ant-...</pre>
          Then restart the dev server.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {fetching ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B7355]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#87A96B] rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-[#2C2416]">Your family operations assistant is ready.</h3>
              <p className="text-sm text-[#8B7355] mt-1">Ask for your weekly brief, check on upcoming events, or let me help onboard your family info.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wide">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-sm bg-white border border-[#E8DDD0] text-[#2C2416] px-3 py-2 rounded-lg hover:bg-[#FAF4EC] hover:border-[#C8553D] transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#87A96B] flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-[#E8DDD0] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-[#87A96B] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-[#E8DDD0] mt-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask about your week, a trip, a deadline, paste an email..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={2}
            className="resize-none border-[#E8DDD0] focus-visible:ring-[#C8553D]"
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="bg-[#C8553D] hover:bg-[#A8442F] self-end px-3 h-[72px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-[#8B7355] mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
