"""Demo server for RAHIL's website. Standard library only.

Run:  python server.py   ->  http://localhost:8000   (admin: /admin.html)
Set ADMIN_PASSWORD in the environment to change the demo password.
"""
import json, os, secrets, mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
STATIC = ROOT / "static"
DATA = ROOT / "data.json"
PORT = int(os.environ.get("PORT", 8000))
PASSWORD = os.environ.get("ADMIN_PASSWORD", "rahil123")
TOKENS = set()


def load():
    return json.loads(DATA.read_text(encoding="utf-8"))


def save(d):
    DATA.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}")

    def authed(self):
        ok = self.headers.get("Authorization", "").removeprefix("Bearer ") in TOKENS
        if not ok:
            self.send_json({"error": "unauthorized"}, 401)
        return ok

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/data":
            return self.send_json(load())
        rel = "index.html" if path == "/" else path.lstrip("/")
        f = (STATIC / rel).resolve()
        if STATIC.resolve() not in f.parents or not f.is_file():
            return self.send_json({"error": "not found"}, 404)
        data = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(f.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        b = self.body()
        if path == "/api/login":
            if b.get("password") == PASSWORD:
                t = secrets.token_hex(16)
                TOKENS.add(t)
                return self.send_json({"token": t})
            return self.send_json({"error": "wrong password"}, 401)
        if not self.authed():
            return
        d = load()
        if path == "/api/videos":
            d["videos"].append({"id": secrets.token_hex(4), "title": b.get("title", "").strip(), "url": b.get("url", "").strip()})
        elif path == "/api/books":
            b["id"] = secrets.token_hex(4)
            b["links"] = [l for l in b.get("links", []) if l.get("url")]
            d["books"].append(b)
        else:
            return self.send_json({"error": "not found"}, 404)
        save(d)
        self.send_json(d)

    def do_DELETE(self):
        if not self.authed():
            return
        _, _, kind, item_id = urlparse(self.path).path.split("/")[:4]
        d = load()
        if kind not in ("videos", "books"):
            return self.send_json({"error": "not found"}, 404)
        d[kind] = [x for x in d[kind] if x["id"] != item_id]
        save(d)
        self.send_json(d)


if __name__ == "__main__":
    print(f"RAHIL demo running at http://localhost:{PORT}  (admin: /admin.html)")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
