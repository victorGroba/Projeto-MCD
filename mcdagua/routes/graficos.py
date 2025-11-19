from flask import Blueprint, jsonify
from mcdagua.auth.basic import require_auth
from mcdagua.core.loader import load_all_graphics

graficos_bp = Blueprint("graficos", __name__)


def df_safe(df):
    """
    Converte um DataFrame em JSON seguro:
    - Garante que todas as colunas são strings (evita erro int < str)
    - Garante que não existam colunas duplicadas (Programa, Programa_2...)
    - Troca NaN por string vazia
    - Retorna lista de registros aceitável pelo React
    """

    # 1. Converter todas as colunas para string
    df.columns = ["" if c is None else str(c) for c in df.columns]

    # 2. Garantir nomes únicos
    if len(df.columns) != len(set(df.columns)):
        seen = {}
        new_cols = []
        for col in df.columns:
            if col not in seen:
                seen[col] = 1
                new_cols.append(col)
            else:
                seen[col] += 1
                new_cols.append(f"{col}_{seen[col]}")
        df.columns = new_cols

    # 3. Trocar NaN por vazio
    df = df.fillna("")

    # 4. Retornar JSON seguro
    return df.to_dict(orient="records")


# ============================
# ROTA JSON — usada pelo React
# ============================
@graficos_bp.route("/api/graficos-data")
@require_auth
def graficos_data():
    try:
        data = load_all_graphics()

        # Converte todos os DataFrames para JSON seguro
        data_json = {
            chave: df_safe(df)
            for chave, df in data.items()
        }

        return jsonify(data_json)

    except Exception as e:
        print("Erro ao carregar gráficos:", e)
        return jsonify({"erro": str(e)}), 500
