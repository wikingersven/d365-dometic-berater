"""Azure Function: Foundry Responses API Relay for Dometic Bordelektrik-Berater.

Dynamically loads country-specific knowledge (brand catalog, regulations)
from GitHub-hosted markdown files at runtime.

Uses the proven Foundry Responses API pattern (urllib.request + azure-identity).
NO azure-ai-projects SDK needed — minimal dependencies.
"""
import json
import logging
import os
import time
import urllib.request
import urllib.error
import urllib.parse
import azure.functions as func
from azure.identity import DefaultAzureCredential

# Cached credential + token
_credential = DefaultAzureCredential()
_token_cache = {"token": None, "expires_on": 0}

# Knowledge cache: {url: {"content": str, "fetched_at": float}}
_knowledge_cache = {}
CACHE_TTL = 300  # 5 min cache for GitHub files

# GitHub raw base URL (set via env or default)
GITHUB_RAW_BASE = os.environ.get(
    "KNOWLEDGE_BASE_URL",
    "https://raw.githubusercontent.com/wikingersven/dometicagent/main/knowledge"
)

# Countries config (loaded once, cached)
_countries_config = None

# CORS headers
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def _bearer_token():
    if _token_cache["expires_on"] > time.time() + 60:
        return _token_cache["token"]
    token = _credential.get_token("https://ai.azure.com/.default")
    _token_cache.update(token=token.token, expires_on=token.expires_on)
    return token.token


def _fetch_github(path, timeout=10):
    """Fetch a file from the GitHub knowledge repo with caching."""
    url = "%s/%s" % (GITHUB_RAW_BASE.rstrip("/"), path.lstrip("/"))
    now = time.time()
    cached = _knowledge_cache.get(url)
    if cached and now - cached["fetched_at"] < CACHE_TTL:
        return cached["content"]

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DometicBerater/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read().decode("utf-8")
        _knowledge_cache[url] = {"content": content, "fetched_at": now}
        return content
    except Exception as e:
        logging.warning("Failed to fetch %s: %s", url, e)
        # Return cached version even if expired
        if cached:
            return cached["content"]
        return None


def _get_countries_config():
    """Load countries.json from GitHub (cached)."""
    global _countries_config
    if _countries_config is not None:
        return _countries_config
    raw = _fetch_github("countries.json")
    if raw:
        _countries_config = json.loads(raw)
    return _countries_config


def _build_knowledge(country_code):
    """Build country-specific knowledge string from GitHub markdown files."""
    config = _get_countries_config()
    if not config:
        logging.error("Could not load countries.json")
        return ""

    country_code = country_code.upper()
    country = config.get("countries", {}).get(country_code)
    if not country:
        logging.warning("Unknown country: %s, falling back to DE", country_code)
        country = config["countries"]["DE"]
        country_code = "DE"

    brand_key = country["brand"]
    reg_key = country["regulations"]
    lang = country["lang"]

    brand_info = config.get("brands", {}).get(brand_key, {})
    reg_info = config.get("regulations", {}).get(reg_key, {})

    # Fetch files
    parts = []

    # Brand catalog
    catalog_path = brand_info.get("catalog", "brands/dometic.md")
    catalog = _fetch_github(catalog_path)
    if catalog:
        parts.append("# PRODUKTKATALOG: %s\n\n%s" % (brand_info.get("name", brand_key), catalog))

    # Regulations
    reg_path = reg_info.get("file", "regulations/eu_default.md")
    regs = _fetch_github(reg_path)
    if regs:
        parts.append(regs)

    # Shared knowledge (always included)
    for shared_file in ["shared/dimensionierung.md", "shared/verbraucher-katalog.md"]:
        content = _fetch_github(shared_file)
        if content:
            parts.append(content)

    # Context header
    lang_names = config.get("languages", {})
    lang_full = lang_names.get(lang, lang)
    header = (
        "# BERATUNGSKONTEXT\n"
        "- Land / Country: %s (%s)\n"
        "- Marke / Brand: %s\n"
        "- Sprache / Language: %s\n"
        "- Währung / Currency: %s\n"
        "- Regelwerk / Regulations: %s\n"
    ) % (
        country.get("nameEN", country_code), country_code,
        brand_info.get("name", brand_key),
        lang_full,
        country.get("currency", "EUR"),
        reg_info.get("name", reg_key),
    )

    # Explicit language instruction (must come right after the context header,
    # before the knowledge content)
    lang_instruction = (
        "# SPRACHE / LANGUAGE (WICHTIG / IMPORTANT)\n"
        "Antworte AUSSCHLIESSLICH auf %s. Die gesamte Beratung, alle Erklärungen, "
        "Tabellen-Überschriften und Hinweise müssen auf %s formuliert sein. "
        "Produktnamen, Modellnummern und technische Einheiten bleiben unverändert.\n"
        "Respond EXCLUSIVELY in %s. The entire consultation, all explanations, "
        "table headers and notes must be written in %s. Product names, model "
        "numbers and technical units remain unchanged.\n"
    ) % (lang_full, lang_full, lang_full, lang_full)

    return header + "\n" + lang_instruction + "\n---\n\n" + "\n\n---\n\n".join(parts)


def _foundry(method, path, body=None, versioned=True, timeout=90):
    endpoint = os.environ["FOUNDRY_PROJECT_ENDPOINT"].rstrip("/")
    api_version = os.environ.get("FOUNDRY_API_VERSION", "v1")
    if versioned:
        url = "%s%s?api-version=%s" % (endpoint, path, urllib.parse.quote(api_version))
    else:
        url = "%s%s" % (endpoint, path)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer %s" % _bearer_token(),
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else {}


def _run_agent(messages, country_code="DE"):
    """Foundry Responses API — with dynamic country-specific knowledge."""
    knowledge = _build_knowledge(country_code)

    input_items = []
    if knowledge:
        input_items.append({
            "type": "message", "role": "system",
            "content": knowledge,
        })
    input_items.extend(
        {"type": "message", "role": m["role"], "content": m["content"]}
        for m in messages
    )
    body = {
        "input": input_items,
        "store": False,
        "agent_reference": {
            "name": os.environ["FOUNDRY_AGENT_ID"].strip(),
            "type": "agent_reference",
        },
    }
    result = _foundry("POST", "/openai/v1/responses", body,
                      versioned=False, timeout=90)

    # Extract text from output
    texts = []
    for item in result.get("output") or []:
        if item.get("type") != "message":
            continue
        for block in item.get("content") or []:
            if block.get("type") not in ("output_text", "text"):
                continue
            text = block.get("text")
            if isinstance(text, dict):
                text = text.get("value")
            if text:
                texts.append(text)
    return "\n".join(texts).strip()


def main(req: func.HttpRequest) -> func.HttpResponse:
    # CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=204, headers=CORS)

    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON"}),
            status_code=400,
            headers={**CORS, "Content-Type": "application/json"},
        )

    messages = body.get("messages", [])
    if not messages:
        return func.HttpResponse(
            json.dumps({"error": "No messages provided"}),
            status_code=400,
            headers={**CORS, "Content-Type": "application/json"},
        )

    # Country code from request (default: DE)
    country_code = body.get("country", "DE").upper()

    try:
        reply = _run_agent(messages, country_code=country_code)
        return func.HttpResponse(
            json.dumps({"reply": reply, "country": country_code}),
            status_code=200,
            headers={**CORS, "Content-Type": "application/json"},
        )
    except Exception as e:
        logging.exception("Agent call failed")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            headers={**CORS, "Content-Type": "application/json"},
        )
