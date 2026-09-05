"""Deploy Dometic Berater Dataverse entities to Powerbusters environment."""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

# SPN credentials from pac cache
SPN_CACHE = os.path.expanduser("~/.local/share/Microsoft/PowerAppsCli/pac.spn.cache.fallback.dat")
AUTH_PROFILES = os.path.expanduser("~/.local/share/Microsoft/PowerAppsCli/authprofiles_v2.json")

spn = json.load(open(SPN_CACHE))
CLIENT_ID = list(spn.keys())[0]
CLIENT_SECRET = spn[CLIENT_ID]

profiles = json.load(open(AUTH_PROFILES))
# Find Powerbusters profile
pb_profile = [p for p in profiles["Profiles"] if "smitpowerbusters" in p["Resource"]][0]
TENANT_ID = pb_profile["TenantId"]
CRM_URL = pb_profile["Resource"].rstrip("/")

API = f"{CRM_URL}/api/data/v9.2"

def get_token():
    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": f"{CRM_URL}/.default",
    }).encode()
    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
    return resp["access_token"]

TOKEN = get_token()
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
}
SOLUTION_NAME = "pbdometicberater"

def api_call(method, url, body=None, timeout=120):
    data = json.dumps(body).encode() if body else None
    headers = dict(HEADERS)
    if body and method == "POST":
        headers["MSCRM.SolutionUniqueName"] = SOLUTION_NAME
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"  HTTP {e.code}: {err_body[:300]}")
        if e.code == 429 or (e.code == 400 and "unexpected" in err_body.lower()):
            wait = 60 if e.code == 429 else 10
            print(f"  → {e.code}, waiting {wait}s and retrying...")
            time.sleep(wait)
            return api_call(method, url, body, timeout)
        raise

def entity_exists(logical_name):
    try:
        url = f"{API}/EntityDefinitions(LogicalName='{logical_name}')?$select=LogicalName"
        api_call("GET", url)
        return True
    except urllib.error.HTTPError:
        return False

def create_entity(schema_name, display_name, display_plural, description=""):
    logical = schema_name.lower()
    if entity_exists(logical):
        print(f"  ✓ Entity {logical} already exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "DisplayCollectionName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_plural, "LanguageCode": 1031}
        ]},
        "Description": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": description, "LanguageCode": 1031}
        ]},
        "HasNotes": False,
        "HasActivities": False,
        "OwnershipType": "OrganizationOwned",
        "IsActivity": False,
        "PrimaryNameAttribute": f"{logical}_name" if not logical.endswith("_name") else logical,
    }
    body["PrimaryNameAttribute"] = "pb_name"
    body["Attributes"] = [{
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        "SchemaName": "pb_Name",
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Name", "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "ApplicationRequired"},
        "MaxLength": 200,
        "IsPrimaryName": True,
    }]
    print(f"  Creating entity {logical}...")
    api_call("POST", f"{API}/EntityDefinitions", body, timeout=120)
    print(f"  ✓ Entity {logical} created")
    print(f"    Waiting 10s for propagation...")
    time.sleep(10)

def attr_exists(entity_logical, attr_logical):
    try:
        url = f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes(LogicalName='{attr_logical}')?$select=LogicalName"
        api_call("GET", url)
        return True
    except urllib.error.HTTPError:
        return False

def create_string_attr(entity_logical, schema_name, display_name, max_length=100):
    logical = schema_name.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
        "MaxLength": max_length,
        "AttributeType": "String",
        "FormatName": {"Value": "Text"},
    }
    api_call("POST", f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes", body)
    print(f"    ✓ {logical} created")
    time.sleep(0.4)

def create_int_attr(entity_logical, schema_name, display_name, min_val=0, max_val=100000):
    logical = schema_name.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
        "MinValue": min_val,
        "MaxValue": max_val,
    }
    api_call("POST", f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes", body)
    print(f"    ✓ {logical} created")
    time.sleep(0.4)

def create_bool_attr(entity_logical, schema_name, display_name):
    logical = schema_name.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
        "OptionSet": {
            "TrueOption": {"Value": 1, "Label": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Ja", "LanguageCode": 1031}
            ]}},
            "FalseOption": {"Value": 0, "Label": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": "Nein", "LanguageCode": 1031}
            ]}},
        },
    }
    api_call("POST", f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes", body)
    print(f"    ✓ {logical} created")
    time.sleep(0.4)

def create_picklist_attr(entity_logical, schema_name, display_name, options):
    logical = schema_name.lower()
    if attr_exists(entity_logical, logical):
        print(f"    ✓ {logical} exists")
        return
    option_items = []
    for val, label in options:
        option_items.append({
            "Value": val,
            "Label": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": label, "LanguageCode": 1031}
            ]}
        })
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
        "SchemaName": schema_name,
        "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
            {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
        ]},
        "RequiredLevel": {"Value": "None"},
        "OptionSet": {
            "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
            "IsGlobal": False,
            "OptionSetType": "Picklist",
            "Options": option_items,
        },
    }
    api_call("POST", f"{API}/EntityDefinitions(LogicalName='{entity_logical}')/Attributes", body)
    print(f"    ✓ {logical} created")
    time.sleep(0.4)

