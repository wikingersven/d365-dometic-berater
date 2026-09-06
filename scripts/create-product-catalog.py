"""Create Dometic product catalog + price list on Powerbusters CE Dataverse.

Products from agent-knowledge/produktkatalog.md → D365 product records + price list items.
Uses the same SPN auth as seed-data.py.
"""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

# === Auth (same as seed-data.py) ===
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
        raise Exception(f"HTTP {e.code}: {err[:500]}")

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
# 1. GET DEFAULT UNIT GROUP + UNIT (Stück / Each)
# ============================================================
print("=== 1. Unit of Measure ===")

# Find the default unit group
uom_groups = query("uomschedules", "uomscheduleid,name", "name eq 'Default Unit'")
if not uom_groups:
    # Try German
    uom_groups = query("uomschedules", "uomscheduleid,name")
    print(f"  Available UoM groups: {[g['name'] for g in uom_groups]}")

if uom_groups:
    UOM_GROUP_ID = uom_groups[0]["uomscheduleid"]
    print(f"  ✓ UoM Group: {uom_groups[0]['name']} ({UOM_GROUP_ID})")
else:
    print("  ✗ No UoM group found!")
    sys.exit(1)

# Find the primary unit in that group
uoms = query("uoms", "uomid,name", f"_uomscheduleid_value eq '{UOM_GROUP_ID}'")
print(f"  Available units: {[u['name'] for u in uoms]}")
UOM_ID = uoms[0]["uomid"]
UOM_NAME = uoms[0]["name"]
print(f"  ✓ Unit: {UOM_NAME} ({UOM_ID})")

# ============================================================
# 2. CREATE PRICE LIST
# ============================================================
print("\n=== 2. Price List ===")

PRICELIST_NAME = "Dometic Bordelektrik UVP 2026"
existing_pl = query("pricelevels", "pricelevelid,name", f"contains(name,'Dometic')")
if not existing_pl:
    existing_pl = query("pricelevels", "pricelevelid,name")
    print(f"  All price lists: {[p['name'] for p in existing_pl]}")
    existing_pl = [p for p in existing_pl if "Dometic" in p.get("name", "")]
if existing_pl:
    PRICELIST_ID = existing_pl[0]["pricelevelid"]
    print(f"  ✓ Price list exists: {PRICELIST_ID}")
else:
    pl = create_record("pricelevels", {
        "name": PRICELIST_NAME,
        "description": "UVP/Listenpreise Dometic/Büttner/NDS Bordelektrik, Stand Messe 2026",
        "transactioncurrencyid@odata.bind": None,  # will set below
    })
    # Need to find EUR currency first
    currencies = query("transactioncurrencies", "transactioncurrencyid,isocurrencycode,currencyname")
    print(f"  Currencies: {[(c['isocurrencycode'], c['currencyname']) for c in currencies]}")
    eur = [c for c in currencies if c["isocurrencycode"] == "EUR"]
    if not eur:
        print("  ✗ No EUR currency found! Creating price list with org default...")
        pl = create_record("pricelevels", {
            "name": PRICELIST_NAME,
            "description": "UVP/Listenpreise Dometic/Büttner/NDS Bordelektrik, Stand Messe 2026",
        })
    else:
        EUR_ID = eur[0]["transactioncurrencyid"]
        print(f"  EUR currency: {EUR_ID}")
        pl = create_record("pricelevels", {
            "name": PRICELIST_NAME,
            "description": "UVP/Listenpreise Dometic/Büttner/NDS Bordelektrik, Stand Messe 2026",
            "transactioncurrencyid@odata.bind": f"/transactioncurrencies({EUR_ID})",
        })
    if pl:
        PRICELIST_ID = pl["pricelevelid"]
        print(f"  ✓ Price list created: {PRICELIST_ID}")
    else:
        print("  ✗ Price list creation failed!")
        sys.exit(1)

# ============================================================
# 3. CREATE PRODUCTS
# ============================================================
print("\n=== 3. Products ===")

