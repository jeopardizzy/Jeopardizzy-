"""Temporary local HTTP server with permissive CORS for in-page asset upload."""
import http.server, functools, sys, os

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def log_message(self, *a):
        pass

os.chdir(ROOT)
with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as srv:
    print(f"serving {ROOT} on {PORT}", flush=True)
    srv.serve_forever()
