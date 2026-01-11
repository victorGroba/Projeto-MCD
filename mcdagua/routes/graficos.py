import pandas as pd
import numpy as np
from flask import Blueprint, jsonify
# from mcdagua.auth.basic import require_auth
from mcdagua.core.loader import load_all_graphics, load_haccp_graphics_data

graficos_bp = Blueprint("graficos", __name__)

def formatar_dataframe_para_front(nome_grafico, df):
    """
    Formata o DataFrame para o Frontend, garantindo que Rótulos (Index)
    sejam tratados corretamente como Coluna 0.
    """
    if df is None or df.empty:
        print(f"⚠️ [DEBUG] Gráfico '{nome_grafico}' está vazio.")
        return {"valores": {}, "labels": []}

    # 1. TRATAMENTO DE ÍNDICE (O Pulo do Gato)
    # Se o índice não for numérico padrão (0, 1, 2...), significa que ele contem os Rótulos (Ex: SP, RJ).
    # Precisamos "resetar" o índice para que ele vire a Coluna 0.
    if not isinstance(df.index, pd.RangeIndex):
        print(f"🔄 [DEBUG] '{nome_grafico}': Resetando índice para capturar rótulos (ex: {df.index.name}).")
        df = df.reset_index()

    # 2. Limpeza (NaN -> 0) e Garantia de Dados Numéricos nas séries
    df = df.fillna(0)

    # 3. IDENTIFICAÇÃO DOS EIXOS
    # Agora temos certeza: Coluna 0 = Labels, Coluna 1+ = Valores
    colunas = df.columns.tolist()
    
    # Eixo X (Labels) - Pega a primeira coluna
    eixo_x_nome = str(colunas[0])
    eixo_x_valores = df.iloc[:, 0].astype(str).tolist()

    print(f"📊 [DEBUG] '{nome_grafico}' -> Eixo X ({eixo_x_nome}): {eixo_x_valores[:3]}...")

    # Eixo Y (Séries) - Pega do índice 1 em diante
    series = {}
    for col in colunas[1:]:
        # Converte para números de forma segura (erros viram 0)
        # O Frontend PRECISA de números puros, não strings
        dados_numericos = pd.to_numeric(df[col], errors='coerce').fillna(0).tolist()
        series[str(col)] = dados_numericos
    
    # Debug para ver se tem valores
    qtd_series = len(series)
    print(f"📈 [DEBUG] '{nome_grafico}' -> {qtd_series} Séries de dados processadas.")

    # 4. RETORNO ROBUSTO (Compatível com qualquer chave que o React procurar)
    return {
        "valores": series,
        
        # Envia os mesmos rótulos para todas as chaves possíveis
        "regional": eixo_x_valores,
        "regionais": eixo_x_valores,
        "meses": eixo_x_valores,
        "status": eixo_x_valores,
        "labels": eixo_x_valores,
        
        # Meta info
        "titulo_eixo_x": eixo_x_nome
    }

# --- ROTA DA POTABILIDADE ---
@graficos_bp.route("/api/graficos-data")
# @require_auth
def graficos_data():
    try:
        print("\n🚀 [API] Iniciando processamento de /api/graficos-data")
        raw_data = load_all_graphics()
        
        response_data = {}

        if raw_data:
            print(f"📂 [API] Tabelas encontradas no loader: {list(raw_data.keys())}")
            
            for key, df in raw_data.items():
                try:
                    # Passamos o nome da chave para facilitar o debug
                    response_data[key] = formatar_dataframe_para_front(key, df)
                except Exception as e_inner:
                    print(f"❌ [ERRO] Falha ao formatar gráfico '{key}': {e_inner}")
                    response_data[key] = {"valores": {}, "labels": []}
        else:
            print("⚠️ [API] O loader retornou vazio (Verifique se a aba GRÁFICO PENDENCIA existe).")
            # Retorna estrutura vazia válida
            return jsonify({}), 200

        print("✅ [API] Resposta JSON gerada com sucesso.\n")
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ [CRÍTICO] Erro geral na rota: {e}")
        return jsonify({"erro": str(e)}), 500


# --- ROTA HACCP ---
@graficos_bp.route("/api/haccp-graficos")
# @require_auth
def haccp_graficos():
    try:
        data = load_haccp_graphics_data()
        
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