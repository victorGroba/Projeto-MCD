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
        # Tipos válidos conforme a planilha (exclui "não realizada" e vazias)
        tipos_validos = [
            "coleta", "recoleta", 
            "check list", "check list com coleta",
            "cronograma", 
            "inauguração", "inauguracao"
        ]
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        col_mes = encontrar_coluna(df, ['mes'])
        
        if not col_tipo: return {"labels": [], "realizado": [], "programado": []}

        df_work = df.copy()
        df_work['_tipo_norm'] = df_work[col_tipo].astype(str).str.lower().str.strip()
        
        # Determina o mês de cada linha
        meses_map = {
            "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3,
            "abril": 4, "maio": 5, "junho": 6,
            "julho": 7, "agosto": 8, "setembro": 9,
            "outubro": 10, "novembro": 11, "dezembro": 12
        }
        
        # SEMPRE filtra ano 2026 pela coluna data
        if col_data:
            df_work[col_data] = pd.to_datetime(df_work[col_data], errors='coerce')
            df_work = df_work[df_work[col_data].dt.year == 2026]
        
        # Usa coluna 'mes' para identificar o mês (mais confiável), senão usa 'data'
        if col_mes:
            df_work['_mes_num'] = df_work[col_mes].astype(str).str.lower().str.strip().map(meses_map)
        elif col_data:
            df_work['_mes_num'] = df_work[col_data].dt.month
        else:
            return {"labels": [], "realizado": [], "programado": []}
        
        # Filtra apenas tipos válidos
        df_validos = df_work[df_work['_tipo_norm'].isin(tipos_validos)]
        
        # Conta realizados por mês
        realizado_series = df_validos.groupby('_mes_num').size()
        
        programado_meta = {1: 193, 2: 103, 3: 76, 4: 211, 5: 186, 6: 221}
        
        labels_meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
        realizado_values = [int(realizado_series.get(m, 0)) for m in range(1, 7)]
        programado_values = [programado_meta.get(m, 0) for m in range(1, 7)]
        
        print(f"📊 [KPIs] Programado vs Realizado - Realizado: {realizado_values}")
        
        return {
            "labels": labels_meses,
            "realizado": realizado_values,
            "programado": programado_values
        }

    except Exception as e:
        print(f"⚠️ [KPIs] Erro no Programado vs Realizado: {e}")
        import traceback; traceback.print_exc()
        return {"labels": [], "realizado": [], "programado": []}