# All products from produktkatalog.md
# Format: (productnumber, name, description, price, category)
PRODUCTS = [
    # 1. Lithium-Batterien (LiFePO4) – TEMPRA
    ("DOM-TLB100S", "TEMPRA TLB 100S", "LiFePO4 100 Ah, L3-Gehäuse, N-BUS+Bluetooth, 5J Garantie", 829.00, "Lithium-Batterien"),
    ("DOM-TLB100SF", "TEMPRA TLB 100SF", "LiFePO4 100 Ah, Heizung, L3-Gehäuse, betriebsfähig bis -30°C", 919.00, "Lithium-Batterien"),
    ("DOM-TLB120", "TEMPRA TLB 120", "LiFePO4 120 Ah, L5-Gehäuse 341×176×190mm", 1145.00, "Lithium-Batterien"),
    ("DOM-TLB120F", "TEMPRA TLB 120F", "LiFePO4 120 Ah, Heizung, L5-Gehäuse", 1235.00, "Lithium-Batterien"),
    ("DOM-TLB150", "TEMPRA TLB 150", "LiFePO4 150 Ah, L5-Gehäuse", 1310.00, "Lithium-Batterien"),
    ("DOM-TLB150F", "TEMPRA TLB 150F", "LiFePO4 150 Ah, Heizung, L5-Gehäuse", 1395.00, "Lithium-Batterien"),
    ("DOM-TLB540", "TEMPRA TLB 540", "LiFePO4 540 Ah, 366×345×190mm, 300A Dauer/400A Spitze, CI-BUS", 3740.00, "Lithium-Batterien"),
    ("DOM-TLB540F", "TEMPRA TLB 540F", "LiFePO4 540 Ah, Heizung, 366×345×190mm, Basis SmartECO/Klima", 3890.00, "Lithium-Batterien"),

    # 2. AGM-Batterien – NDS GreenPower
    ("DOM-GP100B", "NDS GreenPower GP 100B", "AGM 12V/100Ah, niedriges Profil, bis 1200 Zyklen", 299.00, "AGM-Batterien"),
    ("DOM-GP120", "NDS GreenPower GP 120", "AGM 12V/120Ah, bis 1200 Zyklen, lageunabhängig", 335.00, "AGM-Batterien"),
    ("DOM-GP150", "NDS GreenPower GP 150", "AGM 12V/150Ah, bis 1200 Zyklen, auslaufsicher", 475.00, "AGM-Batterien"),

    # 3. Ladebooster (DC/DC) – MT LB
    ("DOM-MTLB40", "MT LB 40", "Ladebooster 12→12V, 40A, OPTICHARGE, N-BUS", 395.00, "Ladebooster"),
    ("DOM-MTLB80", "MT LB 80", "Ladebooster 12→12V, 40/60/80A einstellbar, N-BUS", 499.00, "Ladebooster"),
    ("DOM-MTLB2412-40", "MT LB 24/12-40", "Ladebooster 24→12V, 40A, Lkw-Basis", 505.00, "Ladebooster"),
    ("DOM-MTLB2412-80", "MT LB 24/12-80", "Ladebooster 24→12V, 40/60/80A, Lkw", 471.00, "Ladebooster"),

    # 4. Sinus-Wechselrichter – DPSI (Basis)
    ("DOM-DPSI200", "DPSI 200", "Sinus-Wechselrichter 200W, 12/24V, N-BUS+CI-BUS", 139.00, "Wechselrichter"),
    ("DOM-DPSI400", "DPSI 400", "Sinus-Wechselrichter 400W, 12/24V", 149.00, "Wechselrichter"),
    ("DOM-DPSI600", "DPSI 600", "Sinus-Wechselrichter 600W, 12/24V", 335.00, "Wechselrichter"),
    ("DOM-DPSI1000", "DPSI 1000", "Sinus-Wechselrichter 1000W, 12/24V", 474.00, "Wechselrichter"),
    ("DOM-DPSI1500", "DPSI 1500", "Sinus-Wechselrichter 1500W, 12/24V", 655.00, "Wechselrichter"),
    ("DOM-DPSI2000", "DPSI 2000", "Sinus-Wechselrichter 2000W, 12/24V", 835.00, "Wechselrichter"),

    # DPSI RCD (mit Fehlerstromschutz)
    ("DOM-DPSI1500RCD", "DPSI 1500 RCD", "Sinus-Wechselrichter 1500W mit integriertem FI-Schutz", 780.00, "Wechselrichter"),
    ("DOM-DPSI2000RCD", "DPSI 2000 RCD", "Sinus-Wechselrichter 2000W mit integriertem FI-Schutz", 895.00, "Wechselrichter"),

    # DPSI TS (mit Netzvorrangschaltung)
    ("DOM-DPSI600TS", "DPSI 600 TS", "Sinus-WR 600W, 12V, Netzvorrangschaltung", 368.50, "Wechselrichter"),
    ("DOM-DPSI1000TS", "DPSI 1000 TS", "Sinus-WR 1000W, 12V, Netzvorrangschaltung", 521.50, "Wechselrichter"),
    ("DOM-DPSI1500TS", "DPSI 1500 TS", "Sinus-WR 1500W, 12/24V, Netzvorrangschaltung", 720.00, "Wechselrichter"),
    ("DOM-DPSI2000TS", "DPSI 2000 TS", "Sinus-WR 2000W, 12/24V, Netzvorrangschaltung", 919.00, "Wechselrichter"),
    ("DOM-DPSI3000TS", "DPSI 3000 TS", "Sinus-WR 3000W, 12/24V, Netzvorrangschaltung", 1295.00, "Wechselrichter"),

    # DPSI iTS Komfort
    ("DOM-DPSI1812ITS", "DPSI 1812iTS", "Komfort-Sinuswechselrichter 1800W, intel. Netzvorrangschaltung", 1119.00, "Wechselrichter"),

    # 5. Kombigeräte WR + Ladegerät – MT ICC
    ("DOM-MTICC1600", "MT ICC 1600 SI-N", "Kombi WR 1600W + Ladegerät 60A, 12V, PowerBoost, Nachtmodus", 1730.00, "Kombigeräte"),
    ("DOM-MTICC3000", "MT ICC 3000 SI-N", "Kombi WR 3000W + Ladegerät 120A, 12V, PowerBoost", 2490.00, "Kombigeräte"),
    ("DOM-MTICC-INFO", "MT ICC InfoControl", "Bedienteil für MT ICC", 255.00, "Kombigeräte"),

    # 6. Ladegeräte (Landstrom)
    ("DOM-MCA1225", "PerfectCharge MCA PLUS 1225", "Landstrom-Ladegerät IU0U, 25A, 12V", 387.00, "Ladegeräte"),

    # 7. Solar-Laderegler
    ("DOM-SC330", "SC330", "MPPT Solar-Laderegler bis 330W, 2 Eingänge, Bluetooth+N-BUS", 159.00, "Solar-Laderegler"),
    ("DOM-SC480", "SC480", "MPPT Solar-Laderegler bis 480W, 2 Eingänge, Bluetooth+N-BUS", 199.00, "Solar-Laderegler"),

    # 9. Anzeige & Steuerung
    ("DOM-TD283", "TD283", "Multifunktions-Touchdisplay, alle N-BUS-Geräte, Echtzeit-Verbrauch", 135.00, "Anzeige & Steuerung"),
]

