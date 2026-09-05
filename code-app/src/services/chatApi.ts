// Anbindung an die Azure-Function (AI-Foundry-Agent-Proxy). Identisch zum
// Original-Frontend: POST { messages, country } -> { reply | message }.

import type { HistoryEntry } from "../models/types";

const API_URL =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined) ??
  "https://dometic-berater.azurewebsites.net/api/dometic-chat";

/**
 * Sendet den Konversationsverlauf an die Azure-Function und liefert die
 * Antwort des Agenten. Wirft bei HTTP-Fehlern eine Error-Instanz.
 */
export async function sendChat(
  messages: HistoryEntry[],
  country: string,
): Promise<string> {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, country }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = (await resp.json()) as { reply?: string; message?: string };
  return data.reply || data.message || "";
}
