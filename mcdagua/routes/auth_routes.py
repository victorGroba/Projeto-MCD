from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from mcdagua.extensions import jwt

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    # O React envia JSON, não Form Data
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Dados inválidos"}), 400

    username = data.get("username")
    password = data.get("password")

    # Acesso às configs do app
    app = auth_bp.server # ou current_app se preferir importar
    valid_user = app.config["APP_USERNAME"]
    valid_pwd = app.config["APP_PASSWORD"]

    if username == valid_user and password == valid_pwd:
        # Define o papel do usuário (hardcoded por enquanto, depois virá do banco)
        # Se o login for do admin, é operacional. Senão, cliente.
        user_role = "operacional" 
        
        # Cria o token contendo a identidade e o cargo (role)
        access_token = create_access_token(
            identity=username,
            additional_claims={"role": user_role}
        )
        
        return jsonify(access_token=access_token, role=user_role), 200

    return jsonify({"msg": "Usuário ou senha incorretos"}), 401

@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Com JWT, o logout é feito no Frontend (apagando o token).
    # O backend apenas confirma.
    return jsonify({"msg": "Logout realizado com sucesso"}), 200