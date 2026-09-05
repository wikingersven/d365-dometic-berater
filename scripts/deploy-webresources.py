"""Deploy Dometic Berater web resources to Powerbusters Dataverse."""
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

# === Auth (from pac cache) ===
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
PREFIX = "pb_/apps/dometic-berater/"

CONTENT_TYPES = {
    ".html": 1, ".css": 2, ".js": 3, ".xml": 4,
    ".png": 5, ".jpg": 6, ".gif": 7, ".svg": 11, ".ico": 10,
}

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
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
}

def api_call(method, path, body=None, extra_headers=None, timeout=120):
    url = path if path.startswith("http") else f"{API}{path}"
    data = json.dumps(body).encode() if body else None
    headers = dict(HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {"ok": True}
    except urllib.error.HTTPError as e:
        if e.code == 204:
            return {"ok": True}
        err = e.read().decode()
        if e.code == 429:
            print(f"    429 throttled, waiting 30s...")
            time.sleep(30)
            return api_call(method, path, body, extra_headers, timeout)
        raise Exception(f"HTTP {e.code}: {err[:300]}")

def find_webresource(name):
    qs = urllib.parse.urlencode(
        {"$filter": f"name eq '{name}'", "$select": "webresourceid,name"},
        quote_via=urllib.parse.quote)
    result = api_call("GET", f"/webresourceset?{qs}")
    vals = result.get("value", [])
    return vals[0]["webresourceid"] if vals else None

def deploy_file(filepath, wrname, content_type):
    with open(filepath, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    wrid = find_webresource(wrname)
    sol_header = {"MSCRM.SolutionUniqueName": SOLUTION}
    if wrid:
        api_call("PATCH", f"/webresourceset({wrid})", {"content": b64}, sol_header)
        return "updated"
    else:
        api_call("POST", "/webresourceset", {
            "name": wrname,
            "displayname": os.path.basename(filepath),
            "content": b64,
            "webresourcetype": content_type,
        }, sol_header)
        return "created"

# === MAIN ===
DIST = os.path.join(os.path.dirname(__file__), "..", "code-app", "dist")
DIST = os.path.abspath(DIST)

if not os.path.isdir(DIST):
    print(f"ERROR: dist/ not found at {DIST}")
    print("Run: cd code-app && node node_modules/vite/bin/vite.js build")
    sys.exit(1)

print(f"=== Deploying Web Resources ===")
print(f"Source: {DIST}")
print(f"Target: {CRM_URL}")
print(f"Solution: {SOLUTION}")
print(f"Prefix: {PREFIX}")
print()

deployed = []
for root, dirs, files in os.walk(DIST):
    for fname in files:
        fp = os.path.join(root, fname)
        ext = os.path.splitext(fname)[1].lower()
        ct = CONTENT_TYPES.get(ext)
        if not ct:
            print(f"  SKIP {fname} (unknown type)")
            continue
        relpath = os.path.relpath(fp, DIST).replace("\\", "/")
        wrname = PREFIX + relpath
        action = deploy_file(fp, wrname, ct)
        print(f"  {action}: {wrname}")
        deployed.append(wrname)
        time.sleep(0.3)

print(f"\n{len(deployed)} web resources deployed")

# Cleanup old assets
print("\nChecking for orphaned web resources...")
current_files = set(deployed)
qs = urllib.parse.urlencode(
    {"$filter": f"startswith(name, '{PREFIX}')", "$select": "webresourceid,name"},
    quote_via=urllib.parse.quote)
result = api_call("GET", f"/webresourceset?{qs}")
orphans = [wr for wr in result.get("value", []) if wr["name"] not in current_files]
for wr in orphans:
    api_call("DELETE", f"/webresourceset({wr['webresourceid']})")
    print(f"  deleted: {wr['name']}")
if not orphans:
    print("  No orphans found")

# Publish
print("\nPublishing...")
try:
    publish_body = {
        "ParameterXml": f"<importexportxml><webresources>{','.join(deployed)}</webresources></importexportxml>"
    }
    api_call("POST", "/PublishXml", publish_body, timeout=300)
    print("✓ Published")
except Exception as e:
    print(f"  PublishXml failed ({e}), trying PublishAllXml...")
    try:
        api_call("POST", "/PublishAllXml", {}, timeout=600)
        print("✓ Published (all)")
    except Exception as e2:
        print(f"  PublishAllXml: {e2} (may still be processing)")

print(f"\n=== DONE ===")
print(f"App URL: {CRM_URL}/WebResources/{PREFIX}index.html")
