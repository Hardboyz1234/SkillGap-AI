import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { sendChatMessage } from "../api/client";

export default function ChatWidget({ analysisId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I can explain your gaps, suggest next steps, and help you understand your learning plan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const { reply } = await sendChatMessage(text, analysisId);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I couldn't reach the server just now — try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-white glow-violet"
        style={{ background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" }}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 flex h-[26rem] w-80 flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" }}
          >
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">SkillGap.AI</p>
            <p className="text-xs text-ink-faint">Ask about your path &amp; learning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            ONLINE
          </span>
          <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-violet-500/20 text-ink"
                  : "border border-white/5 bg-white/[0.03] text-ink-muted"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-ink-faint">
              Thinking&hellip;
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/5 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about gaps, learning, or your plan"
          className="flex-1 rounded-lg border border-card-border bg-panel px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-violet-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