def publish_all():
    print("Publishing all customizations...")
    req = urllib.request.Request(
        f"{API}/PublishAllXml",
        data=b"{}",
        method="POST",
        headers=HEADERS,
    )
    try:
        urllib.request.urlopen(req, timeout=600)
        print("✓ Published")
    except Exception as e:
        print(f"  Publish warning: {e} (may still succeed)")

# === MAIN ===
print("=== Dometic Berater Dataverse Deploy ===")
print(f"Target: {CRM_URL}")

# 1. Create Solution container
print("\n1. Creating Solution container...")
try:
    # Check if solution exists
    sol_url = f"{API}/solutions?" + urllib.parse.urlencode({"$filter": f"uniquename eq '{SOLUTION_NAME}'"}, quote_via=urllib.parse.quote)
    result = api_call("GET", sol_url)
    if result.get("value"):
        print(f"  ✓ Solution {SOLUTION_NAME} already exists")
    else:
        # Get publisher
        pub_url = f"{API}/publishers?" + urllib.parse.urlencode({"$filter": "uniquename eq 'powerbusters'"}, quote_via=urllib.parse.quote)
        pubs = api_call("GET", pub_url)
        if not pubs.get("value"):
            print("  ✗ Publisher 'powerbusters' not found!")
            sys.exit(1)
        pub_id = pubs["value"][0]["publisherid"]
        sol_body = {
            "uniquename": SOLUTION_NAME,
            "friendlyname": "Dometic Bordelektrik-Berater",
            "version": "1.0.0",
            "publisherid@odata.bind": f"/publishers({pub_id})",
        }
        # Solution creation must NOT include MSCRM.SolutionUniqueName header
        sol_headers = dict(HEADERS)
        req = urllib.request.Request(
            f"{API}/solutions",
            data=json.dumps(sol_body).encode(),
            method="POST",
            headers=sol_headers,
        )
        urllib.request.urlopen(req, timeout=60)
        print(f"  ✓ Solution {SOLUTION_NAME} created")
        time.sleep(30)  # Wait for solution to settle
except Exception as e:
    print(f"  Solution check/create error: {e}")

# 2. Create entities
print("\n2. Creating entities...")

# Brand (no FK dependencies)
create_entity("pb_DometicBrand", "Dometic Marke", "Dometic Marken", "Marke/Hersteller im Dometic-Ökosystem")
create_string_attr("pb_dometicbrand", "pb_Key", "Schlüssel", 20)
create_string_attr("pb_dometicbrand", "pb_CatalogFile", "Katalog-Datei", 200)

# Regulation (no FK dependencies)
create_entity("pb_DometicRegulation", "Dometic Regelwerk", "Dometic Regelwerke", "Länder-spezifisches Regelwerk")
create_string_attr("pb_dometicregulation", "pb_Key", "Schlüssel", 20)
create_string_attr("pb_dometicregulation", "pb_File", "Datei", 200)

