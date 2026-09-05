// i18n — vollständige DE/EN/FR-Strings (aus dem Original-TRANSLATIONS-Objekt)
// sowie die Definition des Fragenkarussells.

import type { DometicCategory, DometicConsumer, Lang } from "./types";

export interface Translation {
  countryLabel: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  sidebarHint: string;
  lblBrand: string;
  lblDaily: string;
  lblPeak: string;
  lblItems: string;
  lblBattery: string;
  lblInverter: string;
  btnStart: string;
  btnStartRunning: string;
  btnSubmit: string;
  btnSend: string;
  btnPDF: string;
  inputPlaceholder: string;
  chatEmptyTitle: string;
  chatEmptyText: string;
  carouselHint: string;
  carouselPrev: string;
  carouselNext: string;
  carouselDone: string;
  carouselProgress: (i: number, n: number) => string;
  skip: string;
  answered: string;
  skipped: string;
  whPerDay: string;
  peak: string;
  notRequired: string;
  consumersSelected: (n: number, wh: number) => string;
  noReply: string;
  connError: (msg: string) => string;
  sub: Record<string, string>;
  ctxConsumers: string;
  ctxSummary: string;
  ctxProfile: string;
  ctxSkipped: string;
  ctxTotalDemand: string;
  ctxPeakLoad: string;
  ctxBattery: string;
  ctxInverter: string;
  ctxAcCount: (n: number) => string;
  ctx230: string;
  ctxInstruction: string;
}

