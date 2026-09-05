// Numerische OptionSet-Werte der Dometic-Choices und Umkehr-Abbildungen für
// den Dataverse-Adapter.

import type { Lang, RegionGroup } from "./types";

export const LangValue = {
  de: 100000000,
  en: 100000001,
  fr: 100000002,
} as const;

export const RegionGroupValue = {
  DACH: 100000000,
  Nordics: 100000001,
  Benelux: 100000002,
  WesternEurope: 100000003,
  SouthernEurope: 100000004,
  UKIreland: 100000005,
  CentralEurope: 100000006,
  SoutheastEurope: 100000007,
  Baltics: 100000008,
} as const;

/** Numerischer Choice-Wert -> Lang-Union. */
export function langFromValue(value: number | null | undefined): Lang {
  const entry = (Object.entries(LangValue) as [Lang, number][]).find(
    ([, v]) => v === value,
  );
  return entry ? entry[0] : "en";
}

/** Numerischer Choice-Wert -> RegionGroup-Union. */
export function regionGroupFromValue(
  value: number | null | undefined,
): RegionGroup {
  const entry = (Object.entries(RegionGroupValue) as [RegionGroup, number][]).find(
    ([, v]) => v === value,
  );
  return entry ? entry[0] : "DACH";
}
