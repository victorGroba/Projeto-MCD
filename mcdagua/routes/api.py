from flask import Blueprint, request, jsonify, current_app
from mcdagua.extensions import cache
import pandas as pd
import numpy as np

api_bp = Blueprint("api", __name__)

# -----------------------------
# Função para carregar e padronizar a aba GERAL
# -----------------------------
def load_geral_dataframe():
    path = current_app.config["EXCEL_PATH"]

    df = pd.read_excel(path, sheet_name="GERAL", header=1)

    # Padronização de nomes
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("utf-8")
        .str.replace(" ", "_")
        .str.replace("(", "")
        .str.replace(")", "")
        .str.replace("?", "")
    )

    # Remover colunas totalmente vazias
    df = df.dropna(how="all", axis=1)

    # Preencher NaN com ""
    df = df.fillna("")

    return df


# -----------------------------
# Função que aplica filtros dinâmicos
# -----------------------------
def apply_filters(df, args):
    filtros = {
        "sigla_loja": args.get("loja"),
        "estado": args.get("estado"),
        "regional": args.get("regional"),
        "mes": args.get("mes"),
        "consultor": args.get("consultor"),
        "gm": args.get("gm"),
        "tipo_restaurante": args.get("tipo_restaurante"),
        "pendencia": args.get("pendencia"),
        "reincidencia": args.get("reincidencia"),
    }

    for coluna, valor in filtros.items():
        if valor:
            df = df[df[coluna].astype(str).str.lower() == valor.lower()]

    # Filtro de ano (via coluna data)
    if args.get("ano"):
        df = df[df["data"].astype(str).str.contains(str(args.get("ano")))]

    return df


# -----------------------------
# API /api/geral
# -----------------------------
@api_bp.route("/geral")
@cache.cached(timeout=60, query_string=True)
def api_geral():
    try:
        df = load_geral_dataframe()

        # Aplicar filtros
        df = apply_filters(df, request.args)

        # Converter datas para string
        if "data" in df.columns:
            df["data"] = df["data"].astype(str)

        # Retorno JSON limpo
        data_json = df.to_dict(orient="records")

        return jsonify({
            "total_registros": len(data_json),
            "colunas": list(df.columns),
            "dados": data_json
        })

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
