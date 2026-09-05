// PDF-Export der Beratung (Verbraucher, Profil, KI-Ergebnis). Client-seitig
// via jsPDF. Layout und deutsche Beschriftungen 1:1 aus dem Original.

import { jsPDF } from "jspdf";
import type {
  Answers,
  DometicCategory,
  DometicConsumer,
  HistoryEntry,
} from "../models/types";
import { QUESTIONS } from "../models/translations";

type RGB = [number, number, number];

interface PdfParams {
  selected: DometicConsumer[];
  categories: DometicCategory[];
  answers: Answers;
  history: HistoryEntry[];
}

export function generatePdf({
  selected,
  categories,
  answers,
  history,
}: PdfParams): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 20,
    mr = 20,
    mt = 25,
    mb = 25;
  const cw = pw - ml - mr;
  let y = mt;

  const black: RGB = [26, 26, 26];
  const gray: RGB = [100, 100, 100];
  const yellow: RGB = [232, 200, 64];
  const lightGray: RGB = [245, 245, 245];
  const white: RGB = [255, 255, 255];

  const setText = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);

  function drawFooter() {
    doc.setFontSize(8);
    setText(gray);
    doc.text(
      "Dometic Bordelektrik-Berater — KI-generierte Empfehlung, unverbindlich. Preise = UVP. 230-V-Installation durch Elektrofachkraft.",
      pw / 2,
      ph - 10,
      { align: "center" },
    );
    doc.text(`Seite ${doc.getNumberOfPages()}`, pw - mr, ph - 10, {
      align: "right",
    });
  }

  function checkPage(need: number) {
    if (y + need > ph - mb) {
      doc.addPage();
      y = mt;
      drawFooter();
    }
  }

  // === Kopfzeile ===
  setFill(black);
  doc.rect(0, 0, pw, 18, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setText(white);
  doc.text("DOMETIC", ml, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Bordelektrik-Berater", ml + 48, 12);
  const now = new Date();
  const dateStr = now.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.text(dateStr, pw - mr, 12, { align: "right" });

  y = 28;
  drawFooter();

  // === Titel ===
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  setText(black);
  doc.text("Beratungsergebnis — Autarke Bordelektrik", ml, y);
  y += 10;

  // === Verbraucher-Tabelle ===
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  setText(black);
  doc.text("Gewählte Verbraucher", ml, y);
  y += 6;

  const totalWh = selected.reduce((s, c) => s + c.pb_wh, 0);
  const peakW = selected.reduce((m, c) => Math.max(m, c.pb_peak || 0), 0);

  setFill(lightGray);
  doc.rect(ml, y, cw, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setText(gray);
  doc.text("VERBRAUCHER", ml + 2, y + 5);
  doc.text("NETZ", ml + 90, y + 5);
  doc.text("SPITZE", ml + 110, y + 5);
  doc.text("WH/TAG", ml + 140, y + 5);
  y += 8;

  let rowIdx = 0;
  categories.forEach((cat) => {
    const items = selected.filter((c) => c.categoryLetter === cat.pb_categoryid);
    if (items.length === 0) return;
    checkPage(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(gray);
    doc.text(
      `${cat.pb_categoryid} · ${cat.pb_namede} / ${cat.pb_nameen}`,
      ml + 2,
      y + 1,
    );
    y += 5;

    doc.setFontSize(9);
    items.forEach((c) => {
      checkPage(6);
      if (rowIdx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(ml, y - 3.5, cw, 6, "F");
      }
      doc.setFont("helvetica", "normal");
      setText(black);
      doc.text(c.pb_name, ml + 2, y);
      setText(gray);
      doc.text(c.pb_is230v ? "230 V" : "12 V", ml + 90, y);
      doc.text(c.pb_peak > 0 ? c.pb_peak + " W" : "—", ml + 110, y);
      doc.setFont("helvetica", "bold");
      doc.text(c.pb_wh + " Wh", ml + 140, y);
      y += 6;
      rowIdx++;
    });
  });

  // === Summenzeile ===
  checkPage(10);
  doc.setDrawColor(200, 200, 200);
  doc.line(ml, y, ml + cw, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(black);
  doc.text("GESAMT", ml + 2, y);
  doc.text(`${Math.round(totalWh)} Wh/Tag`, ml + 140, y);
  if (peakW > 0) {
    doc.setFontSize(8);
    setText(gray);
    doc.text(`Spitzenlast: ${Math.round(peakW)} W`, ml + 85, y);
  }
  y += 10;

  // === Profil ===
  checkPage(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  setText(black);
  doc.text("Fahrzeug- & Nutzungsprofil", ml, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  QUESTIONS.forEach((q) => {
    checkPage(8);
    const a = answers[q.id];
    doc.setFont("helvetica", "bold");
    setText(black);
    doc.text(`${q.title}:`, ml + 2, y);
    doc.setFont("helvetica", "normal");
    setText(gray);
    let val = "—";
    if (a && a.status === "answered") {
      val = Array.isArray(a.value) ? a.value.join(", ") : a.value || "—";
      if (a.customValue) val += ` (${a.customValue})`;
    } else if (a && a.status === "skipped") {
      val = "Übersprungen";
    }
    doc.text(val, ml + 55, y);
    y += 6;
  });
  y += 6;

  // === KI-Beratungsergebnis ===
  const agentMessages = history.filter((m) => m.role === "assistant");
  if (agentMessages.length > 0) {
    checkPage(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    setText(black);
    doc.text("KI-Beratungsergebnis", ml, y);
    y += 3;
    setFill(yellow);
    doc.rect(ml, y, 40, 1.5, "F");
    y += 6;

    agentMessages.forEach((msg) => {
      msg.content.split("\n").forEach((line) => {
        const stripped = line.replace(/\*\*/g, "");
        const h1 = line.match(/^# (.+)/);
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);
        const h4 = line.match(/^#### (.+)/);
        const hr = /^(-{3,}|_{3,}|\*{3,})$/.test(line.trim());
        const bullet = line.match(/^- (.+)/);
        const numbered = line.match(/^(\d+)\.\s+(.+)/);
        const tableRow = line.match(/^\|(.+)\|$/);
        const tableSep = /^\|[\s\-:]+(\|[\s\-:]+)+\|?$/.test(line.trim());

        if (tableSep) return;
        if (hr) {
          checkPage(6);
          doc.setDrawColor(220, 220, 220);
          doc.line(ml, y, ml + cw, y);
          y += 4;
          return;
        }
        if (h1 || h2) {
          checkPage(12);
          y += 3;
          doc.setFontSize(h1 ? 13 : 11);
          doc.setFont("helvetica", "bold");
          setText(black);
          doc.text((h1 || h2)![1].replace(/\*\*/g, ""), ml, y);
          y += h1 ? 7 : 6;
          return;
        }
        if (h3 || h4) {
          checkPage(10);
          y += 2;
          doc.setFontSize(h3 ? 10 : 9);
          doc.setFont("helvetica", "bold");
          setText(black);
          doc.text((h3 || h4)![1].replace(/\*\*/g, ""), ml, y);
          y += 5;
          return;
        }
        if (tableRow) {
          checkPage(6);
          const rawCells = line.split("|").slice(1, -1);
          const cells = rawCells.map((c) => c.trim().replace(/\*\*/g, ""));
          const colW = cw / cells.length;
          doc.setFontSize(8);
          cells.forEach((cell, ci) => {
            const raw = rawCells[ci]?.trim() || "";
            doc.setFont("helvetica", /^\*\*/.test(raw) ? "bold" : "normal");
            setText(ci === 0 ? black : gray);
            doc.text(doc.splitTextToSize(cell, colW - 4), ml + ci * colW + 2, y);
          });
          y += 5;
          return;
        }
        if (bullet) {
          checkPage(6);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          setText(black);
          const wrapped = doc.splitTextToSize(bullet[1].replace(/\*\*/g, ""), cw - 8);
          doc.text("•", ml + 2, y);
          doc.text(wrapped, ml + 7, y);
          y += wrapped.length * 4.5;
          return;
        }
        if (numbered) {
          checkPage(6);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          setText(black);
          const wrapped = doc.splitTextToSize(numbered[2].replace(/\*\*/g, ""), cw - 10);
          doc.text(`${numbered[1]}.`, ml + 2, y);
          doc.text(wrapped, ml + 9, y);
          y += wrapped.length * 4.5;
          return;
        }
        if (stripped.trim() === "") {
          y += 3;
          return;
        }
        checkPage(6);
        doc.setFontSize(9);
        setText(black);
        doc.setFont("helvetica", /\*\*/.test(line) ? "bold" : "normal");
        const wrapped = doc.splitTextToSize(stripped, cw);
        doc.text(wrapped, ml, y);
        y += wrapped.length * 4.5;
      });
      y += 4;
    });
  }

  doc.save(`Dometic-Beratung_${dateStr.replace(/\./g, "-")}.pdf`);
}
