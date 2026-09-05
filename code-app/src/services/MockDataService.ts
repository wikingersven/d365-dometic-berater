// In-Memory-Datenservice für den Demo-Modus. Liefert den vollständigen
// Seed-Datensatz ohne Dataverse-Verbindung.

import type { BeraterData } from "../models/types";
import { getSeedData } from "./seedData";
import type { IDataService } from "./IDataService";

export class MockDataService implements IDataService {
  private data: BeraterData = getSeedData();

  async getData(): Promise<BeraterData> {
    return JSON.parse(JSON.stringify(this.data)) as BeraterData;
  }
}