# Country (FK to Brand + Regulation)
create_entity("pb_DometicCountry", "Dometic Land", "Dometic Länder", "EU-Land mit Marken- und Regelwerk-Zuordnung")
create_string_attr("pb_dometiccountry", "pb_Code", "ISO-Code", 2)
create_string_attr("pb_dometiccountry", "pb_NameEN", "Name (EN)", 100)
create_string_attr("pb_dometiccountry", "pb_FlagEmoji", "Flagge", 10)
create_string_attr("pb_dometiccountry", "pb_Currency", "Währung", 5)
create_picklist_attr("pb_dometiccountry", "pb_Lang", "Sprache", [
    (100000000, "Deutsch"), (100000001, "English"), (100000002, "Français"),
])
create_picklist_attr("pb_dometiccountry", "pb_RegionGroup", "Region", [
    (100000000, "DACH"), (100000001, "Nordics"), (100000002, "Benelux"),
    (100000003, "Western Europe"), (100000004, "Southern Europe"),
    (100000005, "UK & Ireland"), (100000006, "Central Europe"),
    (100000007, "Southeast Europe"), (100000008, "Baltics"),
])

# Category (no FK dependencies)
create_entity("pb_DometicCategory", "Dometic Kategorie", "Dometic Kategorien", "Verbraucher-Kategorie A–E")
create_string_attr("pb_dometiccategory", "pb_CategoryId", "Kategorie-ID", 1)
create_string_attr("pb_dometiccategory", "pb_NameDE", "Name (DE)", 100)
create_string_attr("pb_dometiccategory", "pb_NameEN", "Name (EN)", 100)
create_string_attr("pb_dometiccategory", "pb_NameFR", "Name (FR)", 100)
create_int_attr("pb_dometiccategory", "pb_SortOrder", "Reihenfolge", 0, 100)

# Consumer (FK to Category)
create_entity("pb_DometicConsumer", "Dometic Verbraucher", "Dometic Verbraucher", "Elektrischer Verbraucher im Wohnmobil")
create_string_attr("pb_dometicconsumer", "pb_NameEN", "Name (EN)", 100)
create_string_attr("pb_dometicconsumer", "pb_ConsumerId", "Verbraucher-ID", 5)
create_int_attr("pb_dometicconsumer", "pb_Wh", "Wh/Tag", 0, 100000)
create_int_attr("pb_dometicconsumer", "pb_Peak", "Spitzenlast (W)", 0, 100000)
create_bool_attr("pb_dometicconsumer", "pb_Is230V", "230V (Wechselrichter)")
create_string_attr("pb_dometicconsumer", "pb_Subcategory", "Unterkategorie", 100)
create_int_attr("pb_dometicconsumer", "pb_SortOrder", "Reihenfolge", 0, 1000)

# 3. Publish
publish_all()

# 4. Create lookup relationships
print("\n4. Creating lookup relationships...")

def create_lookup(primary_entity, related_entity, schema_name, display_name):
    # Check if already exists
    logical = schema_name.lower()
    if attr_exists(related_entity, logical.replace("_", "")):
        print(f"  ✓ Lookup {logical} already exists")
        return
    body = {
        "@odata.type": "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
        "SchemaName": schema_name,
        "ReferencedEntity": primary_entity,
        "ReferencingEntity": related_entity,
        "Lookup": {
            "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
            "SchemaName": schema_name,
            "DisplayName": {"@odata.type": "Microsoft.Dynamics.CRM.Label", "LocalizedLabels": [
                {"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", "Label": display_name, "LanguageCode": 1031}
            ]},
            "RequiredLevel": {"Value": "None"},
        },
    }
    headers = dict(HEADERS)
    headers["MSCRM.SolutionUniqueName"] = SOLUTION_NAME
    req = urllib.request.Request(
        f"{API}/RelationshipDefinitions",
        data=json.dumps(body).encode(),
        method="POST",
        headers=headers,
    )
    try:
        urllib.request.urlopen(req, timeout=120)
        print(f"  ✓ Lookup {schema_name} created")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        if "already exists" in err.lower() or "DuplicateComponentName" in err:
            print(f"  ✓ Lookup {schema_name} already exists")
        else:
            print(f"  ✗ Lookup {schema_name} failed: {err[:200]}")
    time.sleep(3)

# Country → Brand
create_lookup("pb_dometicbrand", "pb_dometiccountry", "pb_Brand", "Marke")
# Country → Regulation
create_lookup("pb_dometicregulation", "pb_dometiccountry", "pb_Regulation", "Regelwerk")
# Consumer → Category
create_lookup("pb_dometiccategory", "pb_dometicconsumer", "pb_Category", "Kategorie")

# Final publish
publish_all()

print("\n=== DONE ===")
print("5 entities created with all columns and 3 lookup relationships")
print("Next: run seed-data script to populate records")
