// Angebots-Dialog: Modal zum Anlegen eines D365-Quotes nach der Beratung.
// Kunden-Suche/Neuanlage, vorbefüllte Positionen (aus der Agent-Antwort) und
// Erstellung von Quote + Positionen über den QuoteService.

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type {
  CustomerSearchResult,
  Lang,
  Product,
  QuoteLineItem,
  QuoteResult,
} from "../models/types";
import { tr } from "../models/translations";
import { getQuoteService } from "../services/QuoteService";

interface Props {
  lang: Lang;
  agentText: string;
  onClose: () => void;
}

let lineSeq = 0;
const nextKey = (): string => `line-${++lineSeq}`;

export function QuoteDialog({ lang, agentText, onClose }: Props): ReactNode {
  const t = tr(lang);
  const svc = useMemo(() => getQuoteService(), []);
  const money = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }),
    [lang],
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  // Bestehender Kunde
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CustomerSearchResult | null>(null);

  // Neuer Kunde
  const [kind, setKind] = useState<"company" | "person">("company");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [lines, setLines] = useState<QuoteLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Produkte laden + Positionen aus der Agent-Antwort vorbefüllen.
  useEffect(() => {
    let active = true;
    void svc.getProducts().then((ps) => {
      if (!active) return;
      setProducts(ps);
      const text = agentText.toLowerCase();
      const matched = ps.filter(
        (p) => p.name && text.includes(p.name.toLowerCase()),
      );
      const src = matched.length > 0 ? matched : ps.slice(0, 1);
      setLines(
        src.map((p) => ({
          key: nextKey(),
          productId: p.productid,
          quantity: 1,
          pricePerUnit: p.price,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [svc, agentText]);

  // Debounced Kunden-Suche (300 ms).
  useEffect(() => {
    if (mode !== "existing") return;
    const q = term.trim();
    const id = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      void svc
        .searchCustomers(q)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(id);
  }, [term, mode, svc]);

  const grandTotal = lines.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);

  const updateLine = (key: string, patch: Partial<QuoteLineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        productId: products[0]?.productid ?? "",
        quantity: 1,
        pricePerUnit: products[0]?.price ?? 0,
      },
    ]);

  const onProductChange = (key: string, productId: string) => {
    const p = products.find((x) => x.productid === productId);
    updateLine(key, { productId, pricePerUnit: p?.price ?? 0 });
  };

  const submit = async () => {
    setErrorMsg("");
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setErrorMsg(t.quoteNoLines);
      return;
    }
    setSubmitting(true);
    try {
      let customer = selected;
      if (mode === "new") {
        if (!newName.trim()) {
          setErrorMsg(t.quoteNoCustomer);
          setSubmitting(false);
          return;
        }
        customer = await svc.createCustomer({
          kind,
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
        });
      }
      if (!customer) {
        setErrorMsg(t.quoteNoCustomer);
        setSubmitting(false);
        return;
      }
      const res = await svc.createQuote({
        name: `Dometic Bordelektrik - ${customer.name}`,
        customer: { id: customer.id, type: customer.type },
        lines: validLines,
      });
      setResult(res);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="dom-modal-overlay" onClick={onClose}>
      <div className="dom-modal" onClick={stop}>
        <div className="dom-modal-header">
          <h2>{t.quoteTitle}</h2>
          <button
            className="dom-modal-close"
            onClick={onClose}
            aria-label={t.quoteCancel}
          >
            ✕
          </button>
        </div>

        {result ? (
          <div className="dom-modal-body">
            <div className="dom-quote-success">
              <div className="dom-quote-success-icon">✓</div>
              <p className="dom-quote-success-msg">
                {result.demo
                  ? t.quoteDemo
                  : `${t.quoteSuccess} ${result.name}`}
              </p>
              {result.url && (
                <a
                  className="dom-btn-pdf"
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.quoteOpenInD365}
                </a>
              )}
            </div>
            <div className="dom-modal-footer">
              <button className="dom-btn-send" onClick={onClose}>
                {t.quoteCancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="dom-modal-body">
            <section className="dom-quote-section">
              <h3>{t.quoteCustomer}</h3>
              <div className="dom-quote-toggle">
                <button
                  className={mode === "existing" ? "active" : ""}
                  onClick={() => setMode("existing")}
                >
                  {t.quoteExisting}
                </button>
                <button
                  className={mode === "new" ? "active" : ""}
                  onClick={() => setMode("new")}
                >
                  {t.quoteNew}
                </button>
              </div>

              {mode === "existing" ? (
                <div className="dom-quote-search">
                  <input
                    type="text"
                    value={selected ? selected.name : term}
                    placeholder={t.quoteSearch}
                    onChange={(e) => {
                      setSelected(null);
                      setTerm(e.target.value);
                    }}
                  />
                  {searching && <div className="dom-quote-search-hint">…</div>}
                  {!selected && results.length > 0 && (
                    <ul className="dom-quote-results">
                      {results.map((r) => (
                        <li
                          key={`${r.type}-${r.id}`}
                          onClick={() => {
                            setSelected(r);
                            setResults([]);
                          }}
                        >
                          <span className="dom-quote-result-name">
                            {r.name}
                          </span>
                          <span className="dom-quote-result-meta">
                            {r.type === "account"
                              ? t.quoteCompany
                              : t.quotePerson}
                            {r.email ? ` · ${r.email}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="dom-quote-newcustomer">
                  <div className="dom-quote-toggle">
                    <button
                      className={kind === "company" ? "active" : ""}
                      onClick={() => setKind("company")}
                    >
                      {t.quoteCompany}
                    </button>
                    <button
                      className={kind === "person" ? "active" : ""}
                      onClick={() => setKind("person")}
                    >
                      {t.quotePerson}
                    </button>
                  </div>
                  <label>
                    {t.quoteName}
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label>
                    {t.quoteEmail}
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    {t.quotePhone}
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="dom-quote-section">
              <table className="dom-quote-table">
                <thead>
                  <tr>
                    <th>{t.quoteProduct}</th>
                    <th>{t.quoteQty}</th>
                    <th>{t.quotePrice}</th>
                    <th>{t.quoteTotal}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.key}>
                      <td>
                        <select
                          value={l.productId}
                          onChange={(e) =>
                            onProductChange(l.key, e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {products.map((p) => (
                            <option key={p.productid} value={p.productid}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.key, {
                              quantity: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.pricePerUnit}
                          onChange={(e) =>
                            updateLine(l.key, {
                              pricePerUnit: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="dom-quote-linetotal">
                        {money.format(l.quantity * l.pricePerUnit)}
                      </td>
                      <td>
                        <button
                          className="dom-quote-del"
                          onClick={() => removeLine(l.key)}
                          aria-label="✕"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dom-quote-tablefoot">
                <button className="dom-btn-pdf" onClick={addLine}>
                  + {t.quoteAddLine}
                </button>
                <span className="dom-quote-grandtotal">
                  {t.quoteGrandTotal}: {money.format(grandTotal)}
                </span>
              </div>
            </section>

            {errorMsg && (
              <div className="dom-quote-error">
                {t.quoteError}: {errorMsg}
              </div>
            )}

            <div className="dom-modal-footer">
              <button
                className="dom-btn-send"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? "…" : t.quoteSubmit}
              </button>
              <button className="dom-quote-cancel" onClick={onClose}>
                {t.quoteCancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
