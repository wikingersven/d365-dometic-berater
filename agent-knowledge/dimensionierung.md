# Dimensionierung – Formeln, Faktoren, Kabel, Beispiel

## 1. Energiebilanz

Tagesbedarf E [Wh/Tag] = Σ(12-V-Verbraucher) + Σ(230-V-Verbraucher)/0,9
(0,9 = Wechselrichter-Wirkungsgrad inkl. Leerlauf).

Spitzenlast P_max [W] = Σ gleichzeitige 230-V-Lasten × Anlauffaktor
(ohmsch 1,0 · Mikrowelle 1,2 · Kompressor/Klima 2–3, mit SmartECO gedämpft).

## 2. Batterie

Nutzbare Kapazität: LiFePO4 ≈ 90 % · AGM ≈ 50 % (Zyklenschonung).

C_Batt [Ah] = E × Autarkietage / (12 × Nutzgrad)

| E (Wh/Tag) | 2 Tage LiFePO4 | 2 Tage AGM | Dometic-Vorschlag |
|---|---|---|---|
| 400 | 74 Ah | 133 Ah | TLB 100S / GP 150 |
| 600 | 111 Ah | 200 Ah | TLB 120 / 2×GP 100B |
| 900 | 167 Ah | 300 Ah | TLB 150 (+Solar) |
| 1500 | 278 Ah | — | 2×TLB 150 oder TLB 540 |
| ≥2500 (Klima) | ≥465 Ah | — | TLB 540(F) |

Zusatzregeln: Wintercamping → F-Variante (Heizung, Laden < 0 °C).
Entladestrom prüfen: P_max/12 ≤ Dauerstrom des BMS (TLB 540: 300 A ⇒ 3,6 kW;
kleine TLB: Datenblatt/online prüfen, typ. 100–150 A ⇒ 1,2–1,8 kW WR-Grenze
pro Batterie – bei 3-kW-Wechselrichter ggf. 2 Batterien parallel).

## 3. Solar

Ertragsfaktor f [Wh/Wp·Tag], Modul flach auf Dach, Deutschland/Alpenraum:
Sommer 3,5 · Frühjahr/Herbst 2,0 · Winter 0,5–1,0.

P_solar [Wp] = E / f  → Sommer-Autarkie: Wp ≈ E/3,5; Ganzjahres-Anspruch: Wp ≈ E/2.

Dachfläche: starres 130–150-W-Modul ≈ 1,5 m × 0,55–0,7 m. Regler:
Σ Wp ≤ 330 (SC330) bzw. ≤ 480 (SC480); zwei Eingänge → verschattetes und
freies Feld trennen. > 480 Wp: zweiter Regler.

Modulwahl: freie Fläche + MPPT → …MC (hohe Spannung) · Teilschatten → CDS /
mehrere kleine Module · Gewichts-/Höhenlimit → Flex …FL / Light&Flat.

## 4. Ladebooster

Nachladung pro Fahrstunde ≈ Booster-A × 12 [Wh] (40 A ≈ 480 Wh/h).

Wahl: benötigte Nachladung = E − Solarertrag; Booster-A ≥ Nachladung/(12 × Fahr-h).
Grenzen: ≤ ~⅓ der Lichtmaschinen-Nennleistung (Serien-LiMa 12 V meist
140–250 A → 40–80 A ok) und ≤ 0,5 C der Batterie (100 Ah → ≤ 50 A ⇒ MT LB 40;
ab 150 Ah/TLB 540 → MT LB 80). 24-V-Basis → 24/12-Varianten.

## 5. Wechselrichter

P_WR ≥ 1,2 × P_max; Netzvorrang gewünscht → DPSI …TS; FI integriert → …RCD;
starkes Landstrom-Laden + WR in einem → MT ICC. 12-V-Eingangsstrom
I ≈ P_WR/10 (z. B. 2000 W → ~200 A) → bestimmt Kabel + Sicherung + Batterie-BMS.

## 6. Kabelquerschnitte 12 V (Kupfer, ≤ 3 % Abfall ≈ 0,36 V)

Querschnitt A [mm²] ≈ 0,0175 × 2 × L[m] × I[A] / 0,36 — gerundet auf Normwert.

| Strom | 1 m einfache Länge | 2 m | 3 m | 5 m |
|---|---|---|---|---|
| 20 A | 2,5 mm² | 4 | 6 | 10 |
| 40 A | 4 | 10 | 16 | 25 |
| 60 A | 10 | 16 | 25 | 35 |
| 80 A | 10 | 16 | 25 | 50 |
| 150 A | 25 | 35 | 50 | 95 |
| 250 A | 35 | 50 | 95 | 120 |

Sicherung (Größe ≈ 1,25 × Dauerstrom, unterhalb Kabel-Belastbarkeit) so nah
wie möglich am Batterie-Pluspol; jede Plus-Abzweigung eigene Sicherung.
Nur feindrähtige Fahrzeugleitung (FLY/H07V-K), keine starre Installationsleitung.

## 7. Durchgerechnetes Beispiel

Paar, Kastenwagen (Ducato, 12 V), 3 Autarkietage, Sommer + Nebensaison,
Fahranteil ~1 h/Standtag. Verbraucher: K1 Kühlbox 420 Wh · L1 50 · W1 8 ·
P1×2 30 · P3 90 · U1 190 · U2 90 · C1 Kaffee 110/0,9 = 122 → **E ≈ 1000 Wh/Tag**,
P_max = Kaffeemaschine 1300 W.

- Batterie: 1000×3/(12×0,9) = 278 Ah → praxisnah **TLB 150** (Solar+Fahrt laden nach)
  oder kompromisslos 2×TLB 150.
- Solar Nebensaison: 1000/2 = 500 Wp → Dach begrenzt → **2× MT 150MC (300 Wp)**
  + **SC330**; deckt Sommer voll, Nebensaison ~60 %.
- Booster: Rest 400 Wh in 1 h Fahrt → **MT LB 40** (480 Wh/h).
- Wechselrichter: 1300×1,2 = 1560 → **DPSI 1512 TS** (Netzvorrang) – oder
  MT ICC 1600 SI-N, wenn oft Landstrom (60-A-Lader inklusive).
- Steuerung: **TD283**. Landstromlader entfällt bei ICC, sonst MCA PLUS 1225.

Stückliste (UVP): TLB 150 1.310 + 2×MT150MC (⚠ online) + SC330 159 +
MT LB 40 395 + DPSI 1512 TS 720 + TD283 135 + Kleinmaterial ~12 % → dem
Nutzer beide Pfade (DPSI-TS vs. ICC) mit Summen zeigen.
