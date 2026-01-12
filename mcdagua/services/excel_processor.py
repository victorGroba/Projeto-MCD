# mcdagua/services/excel_processor.py
import pandas as pd
import numpy as np

def processar_detalhes_parametros_por_mes(df):
    """
    Gera dados para gráficos individuais de cada parâmetro x Mês.
    Estrutura:
    {
        "Back Room": [
             { "titulo": "pH", "labels": ["Dezembro"], "ok": [10], "nok": [1] },
             { "titulo": "Cloro", ... }
        ],
        ...
    }
    """
    # Mapeamento de Colunas (0-based)
    # A=0, D=3 (Mês), J=9...
    IDX_MES = 3 
    
    regras_grupos = {
        "Back Room": slice(9, 18),      # J a R
        "Gelo Pool": slice(19, 22),     # T a V
        "Mar de Gelo": slice(23, 26),   # X a Z
        "Bin Café": slice(27, 30),      # AB a AD
        "Bin Bebidas": slice(31, 34)    # AF a AH
    }

    # Ordem cronológica para garantir que os gráficos fiquem ordenados
    ORDEM_MESES = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ]

    resultado_grupos = {}

    try:
        # Garante que a coluna Mês existe e normaliza
        if df.shape[1] <= IDX_MES:
            return {}
        
        col_mes = df.iloc[:, IDX_MES].astype(str).str.strip()
        
        for nome_grupo, fatiador in regras_grupos.items():
            df_grupo = df.iloc[:, fatiador].copy()
            lista_graficos = []

            for col in df_grupo.columns:
                param_nome = str(col).strip()
                
                # Cria um DataFrame temporário com Mês e o Valor do Parâmetro
                df_temp = pd.DataFrame({
                    'Mes': col_mes,
                    'Valor': df_grupo[col].astype(str).str.lower().str.strip()
                })

                # Filtra apenas OK e NOK (Ignora NA, Vazio, etc)
                df_temp = df_temp[df_temp['Valor'].isin(['ok', 'nok'])]

                if df_temp.empty:
                    # Se não tiver dados, cria estrutura vazia mas preserva o gráfico
                    lista_graficos.append({
                        "titulo": param_nome,
                        "labels": [],
                        "ok": [],
                        "nok": []
                    })
                    continue

                # Agrupa por Mês e Valor
                agrupado = df_temp.groupby(['Mes', 'Valor']).size().unstack(fill_value=0)
                
                # Garante que as colunas ok/nok existam
                if 'ok' not in agrupado.columns: agrupado['ok'] = 0
                if 'nok' not in agrupado.columns: agrupado['nok'] = 0

                # Ordena os meses
                # Pega os meses presentes no dados
                meses_presentes = agrupado.index.tolist()
                # Ordena baseada na lista fixa
                meses_ordenados = sorted(
                    meses_presentes, 
                    key=lambda x: ORDEM_MESES.index(x.lower()) if x.lower() in ORDEM_MESES else 999
                )
                
                # Reindexa o dataframe pela ordem correta
                agrupado = agrupado.reindex(meses_ordenados)

                # Monta o objeto final
                lista_graficos.append({
                    "titulo": param_nome,
                    "labels": agrupado.index.tolist(), # Lista de Meses
                    "ok": agrupado['ok'].tolist(),
                    "nok": agrupado['nok'].tolist()
                })

            resultado_grupos[nome_grupo] = lista_graficos

        return resultado_grupos

    except Exception as e:
        print(f"Erro ao processar detalhes: {e}")
        return {}

def processar_aba_geral(caminho_arquivo):
    """
    Processador Principal da Aba GERAL.
    Retorna os KPIs antigos E os novos gráficos detalhados.
    """
    try:
        # Lê cabeçalho real (Linha 2 do Excel = Index 1 do Pandas) para pegar nomes dos parâmetros
        # Header=1 pois linha 0 é metadado
        try:
            df_header = pd.read_excel(caminho_arquivo, sheet_name='GERAL', header=1)
        except:
            # Fallback para CSV
            df_header = pd.read_csv(caminho_arquivo, header=1)
            
        # 1. PROCESSA OS DETALHES (Novo requisito)
        detalhes_parametros = processar_detalhes_parametros_por_mes(df_header)


        # 2. PROCESSA OS TOTAIS GERAIS (Lógica legada mantida para não quebrar outros kpis)
        # Lê sem header para pegar slices fixos
        df_raw = pd.read_excel(caminho_arquivo, sheet_name='GERAL', header=None)
        df_dados = df_raw.iloc[1:].copy()
        
        lista_dados_limpos = []
        idx_meta = [0, 1, 2] 
        nomes_meta = ['Regional', 'Sigla', 'Loja']
        config_itens = [
            {"nome": "Back Room",   "col_inicio": 9},
            {"nome": "Gelo Pool",   "col_inicio": 19},
            {"nome": "Mar de Gelo", "col_inicio": 23},
            {"nome": "Bin Café",    "col_inicio": 27},
            {"nome": "Bin Bebidas", "col_inicio": 31},
        ]

        for item in config_itens:
            df_temp = df_dados.iloc[:, idx_meta].copy()
            df_temp.columns = nomes_meta
            idx_status = item["col_inicio"]
            df_temp['Item_Avaliado'] = item["nome"]
            df_temp['Status'] = df_dados.iloc[:, idx_status]
            df_temp = df_temp.dropna(subset=['Status'])
            # Normalização simples para o KPI geral
            df_temp = df_temp[df_temp['Status'].astype(str).str.upper().isin(['OK', 'NOK'])]
            lista_dados_limpos.append(df_temp)

        dados_dashboard = {}
        if lista_dados_limpos:
            df_final = pd.concat(lista_dados_limpos, ignore_index=True)
            df_final['Status'] = df_final['Status'].astype(str).str.upper().str.strip()

            dados_dashboard = {
                "total_geral": df_final['Status'].value_counts().to_dict(),
                "por_regional": pd.crosstab(df_final['Regional'], df_final['Status']).reset_index().to_dict(orient='records'),
                "top_falhas": df_final[df_final['Status'] == 'NOK']['Item_Avaliado'].value_counts().head(5).to_dict()
            }
        
        # INSERE OS NOVOS DADOS NA RESPOSTA
        dados_dashboard["detalhes_parametros"] = detalhes_parametros

        return dados_dashboard, None

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, str(e)

# Função dummy para compatibilidade se for importada em outro lugar
def formatar_para_chartjs(df):
    return {}