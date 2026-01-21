import os
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt

auth_bp = Blueprint("auth", __name__)

# --- ARQUIVO DE PERSISTÊNCIA ---
DB_FILE = "users.json"

# Usuários Padrão
DEFAULT_USERS = {
    "labmattos": { "password": "Mattos@2025!", "role": "admin_mattos" },
    "gerente_mcd": { "password": "Mcd@2025!", "role": "gerente_geral" },
    "operacao": { "password": "User@123", "role": "operacional" }
}

def load_users():
    """Carrega usuários do arquivo JSON ou retorna os padrões"""
    if not os.path.exists(DB_FILE):
        save_users(DEFAULT_USERS)
        return DEFAULT_USERS
    
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_USERS

def save_users(users_data):
    """Salva o dicionário de usuários no arquivo JSON"""
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, indent=4)
    except Exception as e:
        print(f"Erro ao salvar usuários: {e}")

# --- ROTA DE LOGIN (MANTIDA NO RAIZ PARA NÃO QUEBRAR O FRONT) ---

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Dados inválidos"}), 400

    username = data.get("username")
    password = data.get("password")

    # Carrega sempre a versão mais recente
    users_db = load_users()
    user_data = users_db.get(username)

    if user_data and user_data["password"] == password:
        role = user_data["role"]
        access_token = create_access_token(
            identity=username,
            additional_claims={"role": role}
        )
        return jsonify(access_token=access_token, role=role, username=username), 200

    return jsonify({"msg": "Usuário ou senha incorretos"}), 401

# --- ENDPOINTS DE GESTÃO (PREFIXO /api ADICIONADO PARA O NGINX ACEITAR) ---

@auth_bp.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado. Apenas admin pode ver usuários."}), 403
    
    users_db = load_users()
    
    # Retorna lista segura (sem senhas)
    users_list = [
        {"username": k, "role": v["role"]} 
        for k, v in users_db.items()
    ]
    return jsonify(users_list), 200

@auth_bp.route("/api/users", methods=["POST"])
@jwt_required()
def create_user():
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado. Apenas admin pode criar usuários."}), 403

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({"msg": "Preencha usuário, senha e perfil."}), 400
    
    users_db = load_users()

    if username in users_db:
        return jsonify({"msg": "Este nome de usuário já existe."}), 400

    # Adiciona e Salva
    users_db[username] = {"password": password, "role": role}
    save_users(users_db)

    return jsonify({"msg": "Usuário criado com sucesso!"}), 201

@auth_bp.route("/api/users/<username>", methods=["DELETE"])
@jwt_required()
def delete_user(username):
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado."}), 403

    if username == "labmattos":
        return jsonify({"msg": "Não é possível excluir o admin principal"}), 400

    users_db = load_users()

    if username in users_db:
        del users_db[username]
        save_users(users_db)
        return jsonify({"msg": "Usuário removido com sucesso."}), 200
    
    return jsonify({"msg": "Usuário não encontrado"}), 404