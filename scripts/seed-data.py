"""Create lookups and seed all Dometic Berater data into Powerbusters Dataverse."""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

# === Auth ===
SPN_CACHE = os.path.expanduser("~/.local/share/Microsoft/PowerAppsCli/pac.spn.cache.fallback.dat")
AUTH_PROFILES = os.path.expanduser("~/.local/share/Microsoft/PowerAppsCli/authprofiles_v2.json")
spn = json.load(open(SPN_CACHE))
CLIENT_ID = list(spn.keys())[0]
CLIENT_SECRET = spn[CLIENT_ID]
profiles = json.load(open(AUTH_PROFILES))
pb = [p for p in profiles["Profiles"] if "smitpowerbusters" in p["Resource"]][0]
TENANT_ID = pb["TenantId"]
CRM_URL = pb["Resource"].rstrip("/")
API = f"{CRM_URL}/api/data/v9.2"
SOLUTION = "pbdometicberater"

def get_token():
    data = urllib.parse.urlencode({
        "grant_type": "client_credentials", "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET, "scope": f"{CRM_URL}/.default",
    }).encode()
    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token",
        data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())["access_token"]

TOKEN = get_token()
H = {
    "Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
    "OData-MaxVersion": "4.0", "OData-Version": "4.0",
    "Prefer": "return=representation",
}

def api(method, path, body=None, timeout=120, extra_headers=None):
    url = path if path.startswith("http") else f"{API}/{path}"
    data = json.dumps(body).encode() if body else None
    headers = dict(H)
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if e.code == 429:
            print(f"    429 throttled, waiting 60s...")
            time.sleep(60)
            return api(method, path, body, timeout, extra_headers)
        if e.code == 412:  # duplicate
            return None
        raise Exception(f"HTTP {e.code}: {err[:300]}")

def query(entity_set, select="", filter_str="", expand=""):
    params = {}
    if select: params["$select"] = select
    if filter_str: params["$filter"] = filter_str
    if expand: params["$expand"] = expand
    qs = urllib.parse.urlencode(params, quote_via=urllib.parse.quote) if params else ""
    url = f"{entity_set}?{qs}" if qs else entity_set
    return api("GET", url).get("value", [])

def create_record(entity_set, body):
    return api("POST", entity_set, body, extra_headers={"MSCRM.SolutionUniqueName": SOLUTION})

# ============================================================
# 1. LOOKUPS
# ============================================================
print("=== 1. Creating lookup relationships ===")

def attr_exists(entity, attr):
    try:
        api("GET", f"EntityDefinitions(LogicalName='{entity}')/Attributes(LogicalName='{attr}')")
        return True
    except:
        return False

