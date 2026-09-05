// Laenderauswahl (nach Regionengruppen gruppiert). Bestimmt indirekt die
// UI-Sprache und die laenderspezifische Marke/Regulierung.

import type { ReactNode } from "react";
import type { DometicCountry, Lang } from "../models/types";
import { REGION_GROUPS } from "../models/types";
import { tr } from "../models/translations";

interface Props {
  countries: DometicCountry[];
  selected: string;
  lang: Lang;
  onChange: (code: string) => void;
}

export function CountrySelector({
  countries,
  selected,
  lang,
  onChange,
}: Props): ReactNode {
  const t = tr(lang);
  const current = countries.find((c) => c.pb_code === selected);

  return (
    <div className="country-selector">
      <label className="country-selector-label" htmlFor="countrySelect">
        {t.countryLabel}
      </label>
      <div className="country-selector-control">
        <span className="country-selector-flag">{current?.pb_flagemoji}</span>
        <select
          id="countrySelect"
          className="country-selector-select"
          aria-label={t.countryLabel}
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          {REGION_GROUPS.map((region) => {
            const inGroup = countries.filter(
              (c) => c.pb_regiongroup === region.key,
            );
            if (inGroup.length === 0) return null;
            return (
              <optgroup key={region.key} label={region.label}>
                {inGroup.map((c) => (
                  <option key={c.pb_code} value={c.pb_code}>
                    {c.pb_flagemoji} {c.pb_name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <span className="country-selector-chevron">▾</span>
      </div>
    </div>
  );
}
