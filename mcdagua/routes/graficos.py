from flask import Blueprint, jsonify
from mcdagua.auth.basic import require_auth
# Adicionado: load_haccp_graphics_data na importação
from mcdagua.core.loader import load_all_graphics, load_haccp_graphics_data
import pandas as pd

graficos_bp = Blueprint("graficos", __name__)

def format_for_frontend(df):
    """
    Converte o DataFrame para JSON seguro (Usado para os gráficos GERAIS antigos).
    """
    # 1. Limpeza básica
    df = df.infer_objects(copy=False).fillna(0)
    
    if df.empty:
        return {"meses": [], "valores": {}}
        
    # 2. Identificar Eixo X (Sempre a coluna na posição 0)
    labels = df.iloc[:, 0].tolist()
    
    # 3. Identificar Eixo Y (Séries - da coluna 1 até o final)
    datasets = {}
    
    for i in range(1, len(df.columns)):
        col_name = str(df.columns[i])
        if col_name in datasets:
            col_name = f"{col_name}_{i}"
        datasets[col_name] = df.iloc[:, i].tolist()
        
    return {
        "meses": labels,      
        "categorias": labels, 
        "regionais": labels,  
        "valores": datasets
    }

# --- ROTA ANTIGA (GERAL) ---
@graficos_bp.route("/api/graficos-data")
@require_auth
def graficos_data():
    try:
        data = load_all_graphics()
        
        data_json = {
            key: format_for_frontend(df) 
            for key, df in data.items()
        }

        return jsonify(data_json)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500

# --- NOVA ROTA (HACCP) ---
@graficos_bp.route("/api/haccp-graficos")
@require_auth
def haccp_graficos():
    try:
        # Carrega os dados da aba GRÁFICO do HACCP
        data = load_haccp_graphics_data()
        
        # Formata para o Chart.js (Arrays de labels e values)
        response_data = {}
        
        for categoria, valores_dict in data.items():
            if valores_dict:
                response_data[categoria] = {
                    "labels": list(valores_dict.keys()),
                    "values": list(valores_dict.values())
                }
            else:
                response_data[categoria] = {"labels": [], "values": []}

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500