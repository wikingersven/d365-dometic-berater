"""Create custom Dometic quote tables on Powerbusters CE to bypass Dual-Write.

Tables:
  pb_dometicquote     — Angebotskopf (Kunde, Name, Gesamtsumme, Status)
  pb_dometicquoteline — Angebotsposition (Produkt, Menge, Preis, Summe)
"""
import json
import os
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

def api_call(method, path, body=None, timeout=120):
    url = path if path.startswith("http") else f"{API}/{path}"
    data = json.dumps(body).encode() if body else None
    headers = dict(H)
    if method == "POST" and body:
        headers["MSCRM.SolutionUniqueName"] = SOLUTION
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
            return api_call(method, path, body, timeout)
        raise Exception(f"HTTP {e.code}: {err[:500]}")

def entity_exists(logical_name):
    try:
        api_call("GET", f"EntityDefinitions(LogicalName='{logical_name}')?$select=LogicalName")
        return True
    except:
        return False

def attr_exists(entity, attr):
    try:
        api_call("GET", f"EntityDefinitions(LogicalName='{entity}')/Attributes(LogicalName='{attr}')")
        return True
    except:
        return False

def create_entity(schema_name, display_name, display_name_plural, description, primary_attr_display="Name"):
    logical = schema_name.lower()
    if entity_exists(logical):
        print(f"  ✓ {logical} already exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "DisplayCollectionName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name_plural, "LanguageCode": 1031}
        ]},
        "Description": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": description, "LanguageCode": 1031}
        ]},
        "HasActivities": False,
        "HasNotes": False,
        "OwnershipType": "OrganizationOwned",
        "IsActivity": False,
        "PrimaryNameAttribute": "pb_name",
        "Attributes": [{
            "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
            "SchemaName": "pb_Name",
            "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": primary_attr_display, "LanguageCode": 1031}
            ]},
            "RequiredLevel": {"Value": "ApplicationRequired"},
            "MaxLength": 300,
            "IsPrimaryName": True,
        }],
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(f"{API}/EntityDefinitions", data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=120)
        print(f"  ✓ {schema_name} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if "already" in err.lower() or "Duplicate" in err:
            print(f"  ✓ {schema_name} already exists")
        else:
            print(f"  ✗ {schema_name}: {err[:300]}")
            raise
    time.sleep(10)

def add_string_column(entity_schema, col_schema, label, max_len=200, required=False):
    logical = col_schema.lower()
    entity_logical = entity_schema.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        "AttributeType": "String",
        "SchemaName": col_schema,
        "MaxLength": max_len,
        "FormatName": {"Value": "Text"},
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "ApplicationRequired" if required else "None"},
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(
        f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes",
        data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=60)
        print(f"    ✓ {col_schema} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    ✗ {col_schema}: {err[:200]}")
    time.sleep(1)

def add_money_column(entity_schema, col_schema, label, precision=2):
    logical = col_schema.lower()
    entity_logical = entity_schema.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
        "AttributeType": "Money",
        "SchemaName": col_schema,
        "Precision": precision,
        "PrecisionSource": 0,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(
        f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes",
        data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=60)
        print(f"    ✓ {col_schema} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    ✗ {col_schema}: {err[:200]}")
    time.sleep(1)

def add_int_column(entity_schema, col_schema, label):
    logical = col_schema.lower()
    entity_logical = entity_schema.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
        "AttributeType": "Integer",
        "SchemaName": col_schema,
        "Format": "None",
        "MinValue": 0,
        "MaxValue": 999999,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(
        f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes",
        data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=60)
        print(f"    ✓ {col_schema} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    ✗ {col_schema}: {err[:200]}")
    time.sleep(1)

def add_decimal_column(entity_schema, col_schema, label, precision=2):
    logical = col_schema.lower()
    entity_logical = entity_schema.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
        "AttributeType": "Decimal",
        "SchemaName": col_schema,
        "Precision": precision,
        "MinValue": 0,
        "MaxValue": 9999999,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
    }
    headers = dict(H)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION
    req = urllib.request.Request(
        f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes",
        data=json.dumps(body).encode(), method="POST", headers=headers)
    try:
        urllib.request.urlopen(req, timeout=60)
        print(f"    ✓ {col_schema} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    ✗ {col_schema}: {err[:200]}")
    time.sleep(1)

