from flask import Blueprint, request, jsonify, current_app
from mcdagua.extensions import cache
import pandas as pd
import numpy as np

api_bp = Blueprint("api", __name__)

# -----------------------------
# 1. Carregamento da Planilha
# -----------------------------
def load_geral_dataframe():
    path = current_app.config["EXCEL_PATH"]

    # --- CORREÇÃO PRINCIPAL AQUI ---
    # header=1 : Pula a primeira linha (Título "CONSOLIDADO...") e usa a segunda como cabeçalho.
    # Se ainda der erro, tente header=2.
    try:
        df = pd.read_excel(path, sheet_name="GERAL", header=1)
    except Exception as e:
        print(f"Erro ao ler Excel: {e}")
        return pd.DataFrame()

    # Limpeza e Padronização dos Nomes das Colunas
    # Ex: "Sigla Loja" -> "sigla_loja", "Mês" -> "mes"
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("utf-8")
        .str.replace(" ", "_")
        .str.replace("/", "_")
        .str.replace("(", "")
        .str.replace(")", "")
        .str.replace(".", "")
    )

    # Remove colunas que não têm nome (geradas por células vazias no header)
    df = df.loc[:, ~df.columns.str.contains('^unnamed')]
    
    # Remove colunas/linhas que estão totalmente vazias
    df = df.dropna(how="all", axis=1)
    df = df.dropna(how="all", axis=0)

    # Preenche valores nulos com vazio para o JSON não quebrar
    df = df.fillna("")

    return df

# -----------------------------
# 2. Filtros Dinâmicos
# -----------------------------
def apply_filters(df, args):
    # Parâmetros de paginação/controle que não são colunas
    ignore_keys = ["page", "limit", "per_page", "offset", "_"]

    for col, val in args.items():
        if col in ignore_keys or not val:
            continue
        
        # Aplica filtro se a coluna existir (case insensitive e parcial)
        if col in df.columns:
            df = df[df[col].astype(str).str.lower().str.contains(str(val).lower(), regex=False)]
    
    return df

# -----------------------------
# 3. API de Dados (/api/geral)
# -----------------------------
@api_bp.route("/geral")
@cache.cached(timeout=10, query_string=True)
def api_geral():
    try:
        df = load_geral_dataframe()

        # Aplica os filtros vindos do Frontend
        df = apply_filters(df, request.args)

        # Converte para dicionário
        data_json = df.astype(str).to_dict(orient="records")
        colunas = list(df.columns)

        return jsonify({
            "total_registros": len(data_json),
            "colunas": colunas,
            "dados": data_json
        })

    except Exception as e:
        # Imprime o erro no terminal para ajudar no debug
        import traceback
        traceback.print_exc()
        return jsonify({"erro": str(e)}), 500

# -----------------------------
# 4. API de Opções para Filtros (/api/filtros-opcoes)
# -----------------------------
@api_bp.route("/filtros-opcoes")
@cache.cached(timeout=300)
def api_filtros_opcoes():
    """Retorna listas de valores únicos para preencher os Dropdowns"""
    try:
        df = load_geral_dataframe()
        
        # Mapeamento inteligente de colunas (Nome no Front -> Nome provável no Excel)
        # Isso ajuda se o nome na planilha mudar um pouco (ex: "Sigla" ou "Sigla Loja")
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

        # Para cada filtro desejado, procura qual coluna do Excel corresponde
        for chave_filtro, possiveis_nomes in mapa_colunas.items():
            coluna_encontrada = None
            
            # Tenta achar a coluna no DataFrame
            for nome in possiveis_nomes:
                if nome in df.columns:
                    coluna_encontrada = nome
                    break
            
            # Se achou, pega os valores únicos
            if coluna_encontrada:
                unicos = sorted(list(set(df[coluna_encontrada].astype(str).dropna().unique())))
                opcoes[chave_filtro] = [x for x in unicos if x.strip() != ""]
                # Envia também qual é o nome real da coluna para o frontend usar no filtro
                opcoes[f"{chave_filtro}_col_name"] = coluna_encontrada
            else:
                opcoes[chave_filtro] = []

        return jsonify(opcoes)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500