// Verbraucher-Auswahl: A–E-Kategorien (aufklappbar) mit Unterkategorien,
// 230-V-Kennzeichnung und Tagesbedarf. Portiert aus renderCategories.

import type { ReactNode } from "react";
import type { DometicCategory, DometicConsumer, Lang } from "../models/types";
import {
  catName,
  consumerAltName,
  consumerName,
  subLabel,
  tr,
} from "../models/translations";

interface Props {
  categories: DometicCategory[];
  consumers: DometicConsumer[];
  selectedIds: string[];
  openCats: string[];
  lang: Lang;
  onToggle: (id: string) => void;
  onToggleCat: (categoryId: string) => void;
}

export function ConsumerChecklist({
  categories,
  consumers,
  selectedIds,
  openCats,
  lang,
  onToggle,
  onToggleCat,
}: Props): ReactNode {
  const t = tr(lang);

  return (
    <div className="dom-consumer-categories">
      {categories.map((cat) => {
        const items = consumers
          .filter((c) => c.categoryLetter === cat.pb_categoryid)
          .sort((a, b) => a.pb_sortorder - b.pb_sortorder);
        const n = items.filter((c) => selectedIds.includes(c.pb_dometicconsumerid))
          .length;
        const open = openCats.includes(cat.pb_categoryid);
        let lastSub: string | undefined;

        return (
          <div
            key={cat.pb_categoryid}
            id={`dom-cat-${cat.pb_categoryid}`}
            className={`dom-cat${open ? " open" : ""}`}
          >
            <button
              type="button"
              className="dom-cat-header"
              onClick={() => onToggleCat(cat.pb_categoryid)}
            >
              <span className="dom-cat-letter">{cat.pb_categoryid}</span>
              <span className="dom-cat-titles">
                <span className="dom-cat-de">{catName(cat, lang)}</span>
                <span className="dom-cat-en">
                  {lang === "en" ? "" : cat.pb_nameen}
                </span>
              </span>
              <span className={`dom-cat-badge${n > 0 ? " active" : ""}`}>{n}</span>
              <span className="dom-cat-chevron">▾</span>
            </button>

            <div className="dom-cat-body">
              {items.map((c) => {
                const showSub = c.pb_subcategory && c.pb_subcategory !== lastSub;
                if (c.pb_subcategory) lastSub = c.pb_subcategory;
                const checked = selectedIds.includes(c.pb_dometicconsumerid);
                let detail = `~${c.pb_wh} ${t.whPerDay}`;
                if (c.pb_peak > 0) detail += ` · ${t.peak} ${c.pb_peak} W`;
                const mainName = consumerName(c, lang);
                const altName = consumerAltName(c, lang);
                const subtitle =
                  altName && altName !== mainName ? (
                    <span className="dom-consumer-en">{altName}</span>
                  ) : null;

                return (
                  <div key={c.pb_dometicconsumerid}>
                    {showSub && (
                      <div className="dom-cat-sub">
                        {subLabel(c.pb_subcategory!, lang)}
                      </div>
                    )}
                    <label
                      className={`dom-consumer${c.pb_is230v ? " dom-consumer-ac" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(c.pb_dometicconsumerid)}
                      />
                      <span className="dom-cb" />
                      <span className="dom-consumer-info">
                        <span className="dom-consumer-name">
                          {mainName}
                          {subtitle}
                        </span>
                        <span className="dom-consumer-detail">{detail}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
