// Leichtgewichtiger Markdown-zu-HTML-Renderer fuer die Agent-Antworten.
// 1:1 portiert aus dem Original-Frontend (renderMarkdown / escapeHtml).

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Horizontale Linien
  html = html.replace(
    /^(-{3,}|_{3,}|\*{3,})$/gm,
    '<hr style="border:none;border-top:1px solid #e5e5e5;margin:12px 0;">',
  );

  // Markdown-Pipe-Tabellen erkennen und umwandeln
  html = html.replace(/((?:^\|.+\|$\n?){2,})/gm, (tableBlock) => {
    const rows = tableBlock
      .trim()
      .split("\n")
      .filter((r) => r.trim());
    if (rows.length < 2) return tableBlock;

    const isSep = /^\|[\s\-:]+(\|[\s\-:]+)+\|?$/.test(rows[1]);
    const startData = isSep ? 2 : 1;
    const parseRow = (row: string) =>
      row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

    let out = '<table class="dom-result-table"><thead><tr>';
    parseRow(rows[0]).forEach((cell) => {
      out += `<th>${cell}</th>`;
    });
    out += "</tr></thead><tbody>";
    for (let i = startData; i < rows.length; i++) {
      out += "<tr>";
      parseRow(rows[i]).forEach((cell) => {
        out += `<td>${cell}</td>`;
      });
      out += "</tr>";
    }
    out += "</tbody></table>";
    return out;
  });

  // Ueberschriften
  html = html
    .replace(/^#### (.+)$/gm, '<h5 class="md-h4">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 class="md-h3">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h2">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h1">$1</h2>');

  // Fett & kursiv
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Nummerierte Listen
  html = html.replace(/((?:^\d+\.\s+.+$\n?){2,})/gm, (listBlock) => {
    const items = listBlock.trim().split("\n");
    let ol = '<ol class="md-ol">';
    items.forEach((item) => {
      ol += `<li>${item.replace(/^\d+\.\s+/, "")}</li>`;
    });
    ol += "</ol>";
    return ol;
  });

  // Aufzaehlungslisten
  html = html.replace(/((?:^- .+$\n?){1,})/gm, (listBlock) => {
    const items = listBlock.trim().split("\n");
    let ul = '<ul class="md-ul">';
    items.forEach((item) => {
      ul += `<li>${item.replace(/^- /, "")}</li>`;
    });
    ul += "</ul>";
    return ul;
  });

  // Absaetze / Zeilenumbrueche
  html = html.replace(/\n\n/g, "<br><br>");
  html = html.replace(/\n/g, "<br>");

  return html;
}
