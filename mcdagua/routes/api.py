from flask import Blueprint, request, jsonify, current_app
from mcdagua.extensions import cache
import pandas as pd
import numpy as np

# --- IMPORTAÇÕES CORRETAS (Centralizadas para evitar erros circulares) ---
from mcdagua.core.loader import (
    load_geral_dataframe, 
    load_visa_dataframe, 
    load_haccp_dataframe
)
from mcdagua.services.filters import apply_filters

api_bp = Blueprint("api", __name__)

# -----------------------------
# 3. API de Dados (/api/geral)
# -----------------------------
@api_bp.route("/geral")
@cache.cached(timeout=10, query_string=True)
def api_geral():
    try:
        # Agora carrega do loader correto
        df = load_geral_dataframe()
        
        # Aplica filtros (busca e colunas específicas)
        df = apply_filters(df, request.args)
        
        data_json = df.astype(str).to_dict(orient="records")
        colunas = list(df.columns)

        return jsonify({
            "total_registros": len(data_json),
            "colunas": colunas,
            "dados": data_json
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500

# -----------------------------
# 4. API de Opções para Filtros GERAIS (/api/filtros-opcoes)
# -----------------------------
@api_bp.route("/filtros-opcoes")
@cache.cached(timeout=300)
def api_filtros_opcoes():
    """Retorna listas de valores únicos para preencher os Dropdowns da tela Geral (Legacy)"""
    try:
        df = load_geral_dataframe()
        
        # Mapeamento para a tela Geral (Legacy)
        mapa_colunas = {
            "regional": ["regional", "reg"],
            "estado": ["estado", "uf", "est"],
            "sigla_loja": ["sigla_loja", "sigla", "loja", "codigo"],
            "mes": ["mes", "month"],
            "consultor": ["consultor", "cons"],
            "gm": ["gm", "gerente", "gerente_de_mercado"],
            "tipo_restaurante": ["tipo_restaurante", "tipo_rest", "tipo"],
            "pendencia": ["pendencia", "status_pendencia"],
            "reincidencia": ["reincidencia", "reincidente"]
        }
        
        opcoes = {}
        for chave_filtro, possiveis_nomes in mapa_colunas.items():
            coluna_encontrada = None
            for nome in possiveis_nomes:
                if nome in df.columns:
                    coluna_encontrada = nome
                    break
            
            if coluna_encontrada:
                unicos = sorted(list(set(df[coluna_encontrada].astype(str).dropna().unique())))
                opcoes[chave_filtro] = [x for x in unicos if x.strip() != ""]
                opcoes[f"{chave_filtro}_col_name"] = coluna_encontrada
            else:
                opcoes[chave_filtro] = []

        return jsonify(opcoes)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# -----------------------------
# 5. API VISA (/api/visa) - COM FILTROS DINÂMICOS
# -----------------------------
@api_bp.route("/visa")
@cache.cached(timeout=10, query_string=True)
def api_visa():
    try:
        df = load_visa_dataframe()
        
        if df.empty:
            return jsonify({"dados": [], "colunas": [], "opcoes_filtro": {}})

        # 1. Aplica Filtros (inclui busca 'q' e filtros de coluna)
        df_filtrado = apply_filters(df, request.args)
            
        data_json = df_filtrado.to_dict(orient="records")
        colunas = list(df.columns)
        
        # 2. Gera Opções de Filtro (Baseado no DF original completo para não sumir opções)
        filtros_disponiveis = {}
        
        # Limite de segurança para dropdowns
        LIMITE_OPCOES = 100 
        
        for col in colunas:
            # Pega valores únicos da coluna original
            unicos = sorted(list(set(df[col].astype(str).dropna().unique())))
            
            # Só manda opções se não for texto livre gigante ou quase vazio
            if 1 < len(unicos) < LIMITE_OPCOES: 
                filtros_disponiveis[col] = [x for x in unicos if x.strip() != ""]

        return jsonify({
            "dados": data_json, 
            "colunas": colunas,
            "opcoes_filtro": filtros_disponiveis
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# -----------------------------
# 6. API HACCP (/api/haccp) - COM FILTROS DINÂMICOS
# -----------------------------
@api_bp.route("/haccp")
@cache.cached(timeout=10, query_string=True)
def api_haccp():
    try:
        df = load_haccp_dataframe()
        
        if df.empty:
            return jsonify({"dados": [], "colunas": [], "opcoes_filtro": {}})

        # 1. Aplica Filtros
        df_filtrado = apply_filters(df, request.args)

        data_json = df_filtrado.to_dict(orient="records")
        colunas = list(df.columns)

        # 2. Gera Opções de Filtro
        filtros_disponiveis = {}
        LIMITE_OPCOES = 100

        for col in colunas:
            unicos = sorted(list(set(df[col].astype(str).dropna().unique())))
            if 1 < len(unicos) < LIMITE_OPCOES:
                filtros_disponiveis[col] = [x for x in unicos if x.strip() != ""]

        return jsonify({
            "dados": data_json, 
            "colunas": colunas,
            "opcoes_filtro": filtros_disponiveis
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500