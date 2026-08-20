import { useEffect, useRef, useState } from "react";
import { postChat } from "../../api/client";
import Loading from "../Loading";
import "./PahadiBot.css";

type Message = { role: "user" | "bot"; text: string };

const GREETING: Message = {
  role: "bot",
  text: "Namaste! I'm PahadiBot. Ask me about the dashboard's own numbers -- the Tourism Vulnerability Index, a sub-index, or a zone's score.",
};

/**
 * PahadiBot's chat panel (workflow.md #8). Calls POST /api/chat, which grounds
 * every reply in the dashboard's own computed indices. Until GROQ_API_KEY is set
 * on the backend, the route still replies -- honestly, not with a fabricated answer.
 */
export default function PahadiBotLauncher() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await postChat(text);
      setLlmConfigured(res.llm_configured);
      setMessages((m) => [...m, { role: "bot", text: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: `Couldn't reach the backend: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="pahadibot-launcher"
        onClick={() => setOpen((v) => !v)}
        data-cursor
        data-cursor-label={open ? "CLOSE" : "ASK"}
      >
        <span className="dot" />
        PahadiBot
      </button>

      {open && (
        <div className="pahadibot-panel">
          <header>
            <h4>PahadiBot</h4>
            <button type="button" onClick={() => setOpen(false)} data-cursor>
              close
            </button>
          </header>

          <div className="body chat-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="chat-msg chat-msg-bot">
                <Loading label="THINKING" />
              </div>
            )}
          </div>

          {llmConfigured === false && (
            <div className="status-row" style={{ padding: "0 var(--sp-4) var(--sp-3)" }}>
              <span className="eyebrow">status</span>
              <span className="eyebrow" style={{ color: "var(--rust)" }}>
                no LLM key set -- showing raw grounding context
              </span>
            </div>
          )}

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the TVI, a pillar, a zone..."
              aria-label="Message PahadiBot"
            />
            <button type="submit" data-cursor data-cursor-label="SEND" disabled={sending || !input.trim()}>
              send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
