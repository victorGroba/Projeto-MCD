from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Verifica se o token JWT está presente e é válido
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"msg": "Acesso não autorizado", "error": str(e)}), 401
        
        return func(*args, **kwargs)
    return wrapper

# Decorador extra opcional: Exigir cargo específico
def require_role(role_required):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != role_required:
                return jsonify({"msg": "Acesso proibido para este perfil"}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator