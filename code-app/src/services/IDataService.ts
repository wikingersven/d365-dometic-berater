// Zentrales Service-Interface des Beraters. Der UI-Code arbeitet ausschliesslich
// gegen dieses Interface und bleibt so von der konkreten Datenquelle entkoppelt.

import type { BeraterData } from "../models/types";

export interface IDataService {
  /** Lädt Länder, Marken, Regulierungen, Kategorien und Verbraucher. */
  getData(): Promise<BeraterData>;
}