def create_lookup(primary_entity, related_entity, schema_name, label):
    logical = schema_name.lower()
    if attr_exists(related_entity.lower(), logical):
        print(f"    ✓ {logical} exists on {related_entity}")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
        "SchemaName": schema_name,
        "ReferencedEntity": primary_entity.lower(),
        "ReferencingEntity": related_entity.lower(),
        "Lookup": {
            "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
            "SchemaName": schema_name,
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
        print(f"    ✓ {schema_name} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if "already" in err.lower() or "Duplicate" in err:
            print(f"    ✓ {schema_name} already exists")
        else:
            print(f"    ✗ {schema_name}: {err[:200]}")
    time.sleep(3)


# ============================================================
# 1. CREATE TABLES
# ============================================================
print("=== 1. Creating tables ===")

create_entity(
    "pb_DometicQuote",
    "Dometic Angebot",
    "Dometic Angebote",
    "Angebotskopf für Dometic Bordelektrik-Berater (Custom, kein Dual-Write)",
    "Name"
)

create_entity(
    "pb_DometicQuoteLine",
    "Dometic Angebotsposition",
    "Dometic Angebotspositionen",
    "Angebotsposition mit Produkt, Menge und Preis",
    "Produktname"
)

# ============================================================
# 2. ADD COLUMNS TO pb_dometicquote
# ============================================================
print("\n=== 2. Columns on pb_dometicquote ===")

add_string_column("pb_DometicQuote", "pb_CustomerName", "Kundenname", 300)
add_string_column("pb_DometicQuote", "pb_CustomerType", "Kundentyp", 20)  # "account" or "contact"
add_string_column("pb_DometicQuote", "pb_CustomerId", "Kunden-ID", 50)
add_string_column("pb_DometicQuote", "pb_CustomerEmail", "E-Mail", 200)
add_string_column("pb_DometicQuote", "pb_CustomerPhone", "Telefon", 50)
add_decimal_column("pb_DometicQuote", "pb_TotalAmount", "Gesamtsumme")
add_int_column("pb_DometicQuote", "pb_LineCount", "Positionen")
add_string_column("pb_DometicQuote", "pb_Country", "Land", 5)

# ============================================================
# 3. ADD COLUMNS TO pb_dometicquoteline
# ============================================================
print("\n=== 3. Columns on pb_dometicquoteline ===")

add_string_column("pb_DometicQuoteLine", "pb_ProductNumber", "Produktnummer", 50)
add_int_column("pb_DometicQuoteLine", "pb_Quantity", "Menge")
add_decimal_column("pb_DometicQuoteLine", "pb_PricePerUnit", "Preis/Stück")
add_decimal_column("pb_DometicQuoteLine", "pb_LineTotal", "Positionssumme")

# ============================================================
# 4. LOOKUP: QuoteLine → Quote
# ============================================================
print("\n=== 4. Lookup: QuoteLine → Quote ===")
create_lookup("pb_DometicQuote", "pb_DometicQuoteLine", "pb_Quote", "Angebot")

# ============================================================
# 5. PUBLISH
# ============================================================
print("\n=== 5. Publishing ===")
try:
    req = urllib.request.Request(f"{API}/PublishAllXml", data=b"{}", method="POST", headers=H)
    urllib.request.urlopen(req, timeout=600)
    print("  ✓ Published")
except Exception as e:
    print(f"  Publish: {e} (may still be processing)")

# ============================================================
# 6. TEST: Create + Delete a test quote
# ============================================================
print("\n=== 6. Test ===")
try:
    test_body = {"pb_name": "Test Dometic Quote", "pb_customername": "Test AG", "pb_customertype": "account", "pb_totalamount": 1234.56}
    result = api_call("POST", "pb_dometicquotes", test_body)
    qid = result.get("pb_dometicquoteid")
    print(f"  ✓ Test quote created: {qid}")
    # Delete
    api_call("DELETE", f"pb_dometicquotes({qid})")
    print(f"  ✓ Test quote deleted")
except Exception as e:
    print(f"  Test: {e}")

print("\n=== DONE ===")
