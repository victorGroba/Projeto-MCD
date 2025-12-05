import os
import datetime
from flask import Blueprint, request, jsonify, current_app
from mcdagua.extensions import cache
import pandas as pd
import numpy as np

# --- IMPORTAÇÕES CORRETAS ---
from mcdagua.core.loader import (
    load_geral_dataframe, 
    load_visa_dataframe, 
    load_haccp_dataframe
)
from mcdagua.services.filters import apply_filters

api_bp = Blueprint("api", __name__)

# -----------------------------
# 3. API DE DADOS (/api/geral)
# -----------------------------
@api_bp.route("/geral")
@cache.cached(timeout=10, query_string=True)
def api_geral():
    try:
        # Carrega do loader correto (Potabilidade)
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
# 4. API DE OPÇÕES PARA FILTROS GERAIS (/api/filtros-opcoes)
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

# -----------------------------
# 7. STATUS DOS ARQUIVOS (NOVO)
# -----------------------------
@api_bp.route("/status-arquivos")
def api_status_arquivos():
    """
    Verifica quais arquivos estão disponíveis no servidor e quando foram modificados.
    """
    status = {}
    
    # Mapeia: Chave do JSON -> (Nome da Config, Nome Exibição)
    mapa_arquivos = {
        "geral": ("PATH_GERAL", "Potabilidade (Geral)"),
        "visa":  ("PATH_VISA",  "Coleta VISA"),
        "haccp": ("PATH_HACCP", "Controle HACCP")
    }

    for key, (config_key, label) in mapa_arquivos.items():
        # Busca o caminho configurado no config.py (que veio do .env)
        path = current_app.config.get(config_key)
        
        info = {
            "label": label,
            "existe": False,
            "nome_arquivo": "Não configurado",
            "ultima_modificacao": "-"
        }

        if path:
            # Pega apenas o nome do arquivo para exibir no painel
            info["nome_arquivo"] = os.path.basename(path)
            
            # Verifica se o arquivo existe fisicamente
            if os.path.exists(path):
                info["existe"] = True
                # Pega timestamp da última modificação
                timestamp = os.path.getmtime(path)
                # Formata para data legível (Dia/Mês/Ano Hora:Minuto)
                dt = datetime.datetime.fromtimestamp(timestamp)
                info["ultima_modificacao"] = dt.strftime("%d/%m/%Y às %H:%M")
            else:
                info["nome_arquivo"] += " (Arquivo não encontrado)"
        
        status[key] = info

    return jsonify(status)