export const TRANSLATIONS: Record<Lang, Translation> = {
  de: {
    countryLabel: "Land",
    sidebarTitle: "Verbraucher auswählen",
    sidebarSubtitle: "Wähle deine Verbraucher",
    sidebarHint:
      "Hake an, was du im Fahrzeug nutzen willst · Wh-Werte sind typische Richtwerte pro Tag.",
    lblBrand: "Marke",
    lblDaily: "Tagesbedarf",
    lblPeak: "Spitzenlast",
    lblItems: "Verbraucher",
    lblBattery: "Batterie-Richtwert",
    lblInverter: "Wechselrichter",
    btnStart: "Beratung starten",
    btnStartRunning: "✓ Beratung läuft",
    btnSubmit: "Alle Antworten absenden",
    btnSend: "Senden",
    btnPDF: "PDF herunterladen",
    inputPlaceholder: "Deine Antwort...",
    chatEmptyTitle: "Wähle links deine Verbraucher",
    chatEmptyText:
      "Dann starten wir die Beratung — der KI-Agent dimensioniert Batterie, Solar, Ladebooster, Wechselrichter und liefert eine Stückliste mit Preisen.",
    carouselHint: "Beantworte die Fragen oder überspringe sie",
    carouselPrev: "◀ Zurück",
    carouselNext: "Weiter ▶",
    carouselDone: "✓ Fertig",
    carouselProgress: (i, n) => `Frage ${i} / ${n}`,
    skip: "Überspringen",
    answered: "✓ Beantwortet",
    skipped: "⏭ Übersprungen",
    whPerDay: "Wh/Tag",
    peak: "Spitze",
    notRequired: "nicht nötig",
    consumersSelected: (n, wh) => `${n} Verbraucher ausgewählt · ${wh} Wh/Tag`,
    noReply: "Keine Antwort erhalten.",
    connError: (msg) => `⚠ Verbindungsfehler: ${msg}. Bitte versuche es erneut.`,
    sub: {
      "12 V": "12 V",
      "230 V · Wechselrichter / Inverter": "230 V · Wechselrichter",
      "Kompressor / Compressor": "Kompressor",
      "Absorber / Absorption (Gas)": "Absorber (Gas)",
    },
    ctxConsumers: "Gewählte Verbraucher (nach Kategorie)",
    ctxSummary: "Zusammenfassung",
    ctxProfile: "Fahrzeug- & Nutzungsprofil",
    ctxSkipped: "übersprungen",
    ctxTotalDemand: "Wh/Tag Gesamtbedarf",
    ctxPeakLoad: "W Spitzenlast",
    ctxBattery: "Batterie-Richtwert",
    ctxInverter: "Wechselrichter",
    ctxAcCount: (n) => `(${n} × 230-V-Verbraucher)`,
    ctx230: "230 V (Wechselrichter)",
    ctxInstruction:
      "Bitte fahre direkt mit Schritt 3 fort — Energiebilanz rechnen und zeigen. Schritt 1 und 2 sind oben schon beantwortet. Danach Schritt 4–7.",
  },
  en: {
    countryLabel: "Country",
    sidebarTitle: "Select consumers",
    sidebarSubtitle: "Select your consumers",
    sidebarHint:
      "Tick what you want to use in the vehicle · Wh values are typical daily estimates.",
    lblBrand: "Brand",
    lblDaily: "Daily demand",
    lblPeak: "Peak load",
    lblItems: "Items",
    lblBattery: "Battery estimate",
    lblInverter: "Inverter",
    btnStart: "Start consultation",
    btnStartRunning: "✓ Consultation running",
    btnSubmit: "Submit all answers",
    btnSend: "Send",
    btnPDF: "Download PDF",
    inputPlaceholder: "Your answer...",
    chatEmptyTitle: "Select your consumers on the left",
    chatEmptyText:
      "Then we start the consultation — the AI agent sizes the battery, solar, charge booster and inverter and delivers a parts list with prices.",
    carouselHint: "Answer the questions or skip them",
    carouselPrev: "◀ Back",
    carouselNext: "Next ▶",
    carouselDone: "✓ Done",
    carouselProgress: (i, n) => `Question ${i} / ${n}`,
    skip: "Skip",
    answered: "✓ Answered",
    skipped: "⏭ Skipped",
    whPerDay: "Wh/day",
    peak: "Peak",
    notRequired: "not required",
    consumersSelected: (n, wh) => `${n} consumers selected · ${wh} Wh/day`,
    noReply: "No answer received.",
    connError: (msg) => `⚠ Connection error: ${msg}. Please try again.`,
    sub: {
      "12 V": "12 V",
      "230 V · Wechselrichter / Inverter": "230 V · Inverter",
      "Kompressor / Compressor": "Compressor",
      "Absorber / Absorption (Gas)": "Absorption (Gas)",
    },
    ctxConsumers: "Selected consumers (by category)",
    ctxSummary: "Summary",
    ctxProfile: "Vehicle & usage profile",
    ctxSkipped: "skipped",
    ctxTotalDemand: "Wh/day total demand",
    ctxPeakLoad: "W peak load",
    ctxBattery: "battery estimate",
    ctxInverter: "inverter",
    ctxAcCount: (n) => `(${n} × 230 V consumers)`,
    ctx230: "230 V (inverter)",
    ctxInstruction:
      "Please continue directly with step 3 — calculate and show the energy balance. Steps 1 and 2 are already answered above. Then continue with steps 4–7.",
  },
  fr: {
    countryLabel: "Pays",
    sidebarTitle: "Sélectionner les consommateurs",
    sidebarSubtitle: "Sélectionnez vos consommateurs",
    sidebarHint:
      "Cochez ce que vous voulez utiliser dans le véhicule · les valeurs Wh sont des estimations journalières typiques.",
    lblBrand: "Marque",
    lblDaily: "Besoin journalier",
    lblPeak: "Charge de pointe",
    lblItems: "Consommateurs",
    lblBattery: "Batterie estimée",
    lblInverter: "Onduleur",
    btnStart: "Démarrer le conseil",
    btnStartRunning: "✓ Conseil en cours",
    btnSubmit: "Envoyer toutes les réponses",
    btnSend: "Envoyer",
    btnPDF: "Télécharger le PDF",
    inputPlaceholder: "Votre réponse...",
    chatEmptyTitle: "Sélectionnez vos consommateurs à gauche",
    chatEmptyText:
      "Ensuite nous démarrons le conseil — l’agent IA dimensionne la batterie, le solaire, le booster de charge et l’onduleur et fournit une nomenclature avec les prix.",
    carouselHint: "Répondez aux questions ou passez-les",
    carouselPrev: "◀ Retour",
    carouselNext: "Suivant ▶",
    carouselDone: "✓ Terminé",
    carouselProgress: (i, n) => `Question ${i} / ${n}`,
    skip: "Passer",
    answered: "✓ Répondu",
    skipped: "⏭ Ignoré",
    whPerDay: "Wh/jour",
    peak: "Crête",
    notRequired: "non nécessaire",
    consumersSelected: (n, wh) =>
      `${n} consommateurs sélectionnés · ${wh} Wh/jour`,
    noReply: "Aucune réponse reçue.",
    connError: (msg) => `⚠ Erreur de connexion : ${msg}. Veuillez réessayer.`,
    sub: {
      "12 V": "12 V",
      "230 V · Wechselrichter / Inverter": "230 V · Onduleur",
      "Kompressor / Compressor": "Compresseur",
      "Absorber / Absorption (Gas)": "Absorption (gaz)",
    },
    ctxConsumers: "Consommateurs sélectionnés (par catégorie)",
    ctxSummary: "Résumé",
    ctxProfile: "Profil véhicule & utilisation",
    ctxSkipped: "ignoré",
    ctxTotalDemand: "Wh/jour besoin total",
    ctxPeakLoad: "W charge de pointe",
    ctxBattery: "batterie estimée",
    ctxInverter: "onduleur",
    ctxAcCount: (n) => `(${n} × consommateurs 230 V)`,
    ctx230: "230 V (onduleur)",
    ctxInstruction:
      "Veuillez poursuivre directement avec l’étape 3 — calculer et présenter le bilan énergétique. Les étapes 1 et 2 sont déjà renseignées ci-dessus. Ensuite, poursuivez avec les étapes 4 à 7.",
  },
};

