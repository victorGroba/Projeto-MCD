# mcdagua/routes/graficos.py
import pandas as pd
from flask import Blueprint, jsonify, current_app
from mcdagua.core.loader import load_all_graphics, load_haccp_graphics_data
from mcdagua.services.excel_processor import processar_aba_geral

graficos_bp = Blueprint("graficos", __name__)

def formatar_dataframe_para_front(nome_grafico, df):
    """
    Formata DataFrames legados. Se for dict/list, retorna direto.
    """
    if isinstance(df, (dict, list)):
        return df

    if df is None or df.empty:
        return {"valores": {}, "labels": []}

    if not isinstance(df.index, pd.RangeIndex):
        df = df.reset_index()

    df = df.fillna(0)
    colunas = df.columns.tolist()
    eixo_x_nome = str(colunas[0])
    eixo_x_valores = df.iloc[:, 0].astype(str).tolist()

    series = {}
    for col in colunas[1:]:
        dados_numericos = pd.to_numeric(df[col], errors='coerce').fillna(0).tolist()
        series[str(col)] = dados_numericos
    
    return {
        "valores": series,
        "labels": eixo_x_valores,
        "regionais": eixo_x_valores,
        "meses": eixo_x_valores,
        "titulo_eixo_x": eixo_x_nome
    }

@graficos_bp.route("/api/graficos-data")
def graficos_data():
    try:
        print("\n🚀 [API] Iniciando processamento de /api/graficos-data")
        
        # 1. Carrega os gráficos EXISTENTES (da aba GRÁFICO PENDENCIA, via loader)
        raw_data = load_all_graphics()
        response_data = {}

        if raw_data:
            for key, df in raw_data.items():
                # Ignora detalhes antigos se vierem do loader, pois vamos regenerar
                if key == "detalhes_parametros": continue 
                
                try:
                    response_data[key] = formatar_dataframe_para_front(key, df)
                except Exception as e:
                    print(f"Erro ao formatar {key}: {e}")
                    response_data[key] = {}
        
        # 2. Carrega os NOVOS GRÁFICOS DETALHADOS (da aba GERAL)
        path_geral = current_app.config.get("PATH_GERAL")
        if path_geral:
            print(f"📂 [API] Processando detalhes da aba GERAL em: {path_geral}")
            dados_geral, erro = processar_aba_geral(path_geral)
            
            if dados_geral and "detalhes_parametros" in dados_geral:
                response_data["detalhes_parametros"] = dados_geral["detalhes_parametros"]
            else:
                print(f"⚠️ [API] Nenhum detalhe encontrado ou erro: {erro}")
        else:
            print("⚠️ [API] PATH_GERAL não configurado.")

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ [CRÍTICO] Erro na rota graficos: {e}")
        return jsonify({"erro": str(e)}), 500

@graficos_bp.route("/api/haccp-graficos")
def haccp_graficos():
    try:
        data = load_haccp_graphics_data()
        response_data = {}
        for cat, val in data.items():
            response_data[cat] = {"labels": list(val.keys()), "values": list(val.values())} if val else {"labels": [], "values": []}
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500