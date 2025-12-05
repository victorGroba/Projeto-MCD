import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from mcdagua.core.loader import refresh_dataframe

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/upload/<tipo_arquivo>", methods=["POST"])
@jwt_required()
def upload_file(tipo_arquivo):
    # 1. Verificação de Permissão
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado."}), 403

    # 2. Validação do Arquivo
    if "file" not in request.files:
        return jsonify({"msg": "Nenhum arquivo enviado."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"msg": "Nenhum arquivo selecionado."}), 400

    if not allowed_file(file.filename):
        return jsonify({"msg": "Formato inválido. Envie um arquivo .xlsx"}), 400

    # 3. Define onde salvar
    if tipo_arquivo == "geral":
        save_path = current_app.config.get("PATH_GERAL")
    elif tipo_arquivo == "visa":
        save_path = current_app.config.get("PATH_VISA")
    elif tipo_arquivo == "haccp":
        save_path = current_app.config.get("PATH_HACCP")
    else:
        return jsonify({"msg": "Tipo de arquivo inválido."}), 400

    if not save_path:
        return jsonify({"msg": f"Caminho não configurado para {tipo_arquivo}."}), 500

    try:
        # Garante que o diretório existe
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Salva o arquivo sobrescrevendo o antigo
        file.save(save_path)

        # Limpa cache
        refresh_dataframe()

        return jsonify({"msg": f"Arquivo {tipo_arquivo.upper()} atualizado com sucesso!"}), 200

    except Exception as e:
        print(f"Erro no upload: {e}")
        return jsonify({"msg": f"Erro ao salvar arquivo: {str(e)}"}), 500