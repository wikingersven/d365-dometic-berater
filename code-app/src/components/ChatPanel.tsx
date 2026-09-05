// Chat-Bereich (rechte Spalte): Leerzustand, Nachrichtenliste mit
// Markdown-Rendering, eingebettetes Karussell und Eingabezeile inkl. PDF-Button.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage, Lang } from "../models/types";
import { tr } from "../models/translations";
import { renderMarkdown } from "../utils/markdown";

interface Props {
  started: boolean;
  lang: Lang;
  messages: ChatMessage[];
  chatLoading: boolean;
  showInput: boolean;
  carousel?: ReactNode;
  onSend: (text: string) => void;
  onPdf: () => void;
}

export function ChatPanel({
  started,
  lang,
  messages,
  chatLoading,
  showInput,
  carousel,
  onSend,
  onPdf,
}: Props): ReactNode {
  const t = tr(lang);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    onSend(text);
  };

  if (!started) {
    return (
      <section className="dom-chat">
        <div className="dom-chat-empty">
          <div className="dom-chat-empty-icon">⚡</div>
          <h3>{t.chatEmptyTitle}</h3>
          <p>{t.chatEmptyText}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dom-chat">
      <div className="dom-chat-messages">
        {messages.map((m, i) =>
          m.type === "agent" ? (
            <div
              key={i}
              className="dom-msg dom-msg-agent"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
            />
          ) : (
            <div key={i} className={`dom-msg dom-msg-${m.type}`}>
              {m.text}
            </div>
          ),
        )}
        {chatLoading && (
          <div className="dom-msg-loading">
            <div className="dom-dot" />
            <div className="dom-dot" />
            <div className="dom-dot" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {carousel}

      {showInput && (
        <div className="dom-chat-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.inputPlaceholder}
            rows={2}
          />
          <button className="dom-btn-send" onClick={submit}>
            {t.btnSend}
          </button>
          <button className="dom-btn-pdf" title={t.btnPDF} onClick={onPdf}>
            📄 PDF
          </button>
        </div>
      )}
    </section>
  );
}
