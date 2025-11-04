class AdditionalHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Headers para permitir embedding y recursos cross-origin
        response["Cross-Origin-Resource-Policy"] = "cross-origin"
        response["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        response["Cross-Origin-Opener-Policy"] = "unsafe-none"
        
        # Para desarrollo, desactiva algunas políticas de seguridad
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        
        return response