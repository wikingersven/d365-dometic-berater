# Quote-Feature für D365 Dometic Berater

## Aufgabe
Erweitere die React App in `/opt/data/d365-dometic-berater/code-app/` um einen "Angebot erstellen"-Button, der nach der AI-Beratung ein D365 CE Quote auf Powerbusters erstellt.

## Architektur-Überblick
Die bestehende App hat:
- **DataverseService.ts** — liest aus Dataverse Web API (fetch mit Bearer Token oder credentials: "include")
- **MockDataService.ts** — Demo-Modus mit Seed-Daten
- **IDataService.ts** — gemeinsames Interface
- **serviceFactory.ts** — wählt Mock vs. Dataverse
- **ChatPanel.tsx** — Chat-Bereich, hier kommt der Button hin
- **App.tsx** — State-Management

## Was gebaut werden muss

### 1. Neues QuoteService Interface + Implementierung

**`src/services/QuoteService.ts`** — Dataverse Web API Calls:

```typescript
// Produkt-Suche (die DOM-* Produkte die wir gerade angelegt haben)
// GET /products?$filter=contains(productnumber,'DOM-')&$select=productid,productnumber,name,price,description

// Account/Contact Suche für Kunden-Lookup
// GET /accounts?$filter=contains(name,'{search}')&$select=accountid,name,telephone1,emailaddress1&$top=10
// GET /contacts?$filter=contains(fullname,'{search}')&$select=contactid,fullname,telephone1,emailaddress1&$top=10

// Account/Contact Neuanlage
// POST /accounts { name, telephone1, emailaddress1 }
// POST /contacts { firstname, lastname, telephone1, emailaddress1 }

// Quote erstellen
// POST /quotes {
//   name: "Dometic Bordelektrik - {Kundenname}",
//   pricelevelid@odata.bind: "/pricelevels({PRICELIST_ID})",
//   customerid_account@odata.bind: "/accounts({accountid})" // ODER
//   customerid_contact@odata.bind: "/contacts({contactid})"
// }

// Quote Details (Positionen) erstellen  
// POST /quotedetails {
//   quoteid@odata.bind: "/quotes({quoteid})",
//   productid@odata.bind: "/products({productid})",
//   uomid@odata.bind: "/uoms({uomid})",
//   quantity: 1,
//   priceperunit: 829.00,
//   ispriceoverridden: true  // Preis aus Knowledge, nicht aus Preisliste
// }
```

### 2. QuoteDialog Komponente

**`src/components/QuoteDialog.tsx`** — Modal-Dialog mit:

1. **Kunden-Sektion:**
   - Toggle: "Bestehender Kunde" / "Neuer Kunde"
   - **Bestehender Kunde:** Suchfeld mit Autocomplete (Accounts + Contacts), debounced 300ms
   - **Neuer Kunde:** Formular mit: Typ (Firma/Person), Name/Firmenname, E-Mail, Telefon
   
2. **Positionen-Tabelle:**
   - Vorbefüllt aus den Produkten die der Agent in seiner Antwort empfohlen hat
   - Spalten: Produkt (Dropdown aus DOM-* Produkten), Menge (Input), Preis/Stk (Input, vorbelegt aus Preisliste), Summe (berechnet), Löschen-Button
   - "Position hinzufügen"-Button unten
   - Gesamtsumme
   
3. **Action-Buttons:**
   - "Angebot erstellen" (Primary) — erstellt Quote + QuoteDetails in Dataverse
   - "Abbrechen" (Secondary)
   
4. **Feedback:**
   - Erfolg: "Angebot {name} erstellt!" mit Link zum Quote in D365 (URL: `{CRM_URL}/main.aspx?pagetype=entityrecord&etn=quote&id={quoteid}`)
   - Fehler: Error-Nachricht

### 3. Integration in ChatPanel

- Nach `submitted` (Chat aktiv) einen "📋 Angebot erstellen"-Button anzeigen (neben dem PDF-Button)
- Button öffnet den QuoteDialog als Modal/Overlay
- Übersetzungen DE/EN/FR hinzufügen

