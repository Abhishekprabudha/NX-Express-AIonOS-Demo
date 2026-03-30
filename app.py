from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser
import os

PORT = int(os.environ.get('PORT', '8000'))
ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

if __name__ == '__main__':
    url = f'http://127.0.0.1:{PORT}/index.html'
    print(f'Serving {ROOT} at {url}')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
