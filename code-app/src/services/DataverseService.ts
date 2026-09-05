// Dataverse-Adapter: liest die Konfigurationsdaten über die Dataverse Web API
// und bildet die numerischen Choice-Werte auf die Domain-Unions ab. Die Basis-
// URL kommt aus VITE_DATAVERSE_URL; authentifiziert wird über die Host-Session
// (credentials: "include") bzw. einen optionalen Bearer-Token.

import type {
  BeraterData,
  DometicBrand,
  DometicCategory,
  DometicConsumer,
  DometicCountry,
  DometicRegulation,
} from "../models/types";
import { BeraterFehler } from "../models/types";
import { langFromValue, regionGroupFromValue } from "../models/choiceValues";
import type { IDataService } from "./IDataService";

const API_BASE = (import.meta.env.VITE_DATAVERSE_URL as string | undefined) ?? "";
const TOKEN = import.meta.env.VITE_DATAVERSE_TOKEN as string | undefined;

interface ODataList<T> {
  value: T[];
}

interface RawBrand {
  pb_dometicbrandid: string;
  pb_name: string;
  pb_key: string;
  pb_catalogfile: string;
}

interface RawRegulation {
  pb_dometicregulationid: string;
  pb_name: string;
  pb_key: string;
  pb_file: string;
}

interface RawCategory {
  pb_dometiccategoryid: string;
  pb_name: string;
  pb_categoryid: string;
  pb_namede: string;
  pb_nameen: string;
  pb_namefr: string;
  pb_sortorder: number;
}

interface RawCountry {
  pb_dometiccountryid: string;
  pb_name: string;
  pb_code: string;
  pb_nameen: string;
  pb_flagemoji: string;
  pb_lang: number;
  pb_currency: string;
  pb_regiongroup: number;
  _pb_brand_value: string;
  _pb_regulation_value: string;
  pb_Brand?: RawBrand;
  pb_Regulation?: RawRegulation;
}

interface RawConsumer {
  pb_dometicconsumerid: string;
  pb_name: string;
  pb_nameen: string;
  pb_consumerid: string;
  pb_wh: number;
  pb_peak: number;
  pb_is230v: boolean;
  pb_subcategory?: string;
  _pb_category_value: string;
  pb_sortorder: number;
  pb_Category?: { pb_categoryid: string };
}

export class DataverseService implements IDataService {
  private async query<T>(entitySet: string, odata = ""): Promise<T[]> {
    const url = `${API_BASE}/api/data/v9.2/${entitySet}${odata}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    const resp = await fetch(url, { headers, credentials: "include" });
    if (!resp.ok) {
      throw new BeraterFehler(
        "LADEFEHLER",
        `Dataverse-Abfrage '${entitySet}' fehlgeschlagen: HTTP ${resp.status}`,
      );
    }
    const data = (await resp.json()) as ODataList<T>;
    return data.value;
  }

  async getData(): Promise<BeraterData> {
    const [rawBrands, rawRegs, rawCats, rawCountries, rawConsumers] =
      await Promise.all([
        this.query<RawBrand>("pb_dometicbrands", "?$orderby=pb_name"),
        this.query<RawRegulation>("pb_dometicregulations", "?$orderby=pb_name"),
        this.query<RawCategory>("pb_dometiccategories", "?$orderby=pb_sortorder"),
        this.query<RawCountry>(
          "pb_dometiccountries",
          "?$expand=pb_Brand,pb_Regulation&$orderby=pb_name",
        ),
        this.query<RawConsumer>(
          "pb_dometicconsumers",
          "?$expand=pb_Category($select=pb_categoryid)&$orderby=pb_sortorder",
        ),
      ]);

    const brands: DometicBrand[] = rawBrands;
    const regulations: DometicRegulation[] = rawRegs;
    const categories: DometicCategory[] = rawCats;

    const countries: DometicCountry[] = rawCountries.map((r) => ({
      pb_dometiccountryid: r.pb_dometiccountryid,
      pb_name: r.pb_name,
      pb_code: r.pb_code,
      pb_nameen: r.pb_nameen,
      pb_flagemoji: r.pb_flagemoji,
      pb_lang: langFromValue(r.pb_lang),
      pb_currency: r.pb_currency,
      pb_regiongroup: regionGroupFromValue(r.pb_regiongroup),
      _pb_brand_value: r._pb_brand_value,
      _pb_regulation_value: r._pb_regulation_value,
      pb_brand: r.pb_Brand,
      pb_regulation: r.pb_Regulation,
    }));

    const consumers: DometicConsumer[] = rawConsumers.map((r) => ({
      pb_dometicconsumerid: r.pb_dometicconsumerid,
      pb_name: r.pb_name,
      pb_nameen: r.pb_nameen,
      pb_consumerid: r.pb_consumerid,
      pb_wh: r.pb_wh,
      pb_peak: r.pb_peak,
      pb_is230v: r.pb_is230v,
      pb_subcategory: r.pb_subcategory,
      _pb_category_value: r._pb_category_value,
      pb_sortorder: r.pb_sortorder,
      categoryLetter: r.pb_Category?.pb_categoryid ?? "",
    }));

    return { countries, brands, regulations, categories, consumers };
  }
}