# Check existing products
existing_products = query("products", "productnumber,productid,name")
existing_map = {p["productnumber"]: p["productid"] for p in existing_products}
print(f"  Existing products in system: {len(existing_products)}")

created = 0
product_map = {}  # productnumber -> productid

for pnum, name, desc, price, category in PRODUCTS:
    if pnum in existing_map:
        product_map[pnum] = existing_map[pnum]
        print(f"  ✓ {pnum} ({name}) exists")
        continue

    COMPANY_ID = "ededa78a-315a-428b-86c2-25ffb01add83"
    body = {
        "productnumber": pnum,
        "msdyn_productnumber": pnum,
        "name": name,
        "description": desc,
        "price": price,
        "producttypecode": 1,  # Sales Inventory
        "quantitydecimal": 0,
        "defaultuomid@odata.bind": f"/uoms({UOM_ID})",
        "defaultuomscheduleid@odata.bind": f"/uomschedules({UOM_GROUP_ID})",
        "msdyn_CompanyId@odata.bind": f"/cdm_companies({COMPANY_ID})",
    }

    try:
        result = create_record("products", body)
        if result:
            product_map[pnum] = result["productid"]
            print(f"  + {pnum} ({name}) — {price} €")
            created += 1
        else:
            print(f"  ~ {pnum} duplicate/skipped")
        time.sleep(0.3)
    except Exception as e:
        print(f"  ✗ {pnum}: {e}")