export function tr(lang: Lang): Translation {
  return TRANSLATIONS[lang] || TRANSLATIONS.de;
}

/** Kategoriename in der aktiven Sprache (Fallback EN -> DE). */
export function catName(cat: DometicCategory, lang: Lang): string {
  if (lang === "en") return cat.pb_nameen || cat.pb_namede;
  if (lang === "fr") return cat.pb_namefr || cat.pb_nameen || cat.pb_namede;
  return cat.pb_namede;
}

/** Verbrauchername in der aktiven Sprache (DE = pb_name, sonst pb_nameen). */
export function consumerName(c: DometicConsumer, lang: Lang): string {
  return lang === "de" ? c.pb_name : c.pb_nameen || c.pb_name;
}

/** Zweitname (fuer den Untertitel) — gegenlaeufig zu consumerName. */
export function consumerAltName(c: DometicConsumer, lang: Lang): string {
  return lang === "de" ? c.pb_nameen : c.pb_name;
}

/** Uebersetztes Label einer Unterkategorie (Kompressor, 230 V, ...). */
export function subLabel(sub: string, lang: Lang): string {
  const map = tr(lang).sub;
  return (map && map[sub]) || sub;
}

/** Kurzer Markenname fuer die Zusammenfassung (aus pb_key). */
export function brandShort(key: string | undefined): string {
  switch (key) {
    case "buettner":
      return "Büttner";
    case "nds":
      return "NDS";
    default:
      return "Dometic";
  }
}

/** Definition einer Karussell-Frage (vollständig übersetzt). */
export interface Question {
  id: string;
  type: "choice" | "text";
  multi?: boolean;
  allowCustom?: boolean;
  title: string; // DE-Fallback (u. a. für PDF)
  titleI18n: Record<Lang, string>;
  hintI18n: Record<Lang, string>;
  optionsI18n?: Record<Lang, string[]>;
  placeholderI18n?: Record<Lang, string>;
  customPlaceholderI18n?: Record<Lang, string>;
}

export function qTitle(q: Question, lang: Lang): string {
  return q.titleI18n[lang] || q.title;
}
export function qHint(q: Question, lang: Lang): string {
  return q.hintI18n[lang] || q.hintI18n.de;
}
export function qOptions(q: Question, lang: Lang): string[] {
  return (q.optionsI18n && q.optionsI18n[lang]) || [];
}
export function qPlaceholder(q: Question, lang: Lang): string {
  return (q.placeholderI18n && q.placeholderI18n[lang]) || "";
}
export function qCustomPlaceholder(q: Question, lang: Lang): string {
  return (q.customPlaceholderI18n && q.customPlaceholderI18n[lang]) || "";
}

