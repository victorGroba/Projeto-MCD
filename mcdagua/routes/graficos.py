import pandas as pd
import os
from flask import Blueprint, jsonify, current_app
from mcdagua.core.loader import load_geral_dataframe, load_haccp_graphics_data
from mcdagua.services.excel_processor import (
    ler_range_exato, 
    processar_evolucao_anual_anos, # NOVA FUNÇÃO
    processar_regional_ok_nok,     # RENOMEADA para clareza
    processar_status_bloco, 
    processar_pendencias_top,
    processar_aba_geral
)
from mcdagua.services.kpis import get_programado_realizado

graficos_bp = Blueprint("graficos", __name__)

def get_safe_path():
    path = current_app.config.get("PATH_GERAL")
    if path and os.path.exists(path): return path
    path_docker = "/app/arquivos_sistema/Planilhamcd.xlsx"
    if os.path.exists(path_docker): return path_docker
    return None

@graficos_bp.route("/api/graficos-data")
def graficos_data():
    try:
        print("\n🚀 [API] Lendo gráficos dos intervalos fixos...")
        response_data = {}
        path = get_safe_path()
        if not path: return jsonify({"erro": "Planilha não encontrada"}), 500

        ABA = "Gráfico pendencia"

        # 1. EVOLUÇÃO ANUAL (K3:N15) -> AGORA LÊ ANOS (2023, 2024...)
        print(f"📂 Lendo Anual: {ABA} K3:N15")
        df_anual = ler_range_exato(path, ABA, "3:15", usecols="K:N")
        # Usa a função nova que entende colunas de anos
        response_data["restaurante_anual"] = processar_evolucao_anual_anos(df_anual)

        # 2. PENDÊNCIAS POR REGIONAL (K20:O32) -> Mantém OK/NOK
        print(f"📂 Lendo Regional: {ABA} K20:O32")
        df_regional = ler_range_exato(path, ABA, "20:32", usecols="K:O")
        response_data["restaurante_regional"] = processar_regional_ok_nok(df_regional)

        # 3. BACK ROOM STATUS (K38:O42)
        print(f"📂 Lendo Back Room: {ABA} K38:O42")
        df_back = ler_range_exato(path, ABA, "38:42", usecols="K:O")
        response_data["backroom"] = processar_status_bloco(df_back)

        # 4. GELO STATUS (K50:O54)
        print(f"📂 Lendo Gelo Status: {ABA} K50:O54")
        df_gelo = ler_range_exato(path, ABA, "50:54", usecols="K:O")
        response_data["gelo"] = processar_status_bloco(df_gelo)

        # 5. PENDÊNCIAS GELO (K65:N69)
        print(f"📂 Lendo Pendências Gelo: {ABA} K65:N69")
        df_pend = ler_range_exato(path, ABA, "65:69", usecols="K:N")
        response_data["pendencias_gelo"] = processar_pendencias_top(df_pend)

        # Extras
        df_geral = load_geral_dataframe()
        response_data["programado_realizado"] = get_programado_realizado(df_geral)
        try:
            dados_geral, _ = processar_aba_geral(path)
            if dados_geral and "detalhes_parametros" in dados_geral:
                response_data["detalhes_parametros"] = dados_geral["detalhes_parametros"]
        except: pass

        return jsonify(response_data)
    except Exception as e:
        print(f"❌ [CRÍTICO] Erro: {e}")
        import traceback
        traceback.print_exc()
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