print(f"\n  Products: {created} created, {len(existing_map)} pre-existing")

# ============================================================
# 4. CREATE PRICE LIST ITEMS
# ============================================================
print("\n=== 4. Price List Items ===")

# Check existing price list items for our price list
existing_pli = query("productpricelevels", "productpricelevelid,_productid_value",
                     f"_pricelevelid_value eq '{PRICELIST_ID}'")
existing_pli_products = {p["_productid_value"] for p in existing_pli}
print(f"  Existing price list items: {len(existing_pli)}")

created_pli = 0
for pnum, name, desc, price, category in PRODUCTS:
    pid = product_map.get(pnum)
    if not pid:
        print(f"  ✗ {pnum} — no product ID, skipping")
        continue
    if pid in existing_pli_products:
        print(f"  ✓ {pnum} already in price list")
        continue

    body = {
        "productid@odata.bind": f"/products({pid})",
        "pricelevelid@odata.bind": f"/pricelevels({PRICELIST_ID})",
        "uomid@odata.bind": f"/uoms({UOM_ID})",
        "amount": price,
        "pricingmethodcode": 1,  # Currency Amount
    }
    try:
        create_record("productpricelevels", body)
        print(f"  + {pnum} → {price} €")
        created_pli += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"  ✗ {pnum}: {e}")

print(f"\n  Price list items: {created_pli} created")

# ============================================================
# 5. PUBLISH PRODUCTS (set to Active)
# ============================================================
print("\n=== 5. Publishing products (Draft → Active) ===")

# Products need to be published to be usable in quotes
published = 0
for pnum, name, desc, price, category in PRODUCTS:
    pid = product_map.get(pnum)
    if not pid:
        continue
    try:
        # Check current state
        prod = api("GET", f"products({pid})?$select=statecode")
        if prod.get("statecode") == 0:  # Draft
            api("POST", f"products({pid})/Microsoft.Dynamics.CRM.PublishProductHierarchy", {})
            print(f"  ✓ {pnum} published")
            published += 1
            time.sleep(0.3)
        else:
            print(f"  ✓ {pnum} already active")
    except Exception as e:
        err_str = str(e)
        if "already" in err_str.lower() or "Active" in err_str:
            print(f"  ✓ {pnum} already active")
        else:
            print(f"  ~ {pnum}: {err_str[:150]}")

print(f"\n  Published: {published}")

# ============================================================
# 6. VERIFICATION
# ============================================================
print("\n=== 6. Verification ===")
total_products = len(query("products", "productid", f"productnumber ge 'DOM-' and productnumber le 'DOM-Z'"))
total_pli = len(query("productpricelevels", "productpricelevelid",
                      f"_pricelevelid_value eq '{PRICELIST_ID}'"))
print(f"  Products (DOM-*): {total_products}/{len(PRODUCTS)}")
print(f"  Price list items: {total_pli}/{len(PRODUCTS)}")
print(f"  Price list: {PRICELIST_NAME} ({PRICELIST_ID})")

print("\n=== DONE ===")
