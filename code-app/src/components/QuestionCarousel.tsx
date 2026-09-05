// Fragenkarussell (6 Fragen). Verwaltet Slide-Index lokal; die Antworten
// liegen im App-State. Portiert aus buildCarousel/updateCarouselState.

import { useState, type ReactNode } from "react";
import type { AnswerState, Answers, Lang } from "../models/types";
import {
  QUESTIONS,
  qCustomPlaceholder,
  qHint,
  qOptions,
  qPlaceholder,
  qTitle,
  tr,
} from "../models/translations";

interface Props {
  answers: Answers;
  lang: Lang;
  onAnswersChange: (answers: Answers) => void;
  onSubmit: () => void;
}

export function QuestionCarousel({
  answers,
  lang,
  onAnswersChange,
  onSubmit,
}: Props): ReactNode {
  const t = tr(lang);
  const [index, setIndex] = useState(0);
  const n = QUESTIONS.length;

  const setAnswer = (qid: string, next: AnswerState | null) => {
    const copy: Answers = { ...answers };
    if (next === null) delete copy[qid];
    else copy[qid] = next;
    onAnswersChange(copy);
  };

  const pickSingle = (qid: string, value: string) =>
    setAnswer(qid, { value, status: "answered" });

  const pickMulti = (qid: string, value: string) => {
    const prev = answers[qid];
    const arr = Array.isArray(prev?.value) ? [...prev.value] : [];
    const i = arr.indexOf(value);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(value);
    if (arr.length === 0) setAnswer(qid, null);
    else setAnswer(qid, { value: arr, status: "answered" });
  };

  const setCustom = (qid: string, custom: string) => {
    const prev = answers[qid];
    setAnswer(qid, {
      value: prev?.value ?? "",
      status: "answered",
      customValue: custom,
    });
  };

  const setText = (qid: string, value: string) => {
    const v = value.trim();
    if (v) setAnswer(qid, { value: v, status: "answered" });
    else setAnswer(qid, null);
  };

  const skip = (qid: string) => {
    setAnswer(qid, { value: null, status: "skipped" });
    if (index < n - 1) setIndex(index + 1);
  };

  const allDone = QUESTIONS.every((q) => answers[q.id]);

  return (
    <div className="dom-carousel">
      <div className="dom-carousel-header">
        <span className="dom-carousel-progress">
          {t.carouselProgress(index + 1, n)}
        </span>
        <span className="dom-carousel-hint">{t.carouselHint}</span>
      </div>

      <div className="dom-carousel-track">
        {QUESTIONS.map((q, i) => {
          const a = answers[q.id];
          const cls =
            i === index ? "active" : i < index ? "left" : "";
          return (
            <div key={q.id} className={`dom-carousel-card ${cls}`}>
              <h4>
                {qTitle(q, lang)}
                {a && (
                  <span className={`dom-carousel-status ${a.status}`}>
                    {a.status === "answered" ? t.answered : t.skipped}
                  </span>
                )}
              </h4>
              <p>{qHint(q, lang)}</p>

              {q.type === "choice" ? (
                <>
                  <div className="dom-carousel-options">
                    {qOptions(q, lang).map((opt) => {
                      const sel =
                        a?.value === opt ||
                        (Array.isArray(a?.value) && a.value.includes(opt));
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`dom-carousel-option${sel ? " selected" : ""}`}
                          onClick={() =>
                            q.multi ? pickMulti(q.id, opt) : pickSingle(q.id, opt)
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {q.allowCustom && (
                    <input
                      className="dom-carousel-input"
                      placeholder={qCustomPlaceholder(q, lang)}
                      value={a?.customValue ?? ""}
                      onChange={(e) => setCustom(q.id, e.target.value)}
                    />
                  )}
                </>
              ) : (
                <input
                  className="dom-carousel-input"
                  placeholder={qPlaceholder(q, lang)}
                  value={typeof a?.value === "string" ? a.value : ""}
                  onChange={(e) => setText(q.id, e.target.value)}
                />
              )}

              <button
                type="button"
                className="dom-carousel-skip"
                onClick={() => skip(q.id)}
              >
                {t.skip}
              </button>
            </div>
          );
        })}
      </div>

      <div className="dom-carousel-nav">
        <button
          type="button"
          className="dom-carousel-arrow"
          disabled={index === 0}
          onClick={() => setIndex(Math.max(0, index - 1))}
        >
          {t.carouselPrev}
        </button>
        <div className="dom-carousel-dots">
          {QUESTIONS.map((q, i) => {
            const a = answers[q.id];
            let dc = "dom-carousel-dot";
            if (i === index) dc += " active";
            if (a?.status === "answered") dc += " answered";
            if (a?.status === "skipped") dc += " skipped-dot";
            return (
              <button
                key={q.id}
                type="button"
                className={dc}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}`}
              />
            );
          })}
        </div>
        <button
          type="button"
          className="dom-carousel-arrow"
          onClick={() => setIndex(Math.min(n - 1, index + 1))}
        >
          {index === n - 1 && allDone ? t.carouselDone : t.carouselNext}
        </button>
      </div>

      {allDone && (
        <button type="button" className="dom-btn-submit-all" onClick={onSubmit}>
          {t.btnSubmit}
        </button>
      )}
    </div>
  );
}
