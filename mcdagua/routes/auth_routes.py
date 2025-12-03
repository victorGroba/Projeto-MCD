from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt

auth_bp = Blueprint("auth", __name__)

# --- SIMULAÇÃO DE BANCO DE DADOS (Em Memória) ---
USERS_DB = {
    "labmattos": { "password": "Mattos@2025!", "role": "admin_mattos" },
    "gerente_mcd": { "password": "Mcd@2025!", "role": "gerente_geral" },
    "operacao": { "password": "User@123", "role": "operacional" }
}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Dados inválidos"}), 400

    username = data.get("username")
    password = data.get("password")

    user_data = USERS_DB.get(username)

    if user_data and user_data["password"] == password:
        role = user_data["role"]
        access_token = create_access_token(
            identity=username,
            additional_claims={"role": role}
        )
        return jsonify(access_token=access_token, role=role, username=username), 200

    return jsonify({"msg": "Usuário ou senha incorretos"}), 401

# --- NOVOS ENDPOINTS DE GESTÃO (Apenas Admin) ---

@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado"}), 403
    
    # Retorna lista segura (sem senhas)
    users_list = [
        {"username": k, "role": v["role"]} 
        for k, v in USERS_DB.items()
    ]
    return jsonify(users_list), 200

@auth_bp.route("/users", methods=["POST"])
@jwt_required()
def create_user():
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado"}), 403

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({"msg": "Campos obrigatórios faltando"}), 400
    
    if username in USERS_DB:
        return jsonify({"msg": "Usuário já existe"}), 400

    USERS_DB[username] = {"password": password, "role": role}
    return jsonify({"msg": "Usuário criado com sucesso!"}), 201

@auth_bp.route("/users/<username>", methods=["DELETE"])
@jwt_required()
def delete_user(username):
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado"}), 403

    if username == "labmattos":
        return jsonify({"msg": "Não é possível excluir o admin principal"}), 400

    if username in USERS_DB:
        del USERS_DB[username]
        return jsonify({"msg": "Usuário removido"}), 200
    
    return jsonify({"msg": "Usuário não encontrado"}), 404