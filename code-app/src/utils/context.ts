// Baut die Kontext-Nachricht, die beim Absenden des Fragenkarussells an den
// Agenten geht (Verbraucher nach Kategorie + Zusammenfassung + Profil).
// Portiert aus btnSubmitAnswers im Original-Frontend.

import type {
  Answers,
  DometicCategory,
  DometicConsumer,
  Lang,
} from "../models/types";
import { computeBatteryRange, computeInverter } from "../models/types";
import {
  catName,
  consumerName,
  QUESTIONS,
  qTitle,
  tr,
} from "../models/translations";

export function buildContextMessage(
  selected: DometicConsumer[],
  categories: DometicCategory[],
  answers: Answers,
  lang: Lang,
): string {
  const t = tr(lang);
  const ac = selected.filter((c) => c.pb_is230v);
  const totalWh = selected.reduce((s, c) => s + c.pb_wh, 0);
  const peakW = selected.reduce((m, c) => Math.max(m, c.pb_peak || 0), 0);

  let text = `**${t.ctxConsumers}:**\n`;
  categories.forEach((cat) => {
    const items = selected.filter((c) => c.categoryLetter === cat.pb_categoryid);
    if (items.length === 0) return;
    text += `\n${cat.pb_categoryid} – ${catName(cat, lang)}:\n`;
    items.forEach((c) => {
      const netz = c.pb_is230v ? t.ctx230 : "12 V";
      const peak = c.pb_peak > 0 ? `, ${t.peak} ${c.pb_peak} W` : "";
      text += `- ${consumerName(c, lang)}: ~${c.pb_wh} ${t.whPerDay}, ${netz}${peak}\n`;
    });
  });

  text += `\n**${t.ctxSummary}:** ${Math.round(totalWh)} ${t.ctxTotalDemand}, ${Math.round(peakW)} ${t.ctxPeakLoad}`;
  text += `, ${t.ctxBattery} ${computeBatteryRange(totalWh)}, ${t.ctxInverter} ${computeInverter(selected, t.notRequired)}`;
  if (ac.length > 0) text += ` ${t.ctxAcCount(ac.length)}`;
  text += "\n\n";

  text += `**${t.ctxProfile}:**\n\n`;
  QUESTIONS.forEach((q) => {
    const a = answers[q.id];
    if (!a || a.status === "skipped") {
      text += `- ${qTitle(q, lang)}: ${t.ctxSkipped}\n`;
    } else {
      const val = Array.isArray(a.value) ? a.value.join(", ") : a.value;
      const extra = a.customValue ? ` (${a.customValue})` : "";
      text += `- ${qTitle(q, lang)}: ${val}${extra}\n`;
    }
  });

  text += "\n" + t.ctxInstruction;
  return text;
}
