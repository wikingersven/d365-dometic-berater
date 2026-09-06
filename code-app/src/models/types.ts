// Dataverse-Entity-Interfaces des Dometic Bordelektrik-Beraters (Prefix pb_).
// Der UI- und Service-Code arbeitet ausschliesslich gegen diese Typen.

export type Lang = "de" | "en" | "fr";

export type RegionGroup =
  | "DACH"
  | "Nordics"
  | "Benelux"
  | "WesternEurope"
  | "SouthernEurope"
  | "UKIreland"
  | "CentralEurope"
  | "SoutheastEurope"
  | "Baltics";

/** pb_dometicbrand */
export interface DometicBrand {
  pb_dometicbrandid: string;
  pb_name: string;
  pb_key: string; // "buettner" | "nds" | "dometic"
  pb_catalogfile: string;
}

/** pb_dometicregulation */
export interface DometicRegulation {
  pb_dometicregulationid: string;
  pb_name: string;
  pb_key: string;
  pb_file: string;
}

/** pb_dometiccountry (mit optional expandierten Lookups) */
export interface DometicCountry {
  pb_dometiccountryid: string;
  pb_name: string; // nativer Name ("Deutschland")
  pb_code: string; // ISO-2 ("DE")
  pb_nameen: string; // englischer Name ("Germany")
  pb_flagemoji: string;
  pb_lang: Lang;
  pb_currency: string;
  pb_regiongroup: RegionGroup;
  _pb_brand_value: string; // Lookup -> pb_dometicbrand
  _pb_regulation_value: string; // Lookup -> pb_dometicregulation
  pb_brand?: DometicBrand; // expandiert
  pb_regulation?: DometicRegulation; // expandiert
}

/** pb_dometiccategory */
export interface DometicCategory {
  pb_dometiccategoryid: string;
  pb_name: string;
  pb_categoryid: string; // "A".."E"
  pb_namede: string;
  pb_nameen: string;
  pb_namefr: string;
  pb_sortorder: number;
}

/** pb_dometicconsumer (mit optional expandiertem Kategorie-Kürzel) */
export interface DometicConsumer {
  pb_dometicconsumerid: string;
  pb_name: string; // deutscher Name ("CFX3 25")
  pb_nameen: string;
  pb_consumerid: string; // "A1"
  pb_wh: number;
  pb_peak: number;
  pb_is230v: boolean;
  pb_subcategory?: string;
  _pb_category_value: string; // Lookup -> pb_dometiccategory
  pb_sortorder: number;
  categoryLetter: string; // Convenience: "A".."E" (aus Kategorie-Expand)
}

/** D365-Produkt (Standard-Entität products, gefiltert auf DOM-*). */
export interface Product {
  productid: string;
  productnumber: string;
  name: string;
  price: number;
  description?: string;
}

/** Eine Position (Zeile) im Angebot-Dialog (Client-seitig). */
export interface QuoteLineItem {
  key: string; // stabile Client-ID (nur UI)
  productId: string;
  quantity: number;
  pricePerUnit: number;
}

/** Treffer der Kunden-Suche (Account oder Contact vereinheitlicht). */
export interface CustomerSearchResult {
  id: string;
  type: "account" | "contact";
  name: string;
  email?: string;
  phone?: string;
}

/** Eingabedaten zur Neuanlage eines Kunden. */
export interface NewCustomerInput {
  kind: "company" | "person";
  name: string; // Firmenname bzw. vollständiger Name
  email?: string;
  phone?: string;
}

/** Eingabe zum Erstellen eines Angebots. */
export interface CreateQuoteInput {
  name: string;
  customer: { id: string; type: "account" | "contact"; name: string };
  lines: QuoteLineItem[];
}

/** Ergebnis der Angebots-Erstellung. */
export interface QuoteResult {
  quoteId: string;
  name: string;
  url?: string; // Deep-Link ins D365 (leer im Demo-Modus)
  demo: boolean;
}

/** Gebündelte Konfigurationsdaten für die Beratung. */
export interface BeraterData {
  countries: DometicCountry[];
  brands: DometicBrand[];
  regulations: DometicRegulation[];
  categories: DometicCategory[];
  consumers: DometicConsumer[];
}

/** Zustand einer Karussell-Antwort. */
export interface AnswerState {
  value: string | string[] | null;
  status: "answered" | "skipped";
  customValue?: string;
}

export type Answers = Record<string, AnswerState>;

/** Chat-Nachricht in der UI. */
export interface ChatMessage {
  type: "system" | "user" | "agent";
  text: string;
}

/** Verlaufseintrag für die Azure-Function. */
export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

/** Fehlerobjekt der Datenservices. */
export class BeraterFehler extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "BeraterFehler";
  }
}

/** Reihenfolge + Labels der Dropdown-Regionengruppen (wie im Original). */
export const REGION_GROUPS: { key: RegionGroup; label: string }[] = [
  { key: "DACH", label: "DACH" },
  { key: "Nordics", label: "Nordics" },
  { key: "Benelux", label: "Benelux" },
  { key: "WesternEurope", label: "Western Europe" },
  { key: "SouthernEurope", label: "Southern Europe" },
  { key: "UKIreland", label: "UK & Ireland" },
  { key: "CentralEurope", label: "Central Europe" },
  { key: "SoutheastEurope", label: "Southeast Europe" },
  { key: "Baltics", label: "Baltics" },
];

/** Sprache je Land — identisch zum Original. */
export function getLanguageForCountry(code: string): Lang {
  if (["DE", "AT", "CH"].includes(code)) return "de";
  if (["FR", "BE", "LU"].includes(code)) return "fr";
  return "en";
}

/** LiFePO4-Batterie-Richtwert (12 V, ~0,9 nutzbar, 1–2 Autarkietage). */
export function computeBatteryRange(totalWh: number): string {
  if (totalWh <= 0) return "—";
  const round = (a: number) => Math.ceil(a / 10) * 10;
  const ah1 = totalWh / (12 * 0.9);
  const ah2 = (2 * totalWh) / (12 * 0.9);
  return `${round(ah1)}–${round(ah2)} Ah`;
}

/** Wechselrichter-Empfehlung anhand der 230-V-Spitzenlast. */
export function computeInverter(
  consumers: DometicConsumer[],
  notRequiredLabel: string,
): string {
  const ac = consumers.filter((c) => c.pb_is230v);
  if (ac.length === 0) return notRequiredLabel;
  const maxPeak = Math.max(...ac.map((c) => c.pb_peak || 0));
  const need = maxPeak * 1.2;
  const sizes = [1000, 1600, 2000, 3000, 5000];
  const rec = sizes.find((s) => s >= need) || Math.ceil(need / 500) * 500;
  return `~${rec} W`;
}