export const QUESTIONS: Question[] = [
  {
    id: "fahrzeugtyp",
    type: "choice",
    title: "Fahrzeugtyp",
    titleI18n: { de: "Fahrzeugtyp", en: "Vehicle type", fr: "Type de véhicule" },
    hintI18n: {
      de: "Welches Freizeitfahrzeug hast du?",
      en: "Which leisure vehicle do you have?",
      fr: "Quel véhicule de loisirs avez-vous ?",
    },
    optionsI18n: {
      de: ["Kastenwagen (Van)", "Teilintegriertes Wohnmobil", "Vollintegriertes Wohnmobil", "Wohnwagen (Caravan)"],
      en: ["Panel van (Van)", "Semi-integrated motorhome", "Fully-integrated motorhome", "Caravan"],
      fr: ["Fourgon aménagé (Van)", "Camping-car profilé", "Camping-car intégral", "Caravane"],
    },
  },
  {
    id: "basisfahrzeug",
    type: "choice",
    allowCustom: true,
    title: "Basisfahrzeug & Bordnetz",
    titleI18n: {
      de: "Basisfahrzeug & Bordnetz",
      en: "Base vehicle & electrical system",
      fr: "Véhicule de base & réseau de bord",
    },
    hintI18n: {
      de: "Welches Basisfahrzeug und welche Bordspannung?",
      en: "Which base vehicle and onboard voltage?",
      fr: "Quel véhicule de base et quelle tension de bord ?",
    },
    optionsI18n: {
      de: ["Fiat Ducato (12V)", "Mercedes Sprinter (12V)", "MAN/Iveco (24V, Lkw-Basis)", "VW Crafter (12V)", "Ford Transit (12V)", "Anderes"],
      en: ["Fiat Ducato (12V)", "Mercedes Sprinter (12V)", "MAN/Iveco (24V, truck base)", "VW Crafter (12V)", "Ford Transit (12V)", "Other"],
      fr: ["Fiat Ducato (12V)", "Mercedes Sprinter (12V)", "MAN/Iveco (24V, base camion)", "VW Crafter (12V)", "Ford Transit (12V)", "Autre"],
    },
    customPlaceholderI18n: {
      de: "Anderes Fahrzeug eingeben...",
      en: "Enter other vehicle...",
      fr: "Saisir un autre véhicule...",
    },
  },
  {
    id: "reiseprofil",
    type: "choice",
    multi: true,
    title: "Reise- & Autarkieprofil",
    titleI18n: {
      de: "Reise- & Autarkieprofil",
      en: "Travel & off-grid profile",
      fr: "Profil de voyage & autonomie",
    },
    hintI18n: {
      de: "Wie reist du typischerweise?",
      en: "How do you typically travel?",
      fr: "Comment voyagez-vous généralement ?",
    },
    optionsI18n: {
      de: ["Nur Sommer", "Ganzjährig", "1–2 Autarkietage", "3–5 Autarkietage", "7+ Autarkietage", "Viel Fahranteil (>2h/Tag)", "Wenig Fahranteil (<1h/Tag)"],
      en: ["Summer only", "Year-round", "1–2 off-grid days", "3–5 off-grid days", "7+ off-grid days", "Lots of driving (>2h/day)", "Little driving (<1h/day)"],
      fr: ["Été seulement", "Toute l’année", "1–2 jours en autonomie", "3–5 jours en autonomie", "7+ jours en autonomie", "Beaucoup de route (>2h/jour)", "Peu de route (<1h/jour)"],
    },
  },
  {
    id: "dach",
    type: "choice",
    title: "Dachfläche & Solar-Potenzial",
    titleI18n: {
      de: "Dachfläche & Solar-Potenzial",
      en: "Roof area & solar potential",
      fr: "Surface du toit & potentiel solaire",
    },
    hintI18n: {
      de: "Wie sieht dein Dach aus?",
      en: "What does your roof look like?",
      fr: "À quoi ressemble votre toit ?",
    },
    optionsI18n: {
      de: ["Freies, unverschattetes Dach", "Teilverschattung (Dachaufbauten, Klima)", "Aufstelldach / wenig Platz", "Kein Solar gewünscht"],
      en: ["Clear, unshaded roof", "Partial shading (roof fixtures, AC)", "Pop-up roof / little space", "No solar wanted"],
      fr: ["Toit dégagé, sans ombrage", "Ombrage partiel (équipements, clim)", "Toit relevable / peu de place", "Pas de solaire souhaité"],
    },
  },
  {
    id: "budget",
    type: "choice",
    title: "Budgetrahmen",
    titleI18n: { de: "Budgetrahmen", en: "Budget range", fr: "Fourchette budgétaire" },
    hintI18n: {
      de: "In welchem Bereich darf sich die Bordelektrik bewegen?",
      en: "What is your budget range for the electrical system?",
      fr: "Quel budget pour le système électrique de bord ?",
    },
    optionsI18n: {
      de: ["Einstieg (bis 1.500 €)", "Standard (1.500–3.000 €)", "Komfort-Autark (3.000–5.000 €)", "Maximal / Klimaanlage netzfern (5.000+ €)"],
      en: ["Entry (up to €1,500)", "Standard (€1,500–3,000)", "Comfort off-grid (€3,000–5,000)", "Maximum / off-grid AC (€5,000+)"],
      fr: ["Entrée de gamme (jusqu’à 1 500 €)", "Standard (1 500–3 000 €)", "Confort autonome (3 000–5 000 €)", "Maximum / clim autonome (5 000+ €)"],
    },
  },
  {
    id: "bestand",
    type: "text",
    title: "Bereits vorhanden?",
    titleI18n: { de: "Bereits vorhanden?", en: "Already installed?", fr: "Déjà installé ?" },
    hintI18n: {
      de: "Was ist im Fahrzeug schon verbaut?",
      en: "What is already fitted in the vehicle?",
      fr: "Qu’est-ce qui est déjà installé dans le véhicule ?",
    },
    placeholderI18n: {
      de: 'z.B. "100 Ah AGM, 100W Solar, kein Booster" oder "Nichts, Neuausbau"',
      en: 'e.g. "100 Ah AGM, 100W solar, no booster" or "Nothing, new build"',
      fr: 'ex. "100 Ah AGM, 100W solaire, pas de booster" ou "Rien, nouvelle installation"',
    },
  },
];
