# Normen-Checkliste Freizeitfahrzeug-Elektrik (Orientierung, kein Normtext)

Zweck: Grundlage für den Pflicht-Hinweisblock in jeder Empfehlung und für
Plausibilitätsprüfungen der Auslegung. Zusammenfassung in eigenen Worten –
verbindlich ist der jeweils aktuelle Normtext; Auslegung/Prüfung der
230-V-Anlage gehört in die Hände einer Elektrofachkraft.

## Relevante Regelwerke (Karte)

| Regelwerk | Gilt für |
|---|---|
| DIN VDE 0100-721 (dt. Übernahme HD 60364-7-721, Ausgabe 2019-10) | 230/400-V-Anlage in Caravans & Motorcaravans |
| DIN EN 1648-2 (2018) | 12-V-DC-Kleinspannungsanlage im Motorcaravan (Wohnteil) |
| DIN EN 1648-1 | dito im Caravan (Wohnwagen) |
| DIN VDE 0100-410 | Schutz gegen elektrischen Schlag (Basis) |
| IEC 60309 | CEE-Steckvorrichtungen (Camping: blau, 230 V) |
| UN ECE R10 | EMV-Genehmigung verbauter Elektronik im Fahrzeug |
| DIN VDE 0100-708 | Stromversorgung auf Campingplätzen (Kontext Einspeisung) |

## 230-V-Anlage – Kernpunkte VDE 0100-721 (für den Hinweisblock)

- Max. 230 V einphasig (bzw. 400 V drei­phasig) Einspeisung; Anschluss über
  CEE-Steckvorrichtung (blau), Zuleitung geeignet für Außenbereich (IP44).
- Direkt nach der Einspeisung: Fehlerstromschutzeinrichtung (RCD) ≤ 30 mA;
  sämtliche Stromkreise des Fahrzeugs müssen RCD-geschützt sein.
- Leitungsschutz: zweipolig trennende LS-Schalter üblich (L+N schalten).
- Leitungen: nur mehr-/feindrähtig, mindestens flammwidrig, Querschnitt
  ≥ 1,5 mm²; starre NYM-Installationsleitung ist unzulässig.
- Verlegung vibrationsfest: Kantenschutz, kurze Befestigungsabstände,
  Scheuerschutz an Durchführungen.
- Eine Bedienungs-/Sicherheitsanweisung für den Nutzer muss im Fahrzeug
  angebracht sein.
- Errichtung/Änderung und Erst-/Wiederholungsprüfung durch Elektrofachkraft
  (Messprotokoll: u. a. Durchgängigkeit Schutzleiter, Isolationswiderstand,
  RCD-Auslösung). Selbstausbauer: Abnahme z. B. im Rahmen der
  Wohnmobil-Zulassung/Gutachten einplanen.

## 12-V-Anlage – Kernpunkte EN 1648-2

- Leitungen nach Strombelastbarkeit UND Spannungsfall bemessen
  (siehe Kabeltabelle in dimensionierung.md).
- Jede vom Plus abgehende Leitung möglichst batterienah absichern;
  Sicherungswert unterhalb der Leitungsbelastbarkeit.
- Batterien: sicher befestigt (Crashkräfte), Pole gegen Kurzschluss
  geschützt; bei Blei-/AGM-Batterien im Innenraum Entgasung beachten
  (LiFePO4 gasungsfrei – ein Argument im Beratungsgespräch).
- Trennmöglichkeit der Bordbatterie (Hauptschalter/Trennstelle) vorsehen.
- Getrennte Führung/Kennzeichnung von 12-V- und 230-V-Kreisen;
  keine gemeinsamen Klemmräume ohne Trennung.

## System-/Geräteseitig

- Wechselrichterausgang: Schutzkonzept beachten – DPSI-…RCD-Modelle bringen
  den FI mit; sonst FI/Netzvorrang extern lösen (…TS/ICC schalten Landstrom
  automatisch vor).
- Nur Geräte mit Fahrzeug-EMV-Genehmigung (ECE R10 / E-Kennzeichen) fest
  verbauen – bei Dometic/Büttner gegeben, bei Fremdzubehör prüfen.
- Gasbetriebene Geräte (Absorber, Heizung) → separate Gasprüfung (G 607),
  nicht Teil dieser Elektro-Checkliste, aber im Gespräch erwähnen.

## Formulierungsregeln für den Agenten

- Immer als "Orientierung nach …" formulieren, nie "damit ist die Anlage
  zugelassen/abgenommen".
- Keine Schritt-für-Schritt-Anleitung zum Errichten der 230-V-Anlage;
  stattdessen: Planung/Stückliste ja, Ausführung + Prüfung → Fachbetrieb.
- Bei Nutzerfragen nach Normdetails: kurz zusammenfassen, auf offizielle
  Bezugsquellen (VDE-Verlag/Beuth) und Fachkraft verweisen.
