// Vollständige Seed-Daten (identisch zum Original-Frontend): 30 Länder,
// 3 Marken, 9 Regulierungen, 5 Kategorien A–E, 48 Verbraucher. Dient dem
// MockDataService und als Referenz für den Dataverse-Import.

import type {
  BeraterData,
  DometicBrand,
  DometicCategory,
  DometicConsumer,
  DometicCountry,
  DometicRegulation,
  Lang,
  RegionGroup,
} from "../models/types";

const brands: DometicBrand[] = [
  { pb_dometicbrandid: "brand-buettner", pb_name: "Büttner Elektronik / Dometic", pb_key: "buettner", pb_catalogfile: "brands/buettner.md" },
  { pb_dometicbrandid: "brand-nds", pb_name: "NDS Energy / Dometic", pb_key: "nds", pb_catalogfile: "brands/nds.md" },
  { pb_dometicbrandid: "brand-dometic", pb_name: "Dometic", pb_key: "dometic", pb_catalogfile: "brands/dometic.md" },
];

const regulations: DometicRegulation[] = [
  { pb_dometicregulationid: "reg-dach", pb_name: "DIN VDE / EN 1648", pb_key: "dach", pb_file: "regulations/dach.md" },
  { pb_dometicregulationid: "reg-fr", pb_name: "NF C15-100 / EN 1648", pb_key: "fr", pb_file: "regulations/fr.md" },
  { pb_dometicregulationid: "reg-bs", pb_name: "BS 7671 / EN 1648", pb_key: "bs", pb_file: "regulations/bs.md" },
  { pb_dometicregulationid: "reg-cei", pb_name: "CEI 64-8 / EN 1648", pb_key: "cei", pb_file: "regulations/cei.md" },
  { pb_dometicregulationid: "reg-nordic", pb_name: "NEK 400 / SS 436 / EN 1648", pb_key: "nordic", pb_file: "regulations/nordic.md" },
  { pb_dometicregulationid: "reg-arei", pb_name: "AREI / EN 1648", pb_key: "arei", pb_file: "regulations/arei.md" },
  { pb_dometicregulationid: "reg-nen", pb_name: "NEN 1010 / EN 1648", pb_key: "nen", pb_file: "regulations/nen.md" },
  { pb_dometicregulationid: "reg-rebt", pb_name: "REBT / EN 1648", pb_key: "rebt", pb_file: "regulations/rebt.md" },
  { pb_dometicregulationid: "reg-eu_default", pb_name: "HD 60364 / EN 1648 (EU default)", pb_key: "eu_default", pb_file: "regulations/eu_default.md" },
];

const categories: DometicCategory[] = [
  { pb_dometiccategoryid: "cat-A", pb_categoryid: "A", pb_name: "Mobile Kühlboxen", pb_namede: "Mobile Kühlboxen", pb_nameen: "Mobile Coolers", pb_namefr: "Glacières mobiles", pb_sortorder: 1 },
  { pb_dometiccategoryid: "cat-B", pb_categoryid: "B", pb_name: "Einbau-Kühlschränke", pb_namede: "Einbau-Kühlschränke", pb_nameen: "Built-in Fridges", pb_namefr: "Réfrigérateurs encastrés", pb_sortorder: 2 },
  { pb_dometiccategoryid: "cat-C", pb_categoryid: "C", pb_name: "Klimaanlagen", pb_namede: "Klimaanlagen", pb_nameen: "Air Conditioning", pb_namefr: "Climatiseurs", pb_sortorder: 3 },
  { pb_dometiccategoryid: "cat-D", pb_categoryid: "D", pb_name: "Sanitär & Wasser", pb_namede: "Sanitär & Wasser", pb_nameen: "Sanitation & Water", pb_namefr: "Sanitaire & eau", pb_sortorder: 4 },
  { pb_dometiccategoryid: "cat-E", pb_categoryid: "E", pb_name: "Bordtechnik & Komfort", pb_namede: "Bordtechnik & Komfort", pb_nameen: "Onboard Tech & Comfort", pb_namefr: "Technique de bord & confort", pb_sortorder: 5 },
];