def get_tipo_coleta_por_mes(df):
    """
    Gráfico 2: Tipo de Coleta por Mês (2026).
    Conta por mês:
      - Coleta: tipo_de_coleta in [cronograma, coleta, inauguração, inauguracao]
      - Recoleta: tipo_de_coleta == recoleta
      - Checklist: tipo_de_coleta in [check list, check list com coleta]
    """
    try:
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        col_mes = encontrar_coluna(df, ['mes'])
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        
        if not col_tipo:
            return {"labels": [], "coleta": [], "recoleta": [], "checklist": []}

        df_work = df.copy()
        df_work['_tipo_norm'] = df_work[col_tipo].astype(str).str.lower().str.strip()
        
        # Mapa de meses
        meses_map = {
            "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3,
            "abril": 4, "maio": 5, "junho": 6,
            "julho": 7, "agosto": 8, "setembro": 9,
            "outubro": 10, "novembro": 11, "dezembro": 12
        }
        
        # SEMPRE filtra ano 2026 pela coluna data
        if col_data:
            df_work[col_data] = pd.to_datetime(df_work[col_data], errors='coerce')
            df_work = df_work[df_work[col_data].dt.year == 2026]
        
        # Usa coluna 'mes' para identificar o mês (mais confiável), senão usa 'data'
        if col_mes:
            df_work['_mes_num'] = df_work[col_mes].astype(str).str.lower().str.strip().map(meses_map)
        elif col_data:
            df_work['_mes_num'] = df_work[col_data].dt.month
        else:
            return {"labels": [], "coleta": [], "recoleta": [], "checklist": []}
        
        tipos_coleta = ["cronograma", "coleta", "inauguração", "inauguracao"]
        tipos_recoleta = ["recoleta"]
        tipos_checklist = ["check list", "check list com coleta"]
        
        meses_labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                        "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        
        coleta_vals = []
        recoleta_vals = []
        checklist_vals = []
        
        for m in range(1, 13):
            df_mes = df_work[df_work['_mes_num'] == m]
            coleta_rows = df_mes[df_mes['_tipo_norm'].isin(tipos_coleta)]
            recoleta_rows = df_mes[df_mes['_tipo_norm'].isin(tipos_recoleta)]
            checklist_rows = df_mes[df_mes['_tipo_norm'].isin(tipos_checklist)]
            
            # Debug detalhado para Janeiro (m = 1)
            if m == 1:
                print(f"🔍 [DEBUG TIPO COLETA] JANEIRO 2026 - Encontradas {len(coleta_rows)} coletas.")
                print(f"Valores reais que entraram na contagem de 'coleta':")
                if not coleta_rows.empty:
                    print(coleta_rows['_tipo_norm'].value_counts().to_string())
            
            coleta_vals.append(int(coleta_rows.shape[0]))
            recoleta_vals.append(int(recoleta_rows.shape[0]))
            checklist_vals.append(int(checklist_rows.shape[0]))
        
        # Retorna apenas os meses que têm dados
        ultimo_mes_com_dados = 0
        for i in range(11, -1, -1):
            if coleta_vals[i] + recoleta_vals[i] + checklist_vals[i] > 0:
                ultimo_mes_com_dados = i + 1
                break
        
        if ultimo_mes_com_dados == 0:
            ultimo_mes_com_dados = 6
        
        print(f"📊 [KPIs] Tipo de Coleta - Coleta: {coleta_vals[:ultimo_mes_com_dados]}, Recoleta: {recoleta_vals[:ultimo_mes_com_dados]}, Checklist: {checklist_vals[:ultimo_mes_com_dados]}")
        
        return {
            "labels": meses_labels[:ultimo_mes_com_dados],
            "coleta": coleta_vals[:ultimo_mes_com_dados],
            "recoleta": recoleta_vals[:ultimo_mes_com_dados],
            "checklist": checklist_vals[:ultimo_mes_com_dados]
        }
    except Exception as e:
        print(f"⚠️ [KPIs] Erro no Tipo de Coleta: {e}")
        import traceback; traceback.print_exc()
        return {"labels": [], "coleta": [], "recoleta": [], "checklist": []}


def get_nao_conformidade_por_gerente(df):
    """
    Gráfico 3: Índice de Não Conformidade por Gerente de Mercado.
    Filtra linhas onde pendência NÃO é vazia/ok/na,
    agrupa por coluna 'gm' (Gerente de Mercado) e conta ocorrências.
    """
    try:
        col_pendencia = encontrar_coluna(df, ['pendencia', 'ocorrencia', 'status_pendencia'])
        col_gm = encontrar_coluna(df, ['gm', 'gerente', 'gerente_de_mercado'])
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        
        if not col_pendencia or not col_gm:
            return {"labels": [], "valores": []}

        df_work = df.copy()
        df_work['_pend_norm'] = df_work[col_pendencia].astype(str).str.lower().str.strip()
        
        # Filtra 2026 se possível
        if col_data:
            df_work[col_data] = pd.to_datetime(df_work[col_data], errors='coerce')
            df_work = df_work[df_work[col_data].dt.year == 2026]
        
        # Filtra apenas linhas COM pendência real (não vazia, não ok, não na)
        invalidos = ["", "ok", "na", "n/a", "nan", "none", "-"]
        df_pendentes = df_work[~df_work['_pend_norm'].isin(invalidos)]
        
        if df_pendentes.empty:
            return {"labels": [], "valores": []}
        
        # Agrupa por gerente e conta
        contagem = df_pendentes[col_gm].astype(str).str.strip().value_counts()
        # Remove gerentes vazios
        contagem = contagem[contagem.index.str.strip() != ""]
        
        labels = [str(x) for x in contagem.index.tolist()]
        valores = [int(x) for x in contagem.values.tolist()]
        
        # Debug: log completo
        print(f"📊 [KPIs] Não Conformidade - Total linhas com pendência: {len(df_pendentes)}")
        print(f"📊 [KPIs] Não Conformidade - Valores únicos de pendência: {df_pendentes['_pend_norm'].unique().tolist()}")
        print(f"📊 [KPIs] Não Conformidade - Total gerentes: {len(labels)}")
        for l, v in zip(labels, valores):
            print(f"   → {l}: {v}")
        
        return {"labels": labels, "valores": valores}
    except Exception as e:
        print(f"⚠️ [KPIs] Erro na Não Conformidade por Gerente: {e}")
        import traceback; traceback.print_exc()
        return {"labels": [], "valores": []}