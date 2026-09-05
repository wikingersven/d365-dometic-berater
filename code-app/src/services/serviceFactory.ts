// Auswahl der konkreten Datenquelle. Im Demo-Modus (VITE_DEMO_MODE=true) wird
// der In-Memory-MockDataService genutzt, sonst der Dataverse-Adapter. Der übrige
// Anwendungscode kennt nur das Interface IDataService.

import { DataverseService } from "./DataverseService";
import { MockDataService } from "./MockDataService";
import type { IDataService } from "./IDataService";

/** true, wenn die App gegen die In-Memory-Demo-Daten laufen soll. */
export function istDemoModus(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

let instanz: IDataService | undefined;

/** Liefert die (prozessweite) Service-Instanz gemäß Modus. */
export function getService(): IDataService {
  if (!instanz) {
    instanz = istDemoModus() ? new MockDataService() : new DataverseService();
  }
  return instanz;
}
