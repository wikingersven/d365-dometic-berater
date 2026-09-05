// Zusammenfassungs-Panel (Marke, Tagesbedarf, Spitzenlast, Anzahl,
// Batterie-Richtwert, Wechselrichter) plus Start-Button der Beratung.

import type { ReactNode } from "react";
import type { Lang } from "../models/types";
import { tr } from "../models/translations";

interface Props {
  brandName: string;
  totalWh: number;
  peakW: number;
  count: number;
  batteryRange: string;
  inverterRec: string;
  lang: Lang;
  started: boolean;
  onStart: () => void;
}

export function SummaryPanel({
  brandName,
  totalWh,
  peakW,
  count,
  batteryRange,
  inverterRec,
  lang,
  started,
  onStart,
}: Props): ReactNode {
  const t = tr(lang);

  return (
    <>
      <div className="dom-summary">
        <div className="dom-summary-row">
          <span>{t.lblBrand}</span>
          <strong>{brandName}</strong>
        </div>
        <div className="dom-summary-divider" />
        <div className="dom-summary-row">
          <span>{t.lblDaily}</span>
          <strong>{Math.round(totalWh)} Wh</strong>
        </div>
        <div className="dom-summary-row">
          <span>{t.lblPeak}</span>
          <strong>{Math.round(peakW)} W</strong>
        </div>
        <div className="dom-summary-row">
          <span>{t.lblItems}</span>
          <strong>{count}</strong>
        </div>
        <div className="dom-summary-divider" />
        <div className="dom-summary-row">
          <span>{t.lblBattery}</span>
          <strong>{batteryRange}</strong>
        </div>
        <div className="dom-summary-row">
          <span>{t.lblInverter}</span>
          <strong>{inverterRec}</strong>
        </div>
      </div>

      <button
        className="dom-btn-start"
        onClick={onStart}
        disabled={started || count === 0}
      >
        {started ? t.btnStartRunning : t.btnStart}
      </button>
    </>
  );
}
