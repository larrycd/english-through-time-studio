import http.server, functools, sys
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.wasm': 'application/wasm', '.js': 'application/javascript', '.tsv':'text/plain; charset=utf-8'}
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8772), functools.partial(H, directory=sys.argv[1])).serve_forever()