### 4. Produkt-Matching

Die AI-Antwort enthält Produktnamen wie "TEMPRA TLB 120", "DPSI 1500 TS" etc.
Zum automatischen Vorbefüllen der Positionen:
- Parse die letzte Agent-Nachricht nach bekannten Produktnamen
- Matche gegen die `name`-Felder der DOM-* Produkte
- Setze Menge = 1, Preis = aus Preisliste

### 5. i18n Ergänzungen (translations.ts)

Füge zu TRANSLATIONS hinzu:
```
btnQuote: "Angebot erstellen" / "Create quote" / "Créer un devis"
quoteTitle: "Angebot erstellen" / "Create Quote" / "Créer un devis"
quoteCustomer: "Kunde" / "Customer" / "Client"
quoteExisting: "Bestehender Kunde" / "Existing customer" / "Client existant"
quoteNew: "Neuer Kunde" / "New customer" / "Nouveau client"
quoteCompany: "Firma" / "Company" / "Entreprise"
quotePerson: "Person" / "Person" / "Personne"
quoteName: "Name" / "Name" / "Nom"
quoteEmail: "E-Mail" / "Email" / "E-mail"
quotePhone: "Telefon" / "Phone" / "Téléphone"
quoteSearch: "Kunde suchen..." / "Search customer..." / "Rechercher un client..."
quoteProduct: "Produkt" / "Product" / "Produit"
quoteQty: "Menge" / "Qty" / "Qté"
quotePrice: "Preis/Stk" / "Price/Unit" / "Prix/Unité"
quoteTotal: "Summe" / "Total" / "Total"
quoteAddLine: "Position hinzufügen" / "Add line" / "Ajouter une ligne"
quoteGrandTotal: "Gesamtsumme" / "Grand total" / "Total général"
quoteSubmit: "Angebot erstellen" / "Create quote" / "Créer le devis"
quoteCancel: "Abbrechen" / "Cancel" / "Annuler"
quoteSuccess: "Angebot erstellt!" / "Quote created!" / "Devis créé !"
quoteOpenInD365: "In D365 öffnen" / "Open in D365" / "Ouvrir dans D365"
quoteError: "Fehler beim Erstellen" / "Error creating quote" / "Erreur lors de la création"
```

## Wichtige Konstanten

```typescript
const PRICELIST_ID = "0a83611c-c4a9-f111-aaac-70a8a538c36c";  // Dometic Bordelektrik UVP 2026
const UOM_ID = "34137b31-100f-f011-998a-7c1e52510281";  // Primary Unit
```

## CSS Guidelines

- Modal: Overlay mit backdrop blur, zentriert, max-width 900px
- Tabelle: D365-style (border-collapse, alternating rows)
- Suchfeld: Dropdown-Ergebnisse unterhalb
- Dometic-Farben (schwarz, gelb #e8c840)
- Responsive: Scrollbar bei vielen Positionen

## Constraints

- TypeScript strict, keine `any`
- Gleiche fetch-Pattern wie DataverseService.ts (gleiche Headers, credentials: "include")
- MockDataService: QuoteService im Demo-Modus zeigt "Demo-Modus — Angebot wird nicht erstellt" 
- `npm run build` muss durchlaufen (tsc + vite)
- Alle Strings dreisprachig (DE/EN/FR)

## Dateien die geändert werden:

1. **NEU:** `src/services/QuoteService.ts` — API-Calls für Quote/QuoteDetail/Customer
2. **NEU:** `src/components/QuoteDialog.tsx` — Modal-Dialog
3. **ÄNDERN:** `src/components/ChatPanel.tsx` — Button hinzufügen + Dialog-State
4. **ÄNDERN:** `src/models/translations.ts` — i18n-Strings
5. **ÄNDERN:** `src/models/types.ts` — Neue Interfaces (QuoteLineItem, CustomerSearchResult, etc.)
6. **ÄNDERN:** `src/App.css` — Modal + Tabellen-Styles

## Build & Verify

```bash
cd /opt/data/d365-dometic-berater/code-app
npm run build
```