def create_lookup(primary, related, schema, label):
    logical = schema.lower()
    if attr_exists(related, logical):
        print(f"  ✓ {logical} exists on {related}")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
        "SchemaName": schema,
        "ReferencedEntity": primary,
        "ReferencingEntity": related,
        "Lookup": {
            "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
            "SchemaName": schema,
            "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
            ]},
            "RequiredLevel": {"Value": "None"},
        },
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(f"{API}/RelationshipDefinitions",
        data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=120)
        print(f"  ✓ {schema} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if "already" in err.lower() or "Duplicate" in err:
            print(f"  ✓ {schema} already exists")
        else:
            print(f"  ✗ {schema}: {err[:200]}")
    time.sleep(3)

create_lookup("pb_dometicbrand", "pb_dometiccountry", "pb_Brand", "Marke")
create_lookup("pb_dometicregulation", "pb_dometiccountry", "pb_Regulation", "Regelwerk")
create_lookup("pb_dometiccategory", "pb_dometicconsumer", "pb_Category", "Kategorie")

# Publish
print("  Publishing...")
try:
    req = urllib.request.Request(f"{API}/PublishAllXml", data=b"{}", method="POST", headers=H)
    urllib.request.urlopen(req, timeout=600)
    print("  ✓ Published")
except Exception as e:
    print(f"  Publish: {e} (may still be processing)")

# ============================================================
# 2. SEED DATA
# ============================================================
print("\n=== 2. Seeding data ===")

# --- Brands ---
print("\n  Brands...")
brands_data = [
    {"pb_name": "Büttner Elektronik / Dometic", "pb_key": "buettner", "pb_catalogfile": "brands/buettner.md"},
    {"pb_name": "NDS Energy / Dometic", "pb_key": "nds", "pb_catalogfile": "brands/nds.md"},
    {"pb_name": "Dometic", "pb_key": "dometic", "pb_catalogfile": "brands/dometic.md"},
]
existing_brands = query("pb_dometicbrands", "pb_name,pb_key,pb_dometicbrandid")
brand_map = {b["pb_key"]: b["pb_dometicbrandid"] for b in existing_brands}
for b in brands_data:
    if b["pb_key"] in brand_map:
        print(f"    ✓ {b['pb_key']} exists")
    else:
        r = create_record("pb_dometicbrands", b)
        if r:
            brand_map[b["pb_key"]] = r["pb_dometicbrandid"]
            print(f"    + {b['pb_key']}")
        else:
            print(f"    ✗ {b['pb_key']} failed")

# --- Regulations ---
print("\n  Regulations...")
regs_data = [
    {"pb_name": "DIN VDE / EN 1648", "pb_key": "dach", "pb_file": "regulations/dach.md"},
    {"pb_name": "NF C15-100 / EN 1648", "pb_key": "fr", "pb_file": "regulations/fr.md"},
    {"pb_name": "BS 7671 / EN 1648", "pb_key": "bs", "pb_file": "regulations/bs.md"},
    {"pb_name": "CEI 64-8 / EN 1648", "pb_key": "cei", "pb_file": "regulations/cei.md"},
    {"pb_name": "NEK 400 / SS 436 / EN 1648", "pb_key": "nordic", "pb_file": "regulations/nordic.md"},
    {"pb_name": "AREI / EN 1648", "pb_key": "arei", "pb_file": "regulations/arei.md"},
    {"pb_name": "NEN 1010 / EN 1648", "pb_key": "nen", "pb_file": "regulations/nen.md"},
    {"pb_name": "REBT / EN 1648", "pb_key": "rebt", "pb_file": "regulations/rebt.md"},
    {"pb_name": "HD 60364 / EN 1648 (EU default)", "pb_key": "eu_default", "pb_file": "regulations/eu_default.md"},
]
existing_regs = query("pb_dometicregulations", "pb_name,pb_key,pb_dometicregulationid")
reg_map = {r["pb_key"]: r["pb_dometicregulationid"] for r in existing_regs}
for r in regs_data:
    if r["pb_key"] in reg_map:
        print(f"    ✓ {r['pb_key']} exists")
    else:
        res = create_record("pb_dometicregulations", r)
        if res:
            reg_map[r["pb_key"]] = res["pb_dometicregulationid"]
            print(f"    + {r['pb_key']}")

# --- Categories ---
print("\n  Categories...")
cats_data = [
    {"pb_name": "Mobile Kühlboxen", "pb_categoryid": "A", "pb_namede": "Mobile Kühlboxen", "pb_nameen": "Mobile Coolers", "pb_namefr": "Glacières mobiles", "pb_sortorder": 1},
    {"pb_name": "Einbau-Kühlschränke", "pb_categoryid": "B", "pb_namede": "Einbau-Kühlschränke", "pb_nameen": "Built-in Fridges", "pb_namefr": "Réfrigérateurs encastrés", "pb_sortorder": 2},
    {"pb_name": "Klimaanlagen", "pb_categoryid": "C", "pb_namede": "Klimaanlagen", "pb_nameen": "Air Conditioning", "pb_namefr": "Climatiseurs", "pb_sortorder": 3},
    {"pb_name": "Sanitär & Wasser", "pb_categoryid": "D", "pb_namede": "Sanitär & Wasser", "pb_nameen": "Sanitation & Water", "pb_namefr": "Sanitaire & eau", "pb_sortorder": 4},
    {"pb_name": "Bordtechnik & Komfort", "pb_categoryid": "E", "pb_namede": "Bordtechnik & Komfort", "pb_nameen": "Onboard Tech & Comfort", "pb_namefr": "Technique de bord & confort", "pb_sortorder": 5},
]
existing_cats = query("pb_dometiccategories", "pb_name,pb_categoryid,pb_dometiccategoryid")
cat_map = {c["pb_categoryid"]: c["pb_dometiccategoryid"] for c in existing_cats}
for c in cats_data:
    if c["pb_categoryid"] in cat_map:
        print(f"    ✓ {c['pb_categoryid']} exists")
    else:
        res = create_record("pb_dometiccategories", c)
        if res:
            cat_map[c["pb_categoryid"]] = res["pb_dometiccategoryid"]
            print(f"    + {c['pb_categoryid']} {c['pb_namede']}")

# --- Countries (30) ---
print("\n  Countries...")
# Lang: de=100000000, en=100000001, fr=100000002
# Regions: DACH=0, Nordics=1, Benelux=2, WesternEurope=3, SouthernEurope=4,
#          UKIreland=5, CentralEurope=6, SoutheastEurope=7, Baltics=8
LANG = {"de": 100000000, "en": 100000001, "fr": 100000002}
RG = {"DACH": 100000000, "Nordics": 100000001, "Benelux": 100000002,
      "Western": 100000003, "Southern": 100000004, "UK": 100000005,
      "Central": 100000006, "Southeast": 100000007, "Baltics": 100000008}

countries_raw = [
    ("DE", "Deutschland", "Germany", "🇩🇪", "de", "EUR", "DACH", "buettner", "dach"),
    ("AT", "Österreich", "Austria", "🇦🇹", "de", "EUR", "DACH", "buettner", "dach"),
    ("CH", "Schweiz", "Switzerland", "🇨🇭", "de", "CHF", "DACH", "buettner", "dach"),
    ("IT", "Italia", "Italy", "🇮🇹", "en", "EUR", "Southern", "nds", "cei"),
    ("FR", "France", "France", "🇫🇷", "fr", "EUR", "Western", "dometic", "fr"),
    ("BE", "Belgique", "Belgium", "🇧🇪", "fr", "EUR", "Benelux", "nds", "arei"),
    ("NL", "Nederland", "Netherlands", "🇳🇱", "en", "EUR", "Benelux", "nds", "nen"),
    ("LU", "Luxembourg", "Luxembourg", "🇱🇺", "fr", "EUR", "Benelux", "nds", "arei"),
    ("DK", "Danmark", "Denmark", "🇩🇰", "en", "DKK", "Nordics", "dometic", "nordic"),
    ("SE", "Sverige", "Sweden", "🇸🇪", "en", "SEK", "Nordics", "dometic", "nordic"),
    ("NO", "Norge", "Norway", "🇳🇴", "en", "NOK", "Nordics", "dometic", "nordic"),
    ("FI", "Suomi", "Finland", "🇫🇮", "en", "EUR", "Nordics", "dometic", "nordic"),
    ("ES", "España", "Spain", "🇪🇸", "en", "EUR", "Western", "dometic", "rebt"),
    ("PT", "Portugal", "Portugal", "🇵🇹", "en", "EUR", "Western", "dometic", "rebt"),
    ("GB", "United Kingdom", "United Kingdom", "🇬🇧", "en", "GBP", "UK", "dometic", "bs"),
    ("IE", "Ireland", "Ireland", "🇮🇪", "en", "EUR", "UK", "dometic", "bs"),
    ("PL", "Polska", "Poland", "🇵🇱", "en", "PLN", "Central", "dometic", "eu_default"),
    ("CZ", "Česko", "Czech Republic", "🇨🇿", "en", "CZK", "Central", "dometic", "eu_default"),
    ("SK", "Slovensko", "Slovakia", "🇸🇰", "en", "EUR", "Central", "dometic", "eu_default"),
    ("HU", "Magyarország", "Hungary", "🇭🇺", "en", "HUF", "Central", "dometic", "eu_default"),
    ("RO", "România", "Romania", "🇷🇴", "en", "RON", "Southeast", "dometic", "eu_default"),
    ("BG", "България", "Bulgaria", "🇧🇬", "en", "BGN", "Southeast", "dometic", "eu_default"),
    ("HR", "Hrvatska", "Croatia", "🇭🇷", "en", "EUR", "Southeast", "dometic", "eu_default"),
    ("SI", "Slovenija", "Slovenia", "🇸🇮", "en", "EUR", "Southeast", "dometic", "eu_default"),
    ("EE", "Eesti", "Estonia", "🇪🇪", "en", "EUR", "Baltics", "dometic", "eu_default"),
    ("LV", "Latvija", "Latvia", "🇱🇻", "en", "EUR", "Baltics", "dometic", "eu_default"),
    ("LT", "Lietuva", "Lithuania", "🇱🇹", "en", "EUR", "Baltics", "dometic", "eu_default"),
    ("GR", "Ελλάδα", "Greece", "🇬🇷", "en", "EUR", "Southern", "dometic", "eu_default"),
    ("CY", "Κύπρος", "Cyprus", "🇨🇾", "en", "EUR", "Southern", "dometic", "eu_default"),
    ("MT", "Malta", "Malta", "🇲🇹", "en", "EUR", "Southern", "dometic", "eu_default"),
]

existing_countries = query("pb_dometiccountries", "pb_code,pb_dometiccountryid")
country_codes = {c["pb_code"] for c in existing_countries}
created = 0
for code, name, nameen, flag, lang, curr, region, brand_key, reg_key in countries_raw:
    if code in country_codes:
        print(f"    ✓ {code}")
        continue
    body = {
        "pb_name": name, "pb_code": code, "pb_nameen": nameen,
        "pb_flagemoji": flag, "pb_lang": LANG[lang], "pb_currency": curr,
        "pb_regiongroup": RG[region],
    }
    if brand_key in brand_map:
        body["pb_Brand@odata.bind"] = f"/pb_dometicbrands({brand_map[brand_key]})"
    if reg_key in reg_map:
        body["pb_Regulation@odata.bind"] = f"/pb_dometicregulations({reg_map[reg_key]})"
    try:
        create_record("pb_dometiccountries", body)
        print(f"    + {code} {name}")
        created += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ {code}: {e}")
print(f"  Countries: {created} created, {len(country_codes)} existed")

# --- Consumers (48) ---
print("\n  Consumers...")
consumers_raw = [
    ("A1", "A", "CFX3 25", "CFX3 25", 250, 0, False, None, 1),
    ("A2", "A", "CFX3 35", "CFX3 35", 300, 0, False, None, 2),
    ("A3", "A", "CFX3 45", "CFX3 45", 370, 0, False, None, 3),
    ("A4", "A", "CFX3 55", "CFX3 55", 390, 0, False, None, 4),
    ("A5", "A", "CFX3 55IM", "CFX3 55IM", 443, 0, False, None, 5),
    ("A6", "A", "CFX3 75DZ", "CFX3 75DZ", 500, 0, False, None, 6),
    ("A7", "A", "CFX3 95DZ", "CFX3 95DZ", 650, 0, False, None, 7),
    ("A8", "A", "CFF 35", "CFF 35", 300, 0, False, None, 8),
    ("A9", "A", "CFF 45", "CFF 45", 350, 0, False, None, 9),
    ("B1", "B", "NRX 35C", "NRX 35C", 250, 0, False, "Kompressor / Compressor", 1),
    ("B2", "B", "NRX 50C", "NRX 50C", 300, 0, False, "Kompressor / Compressor", 2),
    ("B3", "B", "NRX 60C", "NRX 60C", 350, 0, False, "Kompressor / Compressor", 3),
    ("B4", "B", "NRX 80C", "NRX 80C", 350, 0, False, "Kompressor / Compressor", 4),
    ("B5", "B", "NRX 115", "NRX 115", 400, 0, False, "Kompressor / Compressor", 5),
    ("B6", "B", "NRX 130", "NRX 130", 500, 0, False, "Kompressor / Compressor", 6),
    ("B7", "B", "NRX 90V", "NRX 90V", 400, 0, False, "Kompressor / Compressor", 7),
    ("B8", "B", "RC 10.4 90", "RC 10.4 90", 400, 0, False, "Kompressor / Compressor", 8),
    ("B9", "B", "RCL 10.4ET", "RCL 10.4ET", 450, 0, False, "Kompressor / Compressor", 9),
    ("B10", "B", "RCD 10.5T", "RCD 10.5T", 500, 0, False, "Kompressor / Compressor", 10),
    ("B11", "B", "RCD 10.5XT", "RCD 10.5XT", 650, 0, False, "Kompressor / Compressor", 11),
    ("B12", "B", "RMS 10.5T", "RMS 10.5T", 120, 0, False, "Absorber / Absorption (Gas)", 12),
    ("B13", "B", "RM 10.5T", "RM 10.5T", 120, 0, False, "Absorber / Absorption (Gas)", 13),
    ("B14", "B", "RMD 10.5XT", "RMD 10.5XT", 120, 0, False, "Absorber / Absorption (Gas)", 14),
    ("C1", "C", "FreshJet FJX4 1500M", "FreshJet FJX4 1500M", 2500, 750, True, None, 1),
    ("C2", "C", "FreshJet FJX4 1700", "FreshJet FJX4 1700", 3000, 850, True, None, 2),
    ("C3", "C", "FreshJet FJX4 2200", "FreshJet FJX4 2200", 3500, 1000, True, None, 3),
    ("C4", "C", "FreshJet FJX7", "FreshJet FJX7", 3000, 1700, True, None, 4),
    ("C5", "C", "CoolAir RTX 1000", "CoolAir RTX 1000", 2000, 250, False, None, 5),
    ("C6", "C", "CoolAir RTX 2000", "CoolAir RTX 2000", 3500, 700, False, None, 6),
    ("D1", "D", "CTS 4110 Kassettentoilette", "CTS 4110 Cassette Toilet", 5, 0, False, None, 1),
    ("D2", "D", "MasterFlush MF 7100", "MasterFlush MF 7100", 15, 200, False, None, 2),
    ("D3", "D", "Druckwasserpumpe", "Pressure water pump", 8, 0, False, None, 3),
    ("D4", "D", "Warmwasserboiler 230V", "Water heater 230V", 500, 1300, True, None, 4),
    ("D5", "D", "Tankheizung 12V", "Tank heater 12V", 250, 0, False, None, 5),
    ("E1", "E", "LED-Beleuchtung", "LED lighting", 70, 0, False, "12 V", 1),
    ("E2", "E", "Dachlüfter", "Roof fan", 60, 0, False, "12 V", 2),
    ("E3", "E", "Heizungsgebläse", "Heater blower", 200, 0, False, "12 V", 3),
    ("E4", "E", "WLAN-Router", "WiFi router", 190, 0, False, "12 V", 4),
    ("E5", "E", "TV + SAT", "TV + SAT", 100, 0, False, "12 V", 5),
    ("E6", "E", "Handy laden", "Phone charging", 15, 0, False, "12 V", 6),
    ("E7", "E", "Laptop laden", "Laptop charging", 90, 0, False, "12 V", 7),
    ("E8", "E", "CPAP", "CPAP", 320, 0, False, "12 V", 8),
    ("E9", "E", "Kaffeemaschine", "Coffee machine", 122, 1500, True, "230 V · Wechselrichter / Inverter", 9),
    ("E10", "E", "Wasserkocher", "Kettle", 278, 2000, True, "230 V · Wechselrichter / Inverter", 10),
    ("E11", "E", "Induktionsplatte", "Induction hob", 889, 2000, True, "230 V · Wechselrichter / Inverter", 11),
    ("E12", "E", "Mikrowelle", "Microwave", 244, 1560, True, "230 V · Wechselrichter / Inverter", 12),
    ("E13", "E", "Fön", "Hair dryer", 100, 2000, True, "230 V · Wechselrichter / Inverter", 13),
    ("E14", "E", "E-Bike laden", "E-bike charging", 611, 250, True, "230 V · Wechselrichter / Inverter", 14),
]

existing_consumers = query("pb_dometicconsumers", "pb_consumerid,pb_dometicconsumerid")
consumer_ids = {c["pb_consumerid"] for c in existing_consumers}
created = 0
for cid, cat, name, nameen, wh, peak, is230v, sub, sort in consumers_raw:
    if cid in consumer_ids:
        print(f"    ✓ {cid}")
        continue
    body = {
        "pb_name": name, "pb_nameen": nameen, "pb_consumerid": cid,
        "pb_wh": wh, "pb_peak": peak, "pb_is230v": is230v,
        "pb_sortorder": sort,
    }
    if sub:
        body["pb_subcategory"] = sub
    if cat in cat_map:
        body["pb_Category@odata.bind"] = f"/pb_dometiccategories({cat_map[cat]})"
    try:
        create_record("pb_dometicconsumers", body)
        print(f"    + {cid} {name}")
        created += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"    ✗ {cid}: {e}")
print(f"  Consumers: {created} created, {len(consumer_ids)} existed")

# ============================================================
# 3. VERIFY
# ============================================================
print("\n=== 3. Verification ===")
for entity, expected in [
    ("pb_dometicbrands", 3), ("pb_dometicregulations", 9),
    ("pb_dometiccountries", 30), ("pb_dometiccategories", 5),
    ("pb_dometicconsumers", 48),
]:
    count = len(query(entity, "pb_name"))
    status = "✓" if count >= expected else "✗"
    print(f"  {status} {entity}: {count}/{expected}")

print("\n=== DONE ===")
