#!/usr/bin/env python3
"""
Grind OS Local Development Server
Serves static files with no-cache headers on port 4242.
Zero dependencies required — uses Python's built-in standard library.
"""

import http.server
import socketserver
import os
import sys

PORT = 4242
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GrindOSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Prevent caching for live development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), GrindOSRequestHandler) as httpd:
        print("=" * 60)
        print(f"🚀 Grind OS server running at http://localhost:{PORT}")
        print(f"📁 Serving directory: {DIRECTORY}")
        print("Press Ctrl+C to stop.")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.shutdown()
