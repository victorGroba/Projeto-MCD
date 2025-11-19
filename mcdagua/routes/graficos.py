from flask import Blueprint, jsonify
from mcdagua.auth.basic import require_auth
from mcdagua.core.loader import load_all_graphics # Corrigido para importar do loader certo

graficos_bp = Blueprint("graficos", __name__)

# Rota API que o React vai chamar
@graficos_bp.route("/api/graficos-data")
@require_auth
def graficos_json():
    try:
        # Carrega os dados do Excel
        data = load_all_graphics()
        return jsonify(data), 200
    except Exception as e:
        print(f"Erro ao carregar gráficos: {e}")
        return jsonify({"error": str(e)}), 500