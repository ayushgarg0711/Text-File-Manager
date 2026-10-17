"""Small local web server for Text File Manager.

Usage:
    python server.py          # serves on http://localhost:8000
    python server.py 9000     # serves on a different port

The site is plain HTML, CSS and JavaScript, so this server only hands those
files to your browser. Files you create in the app are saved in the browser,
not on this machine.
"""
import http.server
import os
import socketserver
import sys
import webbrowser

HOST = "127.0.0.1"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# Serve the folder this script lives in, wherever it is run from.
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Always load the latest CSS and JS while you are editing them.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer((HOST, PORT), Handler) as server:
    url = f"http://localhost:{PORT}"
    print(f"Text File Manager is running at {url}")
    print("Press Ctrl+C to stop.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")