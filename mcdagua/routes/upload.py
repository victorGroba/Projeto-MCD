import os
import shutil
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt
from mcdagua.core.loader import refresh_dataframe
# Importa o serviço que criamos para processar os dados estatísticos
from mcdagua.services.excel_processor import processar_aba_geral

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def realizar_backup(caminho_atual):
    """Cria uma cópia do arquivo atual na pasta 'backups' antes de sobrescrever."""
    if os.path.exists(caminho_atual):
        try:
            diretorio = os.path.dirname(caminho_atual)
            pasta_backup = os.path.join(diretorio, "backups")
            os.makedirs(pasta_backup, exist_ok=True)
            
            nome_arquivo = os.path.basename(caminho_atual)
            nome, ext = os.path.splitext(nome_arquivo)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            novo_nome = f"{nome}_{timestamp}{ext}"
            caminho_backup = os.path.join(pasta_backup, novo_nome)
            
            shutil.copy2(caminho_atual, caminho_backup)
            print(f"📦 [BACKUP] Arquivo salvo em: {caminho_backup}")
        except Exception as e:
            print(f"⚠️ [BACKUP] Falha ao criar backup: {e}")

@upload_bp.route("/upload/<tipo_arquivo>", methods=["POST"])
@jwt_required()
def upload_file(tipo_arquivo):
    claims = get_jwt()
    if claims.get("role") != "admin_mattos":
        return jsonify({"msg": "Acesso negado."}), 403

    if "file" not in request.files:
        return jsonify({"msg": "Nenhum arquivo enviado."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"msg": "Nenhum arquivo selecionado."}), 400

    if not allowed_file(file.filename):
        return jsonify({"msg": "Formato inválido. Use .xlsx"}), 400

    mapa_config = {
        "geral": "PATH_GERAL",
        "visa": "PATH_VISA",
        "haccp": "PATH_HACCP"
    }
    
    if tipo_arquivo not in mapa_config:
        return jsonify({"msg": "Tipo inválido."}), 400

    save_path = current_app.config.get(mapa_config[tipo_arquivo])

    if not save_path:
        return jsonify({"msg": f"Caminho não configurado para {tipo_arquivo}."}), 500

    try:
        # 1. Preparação e Backup
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        realizar_backup(save_path)
        
        # 2. Salvar o arquivo
        file.save(save_path)
        
        # 3. Atualizar DataFrames globais
        refresh_dataframe()
        
        # 4. Processamento Específico (Novidade aqui)
        response_data = {"msg": f"Upload de {tipo_arquivo} realizado com sucesso!"}

        if tipo_arquivo == "geral":
            print(f"⚙️ [PROCESSAMENTO] Iniciando análise estatística da aba GERAL...")
            dados_dashboard, erro = processar_aba_geral(save_path)
            
            if erro:
                print(f"⚠️ [PROCESSAMENTO] Aviso: {erro}")
                # Adiciona aviso na resposta, mas não falha o upload (arquivo já foi salvo)
                response_data["warning"] = f"Arquivo salvo, mas houve erro ao gerar gráficos: {erro}"
            else:
                print("✅ [PROCESSAMENTO] Dados estatísticos gerados com sucesso.")
                # Anexa os dados processados ao JSON de resposta
                response_data["dashboard_data"] = dados_dashboard

        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ Erro no upload: {e}")
        return jsonify({"msg": f"Erro interno: {str(e)}"}), 500

# --- ROTA DE DOWNLOAD ---
@upload_bp.route("/download/<tipo_arquivo>", methods=["GET"])
@jwt_required()
def download_file(tipo_arquivo):
    mapa_config = {
        "geral": "PATH_GERAL",
        "visa": "PATH_VISA",
        "haccp": "PATH_HACCP"
    }
    
    mapa_nomes = {
        "geral": "Planilha_Potabilidade.xlsx",
        "visa": "Planilha_VISA.xlsx",
        "haccp": "Planilha_HACCP.xlsx"
    }

    if tipo_arquivo not in mapa_config:
        return jsonify({"msg": "Tipo inválido."}), 400

    path = current_app.config.get(mapa_config[tipo_arquivo])

    # Debug para ver onde ele está procurando
    print(f"🔍 [DOWNLOAD] Tentando baixar: {tipo_arquivo}")
    print(f"📂 [DOWNLOAD] Caminho configurado: {path}")

    if not path or not os.path.exists(path):
        return jsonify({"msg": "Arquivo não encontrado no servidor. Faça um upload primeiro."}), 404

    try:
        return send_file(
            path,
            as_attachment=True,
            download_name=mapa_nomes[tipo_arquivo],
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print(f"❌ Erro no download: {e}")
        return jsonify({"msg": "Erro ao baixar arquivo."}), 500