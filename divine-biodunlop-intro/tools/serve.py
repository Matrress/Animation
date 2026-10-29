#!/usr/bin/env python3
"""Preview server for the BioDunlop intro, rooted at the repository root so both divine-hero/ and divine-biodunlop-intro/
are reachable. Supports HTTP Range (Safari and seeking need it, jsDelivr provides it). usage: python3 serve.py <port>"""
import http.server, sys, os, re, mimetypes
mimetypes.add_type('font/woff2', '.woff2'); mimetypes.add_type('image/webp', '.webp'); mimetypes.add_type('video/mp4', '.mp4'); mimetypes.add_type('video/webm', '.webm')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def send_head(self):
        path = self.translate_path(self.path.split('?')[0])
        if os.path.isdir(path) or not os.path.exists(path): return super().send_head()
        size = os.path.getsize(path); f = open(path, 'rb'); start, end = 0, size - 1
        m = re.match(r'bytes=(\d*)-(\d*)', self.headers.get('Range', ''))
        if m and (m.group(1) or m.group(2)):
            if m.group(1): start = int(m.group(1)); end = int(m.group(2)) if m.group(2) else size - 1
            else: start = size - int(m.group(2))
            end = min(end, size - 1); self.send_response(206); self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        else: self.send_response(200)
        self.send_header('Content-Type', self.guess_type(path)); self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1)); self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable' if '/release/' in self.path else 'no-cache')
        self.end_headers(); f.seek(start)
        import io; data = f.read(end - start + 1); f.close(); return io.BytesIO(data)
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8766), H).serve_forever()
