from flask import Blueprint, jsonify
from mcdagua.auth.basic import require_auth
from mcdagua.core.loader import load_all_graphics
import pandas as pd

graficos_bp = Blueprint("graficos", __name__)

def format_for_frontend(df):
    """
    Converte o DataFrame para JSON seguro, acessando colunas pela POSIÇÃO (.iloc)
    para evitar erros caso existam colunas com nomes duplicados no Excel.
    """
    # 1. Limpeza básica
    df = df.fillna(0)
    
    if df.empty:
        return {"meses": [], "valores": {}}
        
    # 2. Identificar Eixo X (Sempre a coluna na posição 0)
    # Usa iloc[:, 0] para garantir que pega apenas a primeira coluna
    labels = df.iloc[:, 0].tolist()
    
    # 3. Identificar Eixo Y (Séries - da coluna 1 até o final)
    datasets = {}
    
    # Itera pelo ÍNDICE das colunas (1, 2, 3...) em vez do nome
    for i in range(1, len(df.columns)):
        # Pega o nome original da coluna
        col_name = str(df.columns[i])
        
        # Se já existe uma série com esse nome, adiciona um sufixo (ex: "2024_2")
        if col_name in datasets:
            col_name = f"{col_name}_{i}"
            
        # O SEGRED0: iloc[:, i] pega exatamente a coluna daquela posição como lista
        datasets[col_name] = df.iloc[:, i].tolist()
        
    # 4. Retorno Genérico
    return {
        "meses": labels,      
        "categorias": labels, 
        "regionais": labels,  
        "valores": datasets
    }

@graficos_bp.route("/api/graficos-data")
@require_auth
def graficos_data():
    try:
        # Carrega dados brutos
        data = load_all_graphics()
        
        # Formata cada bloco de dados com a nova função segura
        data_json = {
            key: format_for_frontend(df) 
            for key, df in data.items()
        }

        return jsonify(data_json)

    except Exception as e:
        # Imprime o erro completo no terminal para facilitar a análise
        import traceback
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500