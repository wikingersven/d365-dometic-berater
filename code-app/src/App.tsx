// App-Shell: D365-UCI-Layout (Topbar + Sitemap) mit dem Dometic-Berater im
// Inhaltsbereich. Verwaltet den gesamten Anwendungszustand.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Answers,
  BeraterData,
  ChatMessage,
  HistoryEntry,
} from "./models/types";
import {
  computeBatteryRange,
  computeInverter,
  getLanguageForCountry,
} from "./models/types";
import { brandShort, tr } from "./models/translations";
import { getService, istDemoModus } from "./services/serviceFactory";
import { sendChat } from "./services/chatApi";
import { buildContextMessage } from "./utils/context";
import { Sidebar } from "./components/Sidebar";
import { CountrySelector } from "./components/CountrySelector";
import { ConsumerChecklist } from "./components/ConsumerChecklist";
import { SummaryPanel } from "./components/SummaryPanel";
import { QuestionCarousel } from "./components/QuestionCarousel";
import { ChatPanel } from "./components/ChatPanel";
import { generatePdf } from "./components/PdfExport";

export default function App(): ReactNode {
  const svc = useMemo(() => getService(), []);
  const [data, setData] = useState<BeraterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("DE");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const lang = getLanguageForCountry(country);
  const t = tr(lang);

  useEffect(() => {
    let active = true;
    svc
      .getData()
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [svc]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const consumers = useMemo(() => data?.consumers ?? [], [data]);
  const categories = data?.categories ?? [];
  const countries = data?.countries ?? [];

  const selected = useMemo(
    () => consumers.filter((c) => selectedIds.includes(c.pb_dometicconsumerid)),
    [consumers, selectedIds],
  );

  const totalWh = selected.reduce((s, c) => s + c.pb_wh, 0);
  const peakW = selected.reduce((m, c) => Math.max(m, c.pb_peak || 0), 0);
  const batteryRange = computeBatteryRange(totalWh);
  const inverterRec = computeInverter(selected, t.notRequired);
  const catCounts: Record<string, number> = {};
  selected.forEach((c) => {
    catCounts[c.categoryLetter] = (catCounts[c.categoryLetter] || 0) + 1;
  });
  const currentCountry = countries.find((c) => c.pb_code === country);
  const brandName = brandShort(currentCountry?.pb_brand?.pb_key);

  const toggleConsumer = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleCat = (catId: string) =>
    setOpenCats((prev) =>
      prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId],
    );

  const navCat = (catId: string) => {
    setOpenCats((prev) => (prev.includes(catId) ? prev : [...prev, catId]));
    document
      .getElementById(`dom-cat-${catId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const send = useCallback(
    async (text: string, isInitial = false) => {
      if (!isInitial) setMessages((m) => [...m, { type: "user", text }]);
      const next: HistoryEntry[] = [...history, { role: "user", content: text }];
      setHistory(next);
      setChatLoading(true);
      try {
        const reply = (await sendChat(next, country)) || t.noReply;
        setMessages((m) => [...m, { type: "agent", text: reply }]);
        setHistory((h) => [...h, { role: "assistant", content: reply }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setMessages((m) => [...m, { type: "agent", text: t.connError(msg) }]);
      } finally {
        setChatLoading(false);
      }
    },
    [history, country, t],
  );

  const startConsultation = () => {
    if (selected.length === 0) return;
    setStarted(true);
    const wh = Math.round(selected.reduce((s, c) => s + c.pb_wh, 0));
    setMessages([
      { type: "system", text: t.consumersSelected(selected.length, wh) },
    ]);
  };

  const submitAnswers = () => {
    setSubmitted(true);
    void send(buildContextMessage(selected, categories, answers, lang), true);
  };

  return (
    <div className="d365-app">
      <header className="d365-topbar">
        <span className="d365-topbar-brand">
          Dynamics 365 · Dometic Bordelektrik-Berater
        </span>
        <span className="d365-topbar-env">
          {istDemoModus() ? "Demo" : "Dataverse"}
        </span>
      </header>

      <div className="d365-body">
        <Sidebar
          categories={categories}
          catCounts={catCounts}
          lang={lang}
          onNavCategory={navCat}
        />

        <main className="d365-content">
          {error && (
            <div className="dom-error">
              <span>{error}</span>
              <button onClick={() => setError("")}>✕</button>
            </div>
          )}

          {loading ? (
            <div className="dom-loading">…</div>
          ) : (
            <>
              <div className="dom-main">
                <aside className="dom-sidebar">
                  <div className="dom-sidebar-header">
                    <h2>{t.sidebarTitle}</h2>
                    <p className="dom-sidebar-subtitle">{t.sidebarSubtitle}</p>
                    <p className="dom-sidebar-hint">{t.sidebarHint}</p>
                  </div>
                  <CountrySelector
                    countries={countries}
                    selected={country}
                    lang={lang}
                    onChange={setCountry}
                  />
                  <ConsumerChecklist
                    categories={categories}
                    consumers={consumers}
                    selectedIds={selectedIds}
                    openCats={openCats}
                    lang={lang}
                    onToggle={toggleConsumer}
                    onToggleCat={toggleCat}
                  />
                  <SummaryPanel
                    brandName={brandName}
                    totalWh={totalWh}
                    peakW={peakW}
                    count={selected.length}
                    batteryRange={batteryRange}
                    inverterRec={inverterRec}
                    lang={lang}
                    started={started}
                    onStart={startConsultation}
                  />
                </aside>

                <ChatPanel
                  started={started}
                  lang={lang}
                  messages={messages}
                  chatLoading={chatLoading}
                  showInput={submitted}
                  onSend={(txt) => void send(txt)}
                  onPdf={() =>
                    generatePdf({ selected, categories, answers, history })
                  }
                  carousel={
                    started && !submitted ? (
                      <QuestionCarousel
                        answers={answers}
                        lang={lang}
                        onAnswersChange={setAnswers}
                        onSubmit={submitAnswers}
                      />
                    ) : null
                  }
                />
              </div>

              <footer className="dom-footer">
                <p>{t.sidebarHint}</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
