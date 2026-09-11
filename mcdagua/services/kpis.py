import pandas as pd
import numpy as np
import re
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
        
        programado_meta = {1: 193, 2: 103, 3: 76, 4: 211, 5: 186, 6: 221, 7: 79, 8: 82, 9: 212, 10: 188, 11: 215, 12: 80}
        
        labels_meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                        "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        realizado_values = [int(realizado_series.get(m, 0)) for m in range(1, 13)]
        programado_values = [programado_meta.get(m, 0) for m in range(1, 13)]
        
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
    Gráfico: Pendências Abertas por Gerente de Mercado.
    Lógica idêntica ao filtro manual da planilha:
      1. Coluna AI (pendência): desmarcar OK e células vazias → só sobram pendências reais
      2. Agrupar por GM e contar quantas pendências abertas cada gerente tem
    Obs: NÃO filtra por mês/ano pois pendências se arrastam entre períodos.
    """
    try:
        col_pendencia = encontrar_coluna(df, ['pendencia', 'ocorrencia', 'status_pendencia'])
        col_gm = encontrar_coluna(df, ['gm', 'gerente', 'gerente_de_mercado'])
        
        if not col_pendencia or not col_gm:
            print("⚠️ [KPIs] Não Conformidade - Colunas pendencia/gm não encontradas")
            return {"labels": [], "valores": [], "detalhes": {}}

        df_work = df.copy()
        df_work['_pend_norm'] = df_work[col_pendencia].astype(str).str.lower().str.strip()
        
        # Filtro na coluna de pendências — remove OK e células vazias
        # (exatamente como desmarcar "ok" e "vazia" no filtro do Excel)
        invalidos = ["", "ok", "nan", "none"]
        df_pendentes = df_work[~df_work['_pend_norm'].isin(invalidos)]
        
        print(f"📊 [KPIs] Pendências Abertas por GM - Total: {len(df_pendentes)} linhas")
        
        if df_pendentes.empty:
            return {"labels": [], "valores": [], "detalhes": {}}
        
        # Agrupa por gerente e conta
        contagem = df_pendentes[col_gm].astype(str).str.strip().value_counts()
        # Remove gerentes vazios
        contagem = contagem[contagem.index.str.strip() != ""]
        
        labels = [str(x) for x in contagem.index.tolist()]
        valores = [int(x) for x in contagem.values.tolist()]

        # Detalhamento por gerente, para a janela que abre ao clicar na barra
        col_sigla = encontrar_coluna(df, ['sigla', 'loja', 'restaurante'])
        col_regional = encontrar_coluna(df, ['regional', 'regiao'])
        col_mes = encontrar_coluna(df, ['mes'])
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        col_venc = encontrar_coluna(df, ['vencimento'])
        col_consultor = encontrar_coluna(df, ['consultor'])

        detalhes = {}
        for _, linha in df_pendentes.iterrows():
            gerente = str(linha[col_gm]).strip()
            if not gerente:
                continue
            detalhes.setdefault(gerente, []).append({
                "sigla": str(linha[col_sigla]).strip() if col_sigla else "",
                "regional": str(linha[col_regional]).strip() if col_regional else "",
                "mes": str(linha[col_mes]).strip() if col_mes else "",
                "data": _formatar_data(linha[col_data]) if col_data else "",
                "tipo": str(linha[col_tipo]).strip() if col_tipo else "",
                "pendencia": str(linha[col_pendencia]).strip(),
                "vencimento": _formatar_data(linha[col_venc]) if col_venc else "",
                "consultor": str(linha[col_consultor]).strip() if col_consultor else "",
            })
        
        # Debug: log completo
        print(f"📊 [KPIs] Não Conformidade - Total linhas com pendência: {len(df_pendentes)}")
        print(f"📊 [KPIs] Não Conformidade - Valores únicos de pendência: {df_pendentes['_pend_norm'].unique().tolist()}")
        print(f"📊 [KPIs] Não Conformidade - Total gerentes: {len(labels)}")
        for l, v in zip(labels, valores):
            print(f"   → {l}: {v}")
        
        return {"labels": labels, "valores": valores, "detalhes": detalhes}
    except Exception as e:
        print(f"⚠️ [KPIs] Erro na Não Conformidade por Gerente: {e}")
        import traceback; traceback.print_exc()
        return {"labels": [], "valores": [], "detalhes": {}}


# ==============================================================================
# DOSSIÊ DE CONFORMIDADE (nota 100% x abaixo de 100%)
# ==============================================================================

MESES_MAP = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3,
    "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12
}

MESES_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

# Agrupamento dos tipos de coleta (mesma regra do gráfico "Tipo de Coleta por Mês")
GRUPOS_TIPO = {
    "Coleta": ["cronograma", "coleta", "inauguração", "inauguracao"],
    "Recoleta": ["recoleta"],
    "Checklist": ["check list", "check list com coleta"],
}

# Agrupamento usado no gráfico por Gerente de Mercado
GRUPOS_GM = {
    "Cronograma/Inauguração": ["cronograma", "coleta", "inauguração", "inauguracao"],
    "Recoleta": ["recoleta"],
}

VAZIOS = ("", "na", "nan", "none", "nat", "-")


def _limpo(valor):
    return str(valor).strip() if valor is not None else ""


def classificar_conformidade(nota_raw, pendencia_raw, usar_pendencia=True):
    """
    Classifica uma coleta como '100' (verde) ou 'abaixo' (vermelho).

    Regra:
      1. Se a coluna 'nota' estiver preenchida com um número -> 100% somente se nota == 1
         (aceita também 100 no lugar de 1).
      2. Se a nota for 'na'/vazia E `usar_pendencia`, cai para a coluna 'Pendência':
         'ok' = 100%, qualquer pendência descrita = abaixo.
      3. Sem nenhuma das duas informações -> None (fica de fora do cálculo).

    `usar_pendencia` existe porque a regra 2 foi pensada para as RECOLETAS, que
    nunca recebem nota na planilha. Aplicada também à 1ª coleta, ela classificava
    como aprovada uma visita que simplesmente ainda não tinha sido avaliada (nota
    'na') só porque a pendência estava 'ok' — eram 24 casos em 2026. Para a 1ª
    coleta vale a nota e só ela; sem nota, fica 'sem nota'.
    """
    nota = _limpo(nota_raw).lower().replace(",", ".")
    if nota not in VAZIOS:
        try:
            valor = float(nota)
            if valor > 1:  # tolera nota lançada como 100 / 90
                valor = valor / 100.0
            return "100" if valor >= 0.999 else "abaixo"
        except ValueError:
            pass

    if not usar_pendencia:
        return None

    pend = _limpo(pendencia_raw).lower()
    if pend in VAZIOS:
        return None
    return "100" if pend == "ok" else "abaixo"


def _formatar_nota(nota_raw):
    nota = _limpo(nota_raw).lower().replace(",", ".")
    if nota in VAZIOS:
        return "—"
    try:
        valor = float(nota)
        if valor > 1:
            valor = valor / 100.0
        return f"{valor * 100:.0f}%"
    except ValueError:
        return _limpo(nota_raw)


def _formatar_data(valor):
    try:
        dt = pd.to_datetime(valor, errors="coerce")
        if pd.isna(dt):
            return ""
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return ""


def get_conformidade_dossie(df, ano=2026):
    """
    Monta a base do dossiê de conformidade usado em:
      - Gráfico "Tipo de Coleta por Mês" (barras empilhadas 100% x abaixo de 100%)
      - Gráfico "Conformidade por Gerente de Mercado"
      - Janelas de detalhe (clique na coluna)

    Retorna os agregados prontos para os gráficos + a lista plana de registros,
    para o front filtrar e montar as tabelas dos modais sem recalcular nada.
    """
    vazio = {
        "labels": [], "grupos": [], "tipo_coleta": {},
        "gerentes": {"labels": [], "grupos": [], "dados": {}},
        "registros": [],
    }
    try:
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        col_nota = encontrar_coluna(df, ['nota'])
        col_pend = encontrar_coluna(df, ['pendencia', 'ocorrencia'])
        col_gm = encontrar_coluna(df, ['gm', 'gerente', 'gerente_de_mercado'])
        col_mes = encontrar_coluna(df, ['mes'])
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        col_sigla = encontrar_coluna(df, ['sigla', 'loja', 'restaurante'])
        col_regional = encontrar_coluna(df, ['regional', 'regiao'])
        col_consultor = encontrar_coluna(df, ['consultor'])
        col_visita = encontrar_coluna(df, ['visita'])
        col_estado = encontrar_coluna(df, ['estado', 'uf'])

        if not col_tipo or not col_nota:
            print("[KPIs] Dossie - colunas 'tipo de coleta'/'nota' nao encontradas")
            return vazio

        dfw = df.copy()
        dfw['_tipo_norm'] = dfw[col_tipo].astype(str).str.lower().str.strip()

        # Filtra o ano pela coluna de data (mesma regra dos demais gráficos)
        if col_data:
            dfw['_data'] = pd.to_datetime(dfw[col_data], errors='coerce')
            dfw = dfw[dfw['_data'].dt.year == ano]
        else:
            dfw['_data'] = pd.NaT

        if col_mes:
            dfw['_mes_num'] = dfw[col_mes].astype(str).str.lower().str.strip().map(MESES_MAP)
        else:
            dfw['_mes_num'] = dfw['_data'].dt.month
        dfw['_mes_num'] = dfw['_mes_num'].fillna(dfw['_data'].dt.month)

        registros = []
        for _, linha in dfw.iterrows():
            tipo = linha['_tipo_norm']

            grupo = next((g for g, tipos in GRUPOS_TIPO.items() if tipo in tipos), None)
            if grupo is None:
                continue  # "não realizada", vazios e afins ficam de fora

            grupo_gm = next((g for g, tipos in GRUPOS_GM.items() if tipo in tipos), None)

            nota_raw = linha[col_nota] if col_nota else ""
            pend_raw = linha[col_pend] if col_pend else ""
            status = classificar_conformidade(
                nota_raw, pend_raw, usar_pendencia=(grupo == "Recoleta")
            )

            mes_num = linha['_mes_num']
            mes_num = int(mes_num) if pd.notna(mes_num) else 0

            registros.append({
                "sigla": _limpo(linha[col_sigla]) if col_sigla else "",
                "regional": _limpo(linha[col_regional]) if col_regional else "",
                "estado": (_limpo(linha[col_estado]).upper() if col_estado else ""),
                "gm": _limpo(linha[col_gm]) if col_gm else "",
                "consultor": _limpo(linha[col_consultor]) if col_consultor else "",
                "mes_num": mes_num,
                "mes": MESES_LABELS[mes_num - 1] if 1 <= mes_num <= 12 else "",
                "data": _formatar_data(linha['_data']),
                "tipo": _limpo(linha[col_tipo]),
                "grupo": grupo,
                "grupo_gm": grupo_gm,
                "nota": _formatar_nota(nota_raw),
                "pendencia": _limpo(pend_raw) or "—",
                "status": status or "sem_nota",
                # usados pelo mapa Coleta x Recoleta e pelos sub-modais de datas
                "visita": int(pd.to_numeric(linha[col_visita], errors="coerce"))
                          if col_visita and pd.notna(pd.to_numeric(linha[col_visita], errors="coerce"))
                          else (1 if grupo == "Coleta" else 2),
                "data_iso": linha['_data'].strftime("%Y-%m-%d") if pd.notna(linha['_data']) else "",
                "semestre": SEMESTRE_LABELS.get(_semestre_do_mes(mes_num), ""),
            })

        # --- Agregado 1: Tipo de Coleta por Mês ---
        ultimo_mes = max([r["mes_num"] for r in registros], default=0)
        if ultimo_mes == 0:
            ultimo_mes = 6
        labels = MESES_LABELS[:ultimo_mes]

        tipo_coleta = {}
        for grupo in GRUPOS_TIPO:
            tipo_coleta[grupo] = {
                "ok": [0] * ultimo_mes,
                "abaixo": [0] * ultimo_mes,
                "sem_nota": [0] * ultimo_mes,
            }
        for r in registros:
            m = r["mes_num"]
            if not (1 <= m <= ultimo_mes):
                continue
            chave = {"100": "ok", "abaixo": "abaixo"}.get(r["status"], "sem_nota")
            tipo_coleta[r["grupo"]][chave][m - 1] += 1

        # --- Agregado 2: Conformidade por Gerente de Mercado ---
        # Descarta lixo de celula (ex.: "00:00:00" na coluna GM) - so entra o que
        # tem ao menos uma letra, ou seja, um nome de gerente de verdade.
        def _gerente_valido(nome):
            return bool(nome) and nome.lower() not in VAZIOS and re.search(r"[^\W\d_]", nome, re.UNICODE)

        gms = sorted({r["gm"] for r in registros if _gerente_valido(r["gm"])})
        sem_gerente = sum(1 for r in registros if not _gerente_valido(r["gm"]))
        grupos_gm = list(GRUPOS_GM.keys())
        dados_gm = {
            g: {"ok": [0] * len(gms), "abaixo": [0] * len(gms), "sem_nota": [0] * len(gms)}
            for g in grupos_gm
        }
        idx_gm = {gm: i for i, gm in enumerate(gms)}
        for r in registros:
            if not r["grupo_gm"] or r["gm"] not in idx_gm:
                continue
            chave = {"100": "ok", "abaixo": "abaixo"}.get(r["status"], "sem_nota")
            dados_gm[r["grupo_gm"]][chave][idx_gm[r["gm"]]] += 1

        total_ok = sum(1 for r in registros if r["status"] == "100")
        total_abaixo = sum(1 for r in registros if r["status"] == "abaixo")
        print(f"[KPIs] Dossie Conformidade - {len(registros)} registros | "
              f"100%: {total_ok} | abaixo: {total_abaixo}")

        return {
            "labels": labels,
            "grupos": list(GRUPOS_TIPO.keys()),
            "tipo_coleta": tipo_coleta,
            "gerentes": {"labels": gms, "grupos": grupos_gm, "dados": dados_gm,
                         "sem_gerente": sem_gerente},
            "registros": registros,
        }
    except Exception as e:
        print(f"[KPIs] Erro no Dossie de Conformidade: {e}")
        import traceback; traceback.print_exc()
        return vazio


# ==============================================================================
# COLETA x RECOLETA — gráfico unificado, painel por gerente e saldo de pendências
# ==============================================================================

SEMESTRE_LABELS = {1: "1º semestre", 2: "2º semestre"}


def _semestre_do_mes(mes_num):
    return 1 if 1 <= mes_num <= 6 else 2


def _fim_do_mes(ano, mes_num):
    if mes_num == 12:
        return pd.Timestamp(year=ano + 1, month=1, day=1) - pd.Timedelta(seconds=1)
    return pd.Timestamp(year=ano, month=mes_num + 1, day=1) - pd.Timedelta(seconds=1)


def _reconstruir_ciclos(dfw, col_sigla, col_gm, col_pend, ano):
    """
    Reconstrói o histórico de pendências.

    A coluna "Pendência" da planilha guarda o estado ATUAL da visita, não o
    histórico: quando a pendência é resolvida ela vira "ok". Por isso o saldo
    "no fechamento do mês" não pode ser lido direto da coluna — ele é
    reconstruído pela cadeia de visitas de cada loja:

      - um ciclo começa a cada visita nº 1 (a coleta de cronograma);
      - se essa 1ª visita foi reprovada (nota < 100%), abre uma pendência na
        data dela;
      - a pendência encerra na data da última visita do ciclo, a menos que essa
        última visita ainda esteja com pendência aberta hoje.

    Assim um gerente que fez 10 recoletas no mês e resolveu tudo fecha o mês com
    saldo zero, sem que o esforço das recoletas desapareça do painel.
    """
    ciclos = []
    for _, grupo in dfw.groupby([col_sigla, "_ciclo"], sort=False):
        grupo = grupo.sort_values("_data")
        primeira = grupo.iloc[0]
        if primeira["_status_1a"] != "reprovado":
            continue  # só coleta reprovada abre pendência
        ultima = grupo.iloc[-1]
        pend_atual = _limpo(ultima[col_pend]).lower() if col_pend else ""
        # "ok" = resolvida; vazio/na = sem pendência registrada
        aberta_hoje = pend_atual not in VAZIOS and pend_atual != "ok"
        ciclos.append({
            "gm": _limpo(primeira[col_gm]) if col_gm else "",
            "sigla": _limpo(primeira[col_sigla]),
            "abertura": primeira["_data"],
            "encerramento": pd.NaT if aberta_hoje else ultima["_data"],
            "visitas": int(len(grupo)),
        })
    return pd.DataFrame(ciclos, columns=["gm", "sigla", "abertura", "encerramento", "visitas"])


def get_coleta_recoleta(df, ano=2026):
    """
    Base do gráfico unificado Coleta x Recoleta e do painel por gerente.

    Gráfico unificado, por período:
      - barra de Coleta (1ª visita): aprovado (nota 100%) x reprovado
      - barra de Recoleta: apenas o quantitativo total, sem divisão

    Painel por gerente, por período (3 métricas lado a lado):
      - reprovações na 1ª coleta
      - total de recoletas
      - saldo de pendências em aberto no fechamento do período
    """
    vazio = {
        "labels": {"mensal": [], "semestral": []},
        "series": {"mensal": {}, "semestral": {}},
        "gerentes": {"labels": [], "mensal": {}, "semestral": {}},
    }
    try:
        col_tipo = encontrar_coluna(df, ['tipo_de_coleta', 'tipo', 'servico'])
        col_nota = encontrar_coluna(df, ['nota'])
        col_pend = encontrar_coluna(df, ['pendencia', 'ocorrencia'])
        col_gm = encontrar_coluna(df, ['gm', 'gerente', 'gerente_de_mercado'])
        col_data = encontrar_coluna(df, ['data_coleta', 'data', 'dt_coleta'])
        col_sigla = encontrar_coluna(df, ['sigla', 'loja', 'restaurante'])
        col_visita = encontrar_coluna(df, ['visita'])

        if not col_tipo or not col_data or not col_sigla:
            print("[KPIs] Coleta x Recoleta - colunas essenciais nao encontradas")
            return vazio

        dfw = df.copy()
        dfw["_data"] = pd.to_datetime(dfw[col_data], errors="coerce")
        dfw = dfw[dfw["_data"].notna() & (dfw["_data"].dt.year == ano)]
        if dfw.empty:
            return vazio

        dfw["_tipo_norm"] = dfw[col_tipo].astype(str).str.lower().str.strip()
        dfw["_grupo"] = dfw["_tipo_norm"].map(
            lambda t: next((g for g, tipos in GRUPOS_TIPO.items() if t in tipos), None)
        )
        dfw = dfw[dfw["_grupo"].notna()]

        dfw["_mes"] = dfw["_data"].dt.month
        dfw["_sem"] = dfw["_mes"].map(_semestre_do_mes)

        # Status da 1ª visita: aprovado só com nota 100%
        def _classificar_primeira(linha):
            if linha["_grupo"] != "Coleta":
                return None
            # 1ª visita: vale a nota e só ela
            st = classificar_conformidade(
                linha[col_nota] if col_nota else "", "", usar_pendencia=False
            )
            if st == "100":
                return "aprovado"
            if st == "abaixo":
                return "reprovado"
            return "sem_nota"

        dfw["_status_1a"] = dfw.apply(_classificar_primeira, axis=1)

        if col_visita:
            dfw["_visita"] = pd.to_numeric(dfw[col_visita], errors="coerce").fillna(1).astype(int)
        else:
            dfw["_visita"] = dfw["_grupo"].map(lambda g: 1 if g == "Coleta" else 2)

        dfw = dfw.sort_values([col_sigla, "_data"])
        dfw["_ciclo"] = dfw.groupby(col_sigla)["_visita"].transform(
            lambda s: (s == 1).cumsum()
        )

        ciclos = _reconstruir_ciclos(dfw, col_sigla, col_gm, col_pend, ano)

        # ---------- Séries do gráfico unificado ----------
        meses_presentes = sorted(dfw["_mes"].unique())
        labels_mensal = [MESES_LABELS[m - 1] for m in meses_presentes]
        sems_presentes = sorted(dfw["_sem"].unique())
        labels_semestral = [SEMESTRE_LABELS[s] for s in sems_presentes]

        def _series(chave, valores):
            aprovado, reprovado, recoleta = [], [], []
            for v in valores:
                bloco = dfw[dfw[chave] == v]
                primeira = bloco[bloco["_grupo"] == "Coleta"]
                aprovado.append(int((primeira["_status_1a"] == "aprovado").sum()))
                reprovado.append(int((primeira["_status_1a"] == "reprovado").sum()))
                recoleta.append(int((bloco["_grupo"] == "Recoleta").sum()))
            return {"aprovado": aprovado, "reprovado": reprovado, "recoleta": recoleta}

        # ---------- Painel por gerente ----------
        def _gerente_valido(nome):
            return bool(nome) and nome.lower() not in VAZIOS and re.search(r"[^\W\d_]", nome, re.UNICODE)

        dfw["_gm"] = dfw[col_gm].astype(str).str.strip() if col_gm else ""
        gms = sorted({g for g in dfw["_gm"].unique() if _gerente_valido(g)})
        idx_gm = {g: i for i, g in enumerate(gms)}

        def _painel(chave, valores, fim_de):
            saida = {}
            for v in valores:
                bloco = dfw[dfw[chave] == v]
                reprov = [0] * len(gms)
                recol = [0] * len(gms)
                pend = [0] * len(gms)
                detalhe = {}

                primeira = bloco[(bloco["_grupo"] == "Coleta") & (bloco["_status_1a"] == "reprovado")]
                for g, qtd in primeira["_gm"].value_counts().items():
                    if g in idx_gm:
                        reprov[idx_gm[g]] = int(qtd)

                recs = bloco[bloco["_grupo"] == "Recoleta"]
                for g, qtd in recs["_gm"].value_counts().items():
                    if g in idx_gm:
                        recol[idx_gm[g]] = int(qtd)

                # saldo em aberto no último instante do período
                if not ciclos.empty:
                    fim = fim_de(v)
                    em_aberto = ciclos[
                        (ciclos["abertura"] <= fim)
                        & (ciclos["encerramento"].isna() | (ciclos["encerramento"] > fim))
                    ]
                    for g, qtd in em_aberto["gm"].value_counts().items():
                        if g in idx_gm:
                            pend[idx_gm[g]] = int(qtd)
                    for _, linha in em_aberto.iterrows():
                        if linha["gm"] in idx_gm:
                            detalhe.setdefault(linha["gm"], []).append({
                                "sigla": linha["sigla"],
                                "abertura": linha["abertura"].strftime("%d/%m/%Y"),
                                "dias_em_aberto": int((fim - linha["abertura"]).days),
                                "visitas": int(linha["visitas"]),
                            })

                rotulo = (MESES_LABELS[v - 1] if chave == "_mes" else SEMESTRE_LABELS[v])
                saida[rotulo] = {
                    "reprovacoes": reprov, "recoletas": recol,
                    "pendentes": pend, "pendentes_detalhe": detalhe,
                }
            return saida

        resultado = {
            "labels": {"mensal": labels_mensal, "semestral": labels_semestral},
            "series": {
                "mensal": _series("_mes", meses_presentes),
                "semestral": _series("_sem", sems_presentes),
            },
            "gerentes": {
                "labels": gms,
                "mensal": _painel("_mes", meses_presentes, lambda m: _fim_do_mes(ano, m)),
                "semestral": _painel(
                    "_sem", sems_presentes,
                    lambda s: _fim_do_mes(ano, 6 if s == 1 else 12),
                ),
            },
        }

        print(f"[KPIs] Coleta x Recoleta - {len(labels_mensal)} meses, {len(gms)} gerentes, "
              f"{len(ciclos)} ciclos com reprovacao ({int(ciclos['encerramento'].isna().sum()) if not ciclos.empty else 0} ainda abertos)")
        return resultado
    except Exception as e:
        print(f"[KPIs] Erro em Coleta x Recoleta: {e}")
        import traceback; traceback.print_exc()
        return vazio
