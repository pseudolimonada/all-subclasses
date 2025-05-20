import http.server
import socketserver

PORT = 8002

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update(
    {
        ".js": "application/javascript",
        ".css": "text/css",
    }
)

print(f"Server starting at http://localhost:{PORT}")
print("Press Ctrl+C to quit")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
