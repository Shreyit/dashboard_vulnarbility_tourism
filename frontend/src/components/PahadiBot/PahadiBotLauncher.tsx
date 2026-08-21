import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useMagnetic } from "../Magnetic/useMagnetic";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { ref: launcherRef, innerRef: dotRef, press } = useMagnetic<HTMLButtonElement>({
    strength: 0.4,
    radius: 90,
    maxOffset: 16,
  });

  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [messages, sending, reduced]);

  // ---- the panel grows out of the launcher it is anchored to ----
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel || !open || reduced) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(panel, { autoAlpha: 0, y: 16, scaleY: 0.8, transformOrigin: "bottom right", duration: 0.35 })
        .from(panel.querySelectorAll("header > *"), { autoAlpha: 0, y: 8, duration: 0.25, stagger: 0.06 }, 0.1)
        .from(panel.querySelectorAll(".chat-msg"), { autoAlpha: 0, y: 10, duration: 0.3, stagger: 0.06 }, 0.15)
        .from(panel.querySelector(".chat-input-row"), { autoAlpha: 0, y: 10, duration: 0.3 }, 0.2);
    },
    { dependencies: [open, reduced], scope: panelRef },
  );

  // ---- each new message slides in on its own, without re-running the above ----
  const lastCountRef = useRef(messages.length);
  useGSAP(
    () => {
      const body = bodyRef.current;
      if (!body || reduced || messages.length <= lastCountRef.current) {
        lastCountRef.current = messages.length;
        return;
      }
      lastCountRef.current = messages.length;
      const last = body.querySelector<HTMLElement>(".chat-msg:last-of-type");
      if (!last) return;
      gsap.from(last, {
        autoAlpha: 0,
        y: 12,
        x: last.classList.contains("chat-msg-user") ? 12 : -12,
        duration: 0.35,
        ease: "power3.out",
      });
    },
    { dependencies: [messages.length, reduced], scope: bodyRef },
  );

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
        ref={launcherRef}
        className="pahadibot-launcher"
        onClick={() => {
          press();
          setOpen((v) => !v);
        }}
        data-cursor
        data-cursor-label={open ? "CLOSE" : "ASK"}
      >
        <span className="dot" ref={dotRef as React.RefObject<HTMLSpanElement>} />
        PahadiBot
      </button>

      {open && (
        <div className="pahadibot-panel" ref={panelRef}>
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
