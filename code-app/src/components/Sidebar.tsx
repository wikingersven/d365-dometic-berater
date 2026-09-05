// D365-UCI-Sitemap (linke Navigationsleiste). Zeigt den App-Bereich und die
// Verbraucher-Kategorien A–E als Sprungziele in die Auswahlliste.

import type { ReactNode } from "react";
import type { DometicCategory, Lang } from "../models/types";
import { catName } from "../models/translations";

interface Props {
  categories: DometicCategory[];
  catCounts: Record<string, number>;
  lang: Lang;
  onNavCategory: (categoryId: string) => void;
}

export function Sidebar({
  categories,
  catCounts,
  lang,
  onNavCategory,
}: Props): ReactNode {
  return (
    <nav className="d365-sitemap" aria-label="Navigation">
      <div className="d365-sitemap-area">
        <span className="d365-sitemap-area-icon">⚡</span>
        <span className="d365-sitemap-area-title">Bordelektrik-Berater</span>
      </div>

      <div className="d365-sitemap-group">Verbraucher</div>
      <ul className="d365-sitemap-list">
        {categories.map((cat) => {
          const n = catCounts[cat.pb_categoryid] || 0;
          return (
            <li key={cat.pb_categoryid}>
              <button
                type="button"
                className="d365-sitemap-item"
                onClick={() => onNavCategory(cat.pb_categoryid)}
              >
                <span className="d365-sitemap-letter">{cat.pb_categoryid}</span>
                <span className="d365-sitemap-label">{catName(cat, lang)}</span>
                {n > 0 && <span className="d365-sitemap-badge">{n}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
