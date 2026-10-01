#!/usr/bin/env python3
"""Static server with Brotli for text (production-like) and long cache headers for /release/. usage: serve.py <port>"""
import http.server, sys, os, brotli, mimetypes
mimetypes.add_type('font/woff2', '.woff2'); mimetypes.add_type('image/webp', '.webp')
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path.split('?')[0])
        if os.path.isdir(path) or not os.path.exists(path): return super().send_head()
        ctype = self.guess_type(path); data = open(path, 'rb').read()
        enc = None
        if ctype.split(';')[0] in ('text/html', 'text/css', 'application/javascript', 'text/javascript') and 'br' in self.headers.get('Accept-Encoding', ''):
            data = brotli.compress(data, quality=11); enc = 'br'
        self.send_response(200); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(data)))
        if enc: self.send_header('Content-Encoding', enc)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable' if '/release/' in self.path else 'no-cache')
        self.end_headers()
        import io; return io.BytesIO(data)
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()
