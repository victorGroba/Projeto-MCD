import pandas as pd
import numpy as np
import unicodedata

def normalizar_texto(texto):
    if not isinstance(texto, str): return str(texto)
    return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('utf-8').lower()

def encontrar_coluna(df, termos_busca):
    colunas_map = {normalizar_texto(c): c for c in df.columns}
    for termo in termos_busca:
        termo_norm = normalizar_texto(termo)
        for col_norm, col_real in colunas_map.items():
            if termo_norm in col_norm:
                return col_real
    return None

def calculate_kpis(df):
    try:
        # Tenta achar colunas
        col_pendencia = encontrar_coluna(df, ['pendencia', 'ocorrencia', 'falha', 'problema', 'descricao'])
        col_regional = encontrar_coluna(df, ['regional', 'regiao'])
        col_mes = encontrar_coluna(df, ['mes', 'data'])

        # Se não achar, usa index como fallback ou string vazia
        if not col_pendencia: 
            # Tenta pegar coluna 4 ou 5 se existir (chute educado)
            if df.shape[1] > 5: col_pendencia = df.columns[5]
            else: df['Pendencia_Dummy'] = 'Não especificado'; col_pendencia = 'Pendencia_Dummy'

        # Filtra linhas de Gelo
        mask_gelo = df.apply(lambda x: x.astype(str).str.contains('Gelo|GELO', case=False).any(), axis=1)
        df_gelo = df[mask_gelo].copy()

        # Calcula Pendências (Top 10)
        if not df_gelo.empty:
            # Value counts
            top = df_gelo[col_pendencia].value_counts().head(10)
            
            # Conversão para tipos nativos do Python (Crucial para JSON)
            labels = [str(x) for x in top.index.tolist()]
            values = [int(x) for x in top.values.tolist()]
            
            res_pend_gelo = {
                "labels": labels,
                "valores": {"Ocorrências": values}
            }
        else:
            res_pend_gelo = {"labels": [], "valores": {"Ocorrências": []}}

        return {
            "pendencias_gelo": res_pend_gelo,
            # Não precisamos retornar backroom/gelo aqui pois o graficos.py vai usar o legado
        }

    except Exception as e:
        print(f"⚠️ [KPIs] Erro ao calcular KPIs: {e}")
        return {}

def get_programado_realizado(df):
    try:
        tipos_validos = ["coleta", "recoleta", "checklist", "check list com coleta", "inauguração"]
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        
        if not col_data: return {"labels": [], "realizado": [], "programado": []}

        df[col_data] = pd.to_datetime(df[col_data], errors='coerce')
        
        if col_tipo:
            df_2026 = df[
                (df[col_data].dt.year == 2026) & 
                (df[col_tipo].astype(str).str.lower().isin(tipos_validos))
            ].copy()
        else:
            df_2026 = df[df[col_data].dt.year == 2026].copy()
        
        realizado_series = df_2026.groupby(df_2026[col_data].dt.month).size()
        
        programado_meta = {1: 193, 2: 103, 3: 76, 4: 211, 5: 186, 6: 221}
        
        labels_meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
        realizado_values = [int(realizado_series.get(m, 0)) for m in range(1, 7)]
        programado_values = [programado_meta.get(m, 0) for m in range(1, 7)]
        
        return {
            "labels": labels_meses,
            "realizado": realizado_values,
            "programado": programado_values
        }

    except Exception as e:
        print(f"⚠️ [KPIs] Erro no Programado vs Realizado: {e}")
        return {"labels": [], "realizado": [], "programado": []}