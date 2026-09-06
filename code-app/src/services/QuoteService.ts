// Angebots-Service: liest DOM-*-Produkte, sucht/legt Kunden an und erstellt
// D365-CE-Quotes samt Positionen über die Dataverse Web API. Auth und
// fetch-Pattern sind identisch zum DataverseService (credentials: "include",
// optionaler Bearer-Token). Im Demo-Modus wird der MockQuoteService verwendet.

import type {
  CreateQuoteInput,
  CustomerSearchResult,
  NewCustomerInput,
  Product,
  QuoteResult,
} from "../models/types";
import { BeraterFehler } from "../models/types";
import { istDemoModus } from "./serviceFactory";

const API_BASE = (import.meta.env.VITE_DATAVERSE_URL as string | undefined) ?? "";
const TOKEN = import.meta.env.VITE_DATAVERSE_TOKEN as string | undefined;

// Standard D365 Quote-Tabellen mit Dual-Write — Company-ID für Pflichtfeld
const COMPANY_ID = "ededa78a-315a-428b-86c2-25ffb01add83"; // arwg
const PRICELIST_ID = "0a83611c-c4a9-f111-aaac-70a8a538c36c";
const UOM_ID = "34137b31-100f-f011-998a-7c1e52510281";

/** Service-Interface für die Angebots-Erstellung. */
export interface IQuoteService {
  /** Alle DOM-*-Produkte (für Dropdown und Positions-Matching). */
  getProducts(): Promise<Product[]>;
  /** Kunden-Suche über Accounts und Contacts. */
  searchCustomers(term: string): Promise<CustomerSearchResult[]>;
  /** Legt einen neuen Kunden an (Firma -> Account, Person -> Contact). */
  createCustomer(input: NewCustomerInput): Promise<CustomerSearchResult>;
  /** Erstellt Quote + Positionen und liefert Id/URL zurück. */
  createQuote(input: CreateQuoteInput): Promise<QuoteResult>;
}

interface ODataList<T> {
  value: T[];
}

function odataUrl(entitySet: string, odata = ""): string {
  return `${API_BASE}/api/data/v9.2/${entitySet}${odata}`;
}

function baseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