// [code, native, nameEN, flag, lang, currency, region, brandKey, regKey]
type CRow = [string, string, string, string, Lang, string, RegionGroup, string, string];

const COUNTRY_ROWS: CRow[] = [
  ["DE", "Deutschland", "Germany", "🇩🇪", "de", "EUR", "DACH", "buettner", "dach"],
  ["AT", "Österreich", "Austria", "🇦🇹", "de", "EUR", "DACH", "buettner", "dach"],
  ["CH", "Schweiz", "Switzerland", "🇨🇭", "de", "CHF", "DACH", "buettner", "dach"],
  ["DK", "Danmark", "Denmark", "🇩🇰", "en", "DKK", "Nordics", "dometic", "nordic"],
  ["SE", "Sverige", "Sweden", "🇸🇪", "en", "SEK", "Nordics", "dometic", "nordic"],
  ["NO", "Norge", "Norway", "🇳🇴", "en", "NOK", "Nordics", "dometic", "nordic"],
  ["FI", "Suomi", "Finland", "🇫🇮", "en", "EUR", "Nordics", "dometic", "nordic"],
  ["BE", "Belgique", "Belgium", "🇧🇪", "fr", "EUR", "Benelux", "nds", "arei"],
  ["NL", "Nederland", "Netherlands", "🇳🇱", "en", "EUR", "Benelux", "nds", "nen"],
  ["LU", "Luxembourg", "Luxembourg", "🇱🇺", "fr", "EUR", "Benelux", "nds", "arei"],
  ["FR", "France", "France", "🇫🇷", "fr", "EUR", "WesternEurope", "dometic", "fr"],
  ["ES", "España", "Spain", "🇪🇸", "en", "EUR", "WesternEurope", "dometic", "rebt"],
  ["PT", "Portugal", "Portugal", "🇵🇹", "en", "EUR", "WesternEurope", "dometic", "rebt"],
  ["IT", "Italia", "Italy", "🇮🇹", "en", "EUR", "SouthernEurope", "nds", "cei"],
  ["GR", "Ελλάδα", "Greece", "🇬🇷", "en", "EUR", "SouthernEurope", "dometic", "eu_default"],
  ["CY", "Κύπρος", "Cyprus", "🇨🇾", "en", "EUR", "SouthernEurope", "dometic", "eu_default"],
  ["MT", "Malta", "Malta", "🇲🇹", "en", "EUR", "SouthernEurope", "dometic", "eu_default"],
  ["GB", "United Kingdom", "United Kingdom", "🇬🇧", "en", "GBP", "UKIreland", "dometic", "bs"],
  ["IE", "Ireland", "Ireland", "🇮🇪", "en", "EUR", "UKIreland", "dometic", "bs"],
  ["PL", "Polska", "Poland", "🇵🇱", "en", "PLN", "CentralEurope", "dometic", "eu_default"],
  ["CZ", "Česko", "Czech Republic", "🇨🇿", "en", "CZK", "CentralEurope", "dometic", "eu_default"],
  ["SK", "Slovensko", "Slovakia", "🇸🇰", "en", "EUR", "CentralEurope", "dometic", "eu_default"],
  ["HU", "Magyarország", "Hungary", "🇭🇺", "en", "HUF", "CentralEurope", "dometic", "eu_default"],
  ["RO", "România", "Romania", "🇷🇴", "en", "RON", "SoutheastEurope", "dometic", "eu_default"],
  ["BG", "България", "Bulgaria", "🇧🇬", "en", "BGN", "SoutheastEurope", "dometic", "eu_default"],
  ["HR", "Hrvatska", "Croatia", "🇭🇷", "en", "EUR", "SoutheastEurope", "dometic", "eu_default"],
  ["SI", "Slovenija", "Slovenia", "🇸🇮", "en", "EUR", "SoutheastEurope", "dometic", "eu_default"],
  ["EE", "Eesti", "Estonia", "🇪🇪", "en", "EUR", "Baltics", "dometic", "eu_default"],
  ["LV", "Latvija", "Latvia", "🇱🇻", "en", "EUR", "Baltics", "dometic", "eu_default"],
  ["LT", "Lietuva", "Lithuania", "🇱🇹", "en", "EUR", "Baltics", "dometic", "eu_default"],
];

