import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from mcdagua.core.loader import refresh_dataframe

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/upload", methods=["POST"])
@jwt_required()  # Exige o Token JWT no Header
def upload_file():
    # 1. Verificação de Permissão (Role)
    claims = get_jwt()
    user_role = claims.get("role")

    # Apenas 'admin_mattos' pode fazer upload
    if user_role != "admin_mattos":
        return jsonify({"msg": "Acesso negado. Apenas o laboratório pode enviar arquivos."}), 403

    # 2. Validação do Arquivo
    if "file" not in request.files:
        return jsonify({"msg": "Nenhum arquivo enviado."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"msg": "Nenhum arquivo selecionado."}), 400

    if not allowed_file(file.filename):
        return jsonify({"msg": "Formato inválido. Envie um arquivo .xlsx"}), 400

    try:
        # 3. Salvar Arquivo
        save_path = current_app.config["EXCEL_PATH"]
        
        # Garante que o diretório existe
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        file.save(save_path)

        # 4. Recarregar Dados na Memória
        refresh_dataframe()

        return jsonify({"msg": "Base de dados atualizada com sucesso!"}), 200

    except Exception as e:
        print(f"Erro no upload: {e}")
        return jsonify({"msg": f"Erro ao salvar arquivo: {str(e)}"}), 500