/** Einfaches escaping für OData-String-Literale. */
function esc(term: string): string {
  return term.replace(/'/g, "''");
}

async function getList<T>(entitySet: string, odata: string): Promise<T[]> {
  const resp = await fetch(odataUrl(entitySet, odata), {
    headers: baseHeaders(),
    credentials: "include",
  });
  if (!resp.ok) {
    throw new BeraterFehler(
      "LADEFEHLER",
      `Dataverse-Abfrage '${entitySet}' fehlgeschlagen: HTTP ${resp.status}`,
    );
  }
  return ((await resp.json()) as ODataList<T>).value;
}

async function postEntity<T>(
  entitySet: string,
  body: Record<string, unknown>,
): Promise<T> {
  const resp = await fetch(odataUrl(entitySet), {
    method: "POST",
    headers: {
      ...baseHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new BeraterFehler(
      "ANLAGEFEHLER",
      `Anlegen in '${entitySet}' fehlgeschlagen: HTTP ${resp.status}`,
    );
  }
  return (await resp.json()) as T;
}

interface RawProduct {
  productid: string;
  productnumber: string;
  name: string;
  price?: number;
  description?: string;
}

interface RawAccount {
  accountid: string;
  name: string;
  telephone1?: string;
  emailaddress1?: string;
}

interface RawContact {
  contactid: string;
  fullname: string;
  telephone1?: string;
  emailaddress1?: string;
}

/** Dataverse-Implementierung des Angebots-Service. */
export class DataverseQuoteService implements IQuoteService {
  async getProducts(): Promise<Product[]> {
    const raw = await getList<RawProduct>(
      "products",
      "?$filter=contains(productnumber,'DOM-')&$select=productid,productnumber,name,price,description&$orderby=productnumber",
    );
    return raw.map((p) => ({
      productid: p.productid,
      productnumber: p.productnumber,
      name: p.name,
      price: p.price ?? 0,
      description: p.description,
    }));
  }

  async searchCustomers(term: string): Promise<CustomerSearchResult[]> {
    const q = esc(term);
    const [accounts, contacts] = await Promise.all([
      getList<RawAccount>(
        "accounts",
        `?$filter=contains(name,'${q}')&$select=accountid,name,telephone1,emailaddress1&$top=10`,
      ),
      getList<RawContact>(
        "contacts",
        `?$filter=contains(fullname,'${q}')&$select=contactid,fullname,telephone1,emailaddress1&$top=10`,
      ),
    ]);
    return [
      ...accounts.map((a) => ({
        id: a.accountid,
        type: "account" as const,
        name: a.name,
        email: a.emailaddress1,
        phone: a.telephone1,
      })),
      ...contacts.map((c) => ({
        id: c.contactid,
        type: "contact" as const,
        name: c.fullname,
        email: c.emailaddress1,
        phone: c.telephone1,
      })),
    ];
  }

  async createCustomer(input: NewCustomerInput): Promise<CustomerSearchResult> {
    if (input.kind === "company") {
      const created = await postEntity<RawAccount>("accounts", {
        name: input.name,
        telephone1: input.phone,
        emailaddress1: input.email,
      });
      return {
        id: created.accountid,
        type: "account",
        name: created.name,
        email: created.emailaddress1,
        phone: created.telephone1,
      };
    }
    const parts = input.name.trim().split(/\s+/);
    const firstname = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
    const lastname = parts.length > 1 ? parts[parts.length - 1] : "";
    const created = await postEntity<RawContact>("contacts", {
      firstname,
      lastname,
      telephone1: input.phone,
      emailaddress1: input.email,
    });
    return {
      id: created.contactid,
      type: "contact",
      name: created.fullname || input.name,
      email: created.emailaddress1,
      phone: created.telephone1,
    };
  }

  async createQuote(input: CreateQuoteInput): Promise<QuoteResult> {
    const quoteBody: Record<string, unknown> = {
      name: input.name,
      "pricelevelid@odata.bind": `/pricelevels(${PRICELIST_ID})`,
      "msdyn_Company@odata.bind": `/cdm_companies(${COMPANY_ID})`,
    };
    if (input.customer.type === "account") {
      quoteBody["customerid_account@odata.bind"] =
        `/accounts(${input.customer.id})`;
    } else {
      quoteBody["customerid_contact@odata.bind"] =
        `/contacts(${input.customer.id})`;
    }
    const quote = await postEntity<{ quoteid: string }>("quotes", quoteBody);

    // Create quote line items sequentially to avoid race conditions
    for (const line of input.lines) {
      await postEntity("quotedetails", {
        "quoteid@odata.bind": `/quotes(${quote.quoteid})`,
        "productid@odata.bind": `/products(${line.productId})`,
        "uomid@odata.bind": `/uoms(${UOM_ID})`,
        quantity: line.quantity,
        priceperunit: line.pricePerUnit,
        ispriceoverridden: true,
      });
    }

    return {
      quoteId: quote.quoteid,
      name: input.name,
      url: `${API_BASE}/main.aspx?pagetype=entityrecord&etn=quote&id=${quote.quoteid}`,
      demo: false,
    };
  }
}

/** Demo-Produkte für den Mock-Modus (Auszug der DOM-*-Palette). */
const DEMO_PRODUCTS: Product[] = [
  { productid: "demo-1", productnumber: "DOM-TLB120", name: "TEMPRA TLB 120", price: 829, description: "LiFePO4 120 Ah" },
  { productid: "demo-2", productnumber: "DOM-DPSI1500", name: "DPSI 1500 TS", price: 1149, description: "Sinus-Wechselrichter 1500 W" },
  { productid: "demo-3", productnumber: "DOM-MT180", name: "MT 180 Solar", price: 299, description: "Solarmodul 180 W" },
  { productid: "demo-4", productnumber: "DOM-MPP", name: "MPP Laderegler", price: 189, description: "MPPT-Solarladeregler" },
  { productid: "demo-5", productnumber: "DOM-BOOST", name: "PowerCharger Booster", price: 259, description: "Ladebooster 30 A" },
];

/** Mock-Implementierung: erstellt nichts, liefert Demo-Daten. */
export class MockQuoteService implements IQuoteService {
  async getProducts(): Promise<Product[]> {
    return DEMO_PRODUCTS.map((p) => ({ ...p }));
  }

  async searchCustomers(term: string): Promise<CustomerSearchResult[]> {
    const q = term.toLowerCase();
    const demo: CustomerSearchResult[] = [
      { id: "demo-acc-1", type: "account", name: "Musterreisen GmbH", email: "info@musterreisen.de", phone: "+49 30 1234567" },
      { id: "demo-con-1", type: "contact", name: "Max Mustermann", email: "max@example.com", phone: "+49 171 1234567" },
    ];
    return demo.filter((c) => c.name.toLowerCase().includes(q));
  }

  async createCustomer(input: NewCustomerInput): Promise<CustomerSearchResult> {
    return {
      id: `demo-new-${Date.now()}`,
      type: input.kind === "company" ? "account" : "contact",
      name: input.name,
      email: input.email,
      phone: input.phone,
    };
  }

  async createQuote(input: CreateQuoteInput): Promise<QuoteResult> {
    return { quoteId: "demo", name: input.name, demo: true };
  }
}

let instanz: IQuoteService | undefined;

/** Liefert die (prozessweite) Angebots-Service-Instanz gemäß Modus. */
export function getQuoteService(): IQuoteService {
  if (!instanz) {
    instanz = istDemoModus()
      ? new MockQuoteService()
      : new DataverseQuoteService();
  }
  return instanz;
}