const countries: DometicCountry[] = COUNTRY_ROWS.map((r) => {
  const [code, name, nameen, flag, lang, currency, region, brandKey, regKey] = r;
  const brand = brands.find((b) => b.pb_key === brandKey)!;
  const regulation = regulations.find((x) => x.pb_key === regKey)!;
  return {
    pb_dometiccountryid: `country-${code}`,
    pb_name: name,
    pb_code: code,
    pb_nameen: nameen,
    pb_flagemoji: flag,
    pb_lang: lang,
    pb_currency: currency,
    pb_regiongroup: region,
    _pb_brand_value: brand.pb_dometicbrandid,
    _pb_regulation_value: regulation.pb_dometicregulationid,
    pb_brand: brand,
    pb_regulation: regulation,
  };
});

// [consumerId, name, nameEN, wh, peak, catLetter, is230v, sub?]
type KRow = [string, string, string, number, number, string, boolean, string?];

const CONSUMER_ROWS: KRow[] = [
  ["A1", "CFX3 25", "CFX3 25", 250, 0, "A", false],
  ["A2", "CFX3 35", "CFX3 35", 300, 0, "A", false],
  ["A3", "CFX3 45", "CFX3 45", 370, 0, "A", false],
  ["A4", "CFX3 55", "CFX3 55", 390, 0, "A", false],
  ["A5", "CFX3 55IM", "CFX3 55IM", 443, 0, "A", false],
  ["A6", "CFX3 75DZ", "CFX3 75DZ", 500, 0, "A", false],
  ["A7", "CFX3 95DZ", "CFX3 95DZ", 650, 0, "A", false],
  ["A8", "CFF 35", "CFF 35", 300, 0, "A", false],
  ["A9", "CFF 45", "CFF 45", 350, 0, "A", false],
  ["B1", "NRX 35C", "NRX 35C", 250, 0, "B", false, "Kompressor / Compressor"],
  ["B2", "NRX 50C", "NRX 50C", 300, 0, "B", false, "Kompressor / Compressor"],
  ["B3", "NRX 60C", "NRX 60C", 350, 0, "B", false, "Kompressor / Compressor"],
  ["B4", "NRX 80C", "NRX 80C", 350, 0, "B", false, "Kompressor / Compressor"],
  ["B5", "NRX 115", "NRX 115", 400, 0, "B", false, "Kompressor / Compressor"],
  ["B6", "NRX 130", "NRX 130", 500, 0, "B", false, "Kompressor / Compressor"],
  ["B7", "NRX 90V", "NRX 90V", 400, 0, "B", false, "Kompressor / Compressor"],
  ["B8", "RC 10.4 90", "RC 10.4 90", 400, 0, "B", false, "Kompressor / Compressor"],
  ["B9", "RCL 10.4ET", "RCL 10.4ET", 450, 0, "B", false, "Kompressor / Compressor"],
  ["B10", "RCD 10.5T", "RCD 10.5T", 500, 0, "B", false, "Kompressor / Compressor"],
  ["B11", "RCD 10.5XT", "RCD 10.5XT", 650, 0, "B", false, "Kompressor / Compressor"],
  ["B12", "RMS 10.5T", "RMS 10.5T", 120, 0, "B", false, "Absorber / Absorption (Gas)"],
  ["B13", "RM 10.5T", "RM 10.5T", 120, 0, "B", false, "Absorber / Absorption (Gas)"],
  ["B14", "RMD 10.5XT", "RMD 10.5XT", 120, 0, "B", false, "Absorber / Absorption (Gas)"],
  ["C1", "FreshJet FJX4 1500M", "FreshJet FJX4 1500M", 2500, 750, "C", true],
  ["C2", "FreshJet FJX4 1700", "FreshJet FJX4 1700", 3000, 850, "C", true],
  ["C3", "FreshJet FJX4 2200", "FreshJet FJX4 2200", 3500, 1000, "C", true],
  ["C4", "FreshJet FJX7", "FreshJet FJX7", 3000, 1700, "C", true],
  ["C5", "CoolAir RTX 1000", "CoolAir RTX 1000", 2000, 250, "C", false],
  ["C6", "CoolAir RTX 2000", "CoolAir RTX 2000", 3500, 700, "C", false],
  ["D1", "CTS 4110 Kassettentoilette", "CTS 4110 Cassette Toilet", 5, 0, "D", false],
  ["D2", "MasterFlush MF 7100", "MasterFlush MF 7100", 15, 200, "D", false],
  ["D3", "Druckwasserpumpe", "Pressure water pump", 8, 0, "D", false],
  ["D4", "Warmwasserboiler 230V", "Water heater 230V", 500, 1300, "D", true],
  ["D5", "Tankheizung 12V", "Tank heater 12V", 250, 0, "D", false],
  ["E1", "LED-Beleuchtung", "LED lighting", 70, 0, "E", false, "12 V"],
  ["E2", "Dachlüfter", "Roof fan", 60, 0, "E", false, "12 V"],
  ["E3", "Heizungsgebläse", "Heater blower", 200, 0, "E", false, "12 V"],
  ["E4", "WLAN-Router", "WiFi router", 190, 0, "E", false, "12 V"],
  ["E5", "TV + SAT", "TV + SAT", 100, 0, "E", false, "12 V"],
  ["E6", "Handy laden", "Phone charging", 15, 0, "E", false, "12 V"],
  ["E7", "Laptop laden", "Laptop charging", 90, 0, "E", false, "12 V"],
  ["E8", "CPAP", "CPAP", 320, 0, "E", false, "12 V"],
  ["E9", "Kaffeemaschine", "Coffee machine", 122, 1500, "E", true, "230 V · Wechselrichter / Inverter"],
  ["E10", "Wasserkocher", "Kettle", 278, 2000, "E", true, "230 V · Wechselrichter / Inverter"],
  ["E11", "Induktionsplatte", "Induction hob", 889, 2000, "E", true, "230 V · Wechselrichter / Inverter"],
  ["E12", "Mikrowelle", "Microwave", 244, 1560, "E", true, "230 V · Wechselrichter / Inverter"],
  ["E13", "Fön", "Hair dryer", 100, 2000, "E", true, "230 V · Wechselrichter / Inverter"],
  ["E14", "E-Bike laden", "E-bike charging", 611, 250, "E", true, "230 V · Wechselrichter / Inverter"],
];

const consumers: DometicConsumer[] = CONSUMER_ROWS.map((r, i) => {
  const [id, name, nameen, wh, peak, cat, is230v, sub] = r;
  return {
    pb_dometicconsumerid: `con-${id}`,
    pb_name: name,
    pb_nameen: nameen,
    pb_consumerid: id,
    pb_wh: wh,
    pb_peak: peak,
    pb_is230v: is230v,
    pb_subcategory: sub,
    _pb_category_value: `cat-${cat}`,
    pb_sortorder: i + 1,
    categoryLetter: cat,
  };
});

/** Tiefenkopie des vollständigen Seed-Datensatzes. */
export function getSeedData(): BeraterData {
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  return clone({ countries, brands, regulations, categories, consumers });
}
