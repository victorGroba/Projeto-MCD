# mcdagua/services/excel_processor.py
import pandas as pd

def processar_aba_geral(caminho_arquivo):
    """
    Lê a aba GERAL, normaliza as colunas (J, T, X...) e retorna 
    os dados estatísticos para o Dashboard.
    """
    try:
        # Lê sem cabeçalho para manipular índices
        df_raw = pd.read_excel(caminho_arquivo, sheet_name='GERAL', header=None)
        
        # Assume linha 1 como cabeçalho de metadados, dados começam na linha 2
        df_dados = df_raw.iloc[1:].copy()

        lista_dados_limpos = []

        # Configuração baseada na sua estrutura (A=0 ... J=9)
        idx_meta = [0, 1, 2] # Regional(0), Sigla(1), Loja(2) - Ajuste se precisar de mais
        nomes_meta = ['Regional', 'Sigla', 'Loja']

        # Configuração dos blocos
        config_itens = [
            {"nome": "Back Room",   "col_inicio": 9},  # J
            {"nome": "Gelo Pool",   "col_inicio": 19}, # T
            {"nome": "Mar de Gelo", "col_inicio": 23}, # X
            {"nome": "Bin Café",    "col_inicio": 27}, # AB
            {"nome": "Bin Bebidas", "col_inicio": 31}, # AF
        ]

        for item in config_itens:
            # Pega metadados
            df_temp = df_dados.iloc[:, idx_meta].copy()
            df_temp.columns = nomes_meta
            
            # Pega Status (assumindo que é a 1ª coluna do bloco)
            idx_status = item["col_inicio"]
            
            df_temp['Item_Avaliado'] = item["nome"]
            df_temp['Status'] = df_dados.iloc[:, idx_status]

            # Limpeza
            df_temp = df_temp.dropna(subset=['Status'])
            # Filtra apenas OK e NOK para garantir
            df_temp = df_temp[df_temp['Status'].isin(['OK', 'NOK'])]
            
            lista_dados_limpos.append(df_temp)

        if not lista_dados_limpos:
            return None, "Nenhum dado encontrado nos blocos especificados."

        df_final = pd.concat(lista_dados_limpos, ignore_index=True)

        # --- GERAÇÃO DOS DADOS PARA O GRÁFICO ---
        
        # 1. Totais Gerais
        total_status = df_final['Status'].value_counts().to_dict()

        # 2. Por Regional (Para gráfico empilhado)
        por_regional = pd.crosstab(df_final['Regional'], df_final['Status']).reset_index().to_dict(orient='records')

        # 3. Top Falhas
        top_falhas = df_final[df_final['Status'] == 'NOK']['Item_Avaliado'].value_counts().head(5).to_dict()

        dados_dashboard = {
            "total_geral": total_status,
            "por_regional": por_regional,
            "top_falhas": top_falhas
        }

        return dados_dashboard, None

    except Exception as e:
        return None, str(e)
    
    # Adicione isso no final do arquivo mcdagua/services/excel_processor.py

def formatar_para_chartjs(df):
    """
    Transforma o DataFrame 'Tidy' (formato longo) na estrutura que o 
    TelaGraficos.jsx espera (Eixos X e Datasets Y).
    """
    resultado = {}

    # --- 1. BACK ROOM (Agrupado por Regional) ---
    df_backroom = df[df['Item_Avaliado'] == 'Back Room']
    if not df_backroom.empty:
        # Cria tabela cruzada: Linhas=Regional, Colunas=Status
        crosstab = pd.crosstab(df_backroom['Regional'], df_backroom['Status'])
        
        resultado['backroom'] = {
            "regionais": crosstab.index.tolist(),
            "valores": {
                col: crosstab[col].tolist() for col in crosstab.columns
            }
        }
    else:
        resultado['backroom'] = {"regionais": [], "valores": {}}

    # --- 2. GELO (Agrupando 'Gelo Pool' e 'Mar de Gelo') ---
    df_gelo = df[df['Item_Avaliado'].isin(['Gelo Pool', 'Mar de Gelo'])]
    if not df_gelo.empty:
        crosstab = pd.crosstab(df_gelo['Regional'], df_gelo['Status'])
        resultado['gelo'] = {
            "regionais": crosstab.index.tolist(),
            "valores": {
                col: crosstab[col].tolist() for col in crosstab.columns
            }
        }
    else:
        resultado['gelo'] = {"regionais": [], "valores": {}}

    # --- 3. RESTAURANTE REGIONAL (Visão Geral de Tudo) ---
    # Conta tudo (Back Room + Gelo + Bins...) por regional
    crosstab_total = pd.crosstab(df['Regional'], df['Status'])
    resultado['restaurante_regional'] = {
        "regionais": crosstab_total.index.tolist(),
        "valores": {
            col: crosstab_total[col].tolist() for col in crosstab_total.columns
        }
    }

    # --- 4. PENDÊNCIAS DE GELO (Apenas NOKs por Loja ou Sigla - Top 10) ---
    # Filtrando apenas NOK de itens de Gelo
    df_gelo_nok = df[(df['Item_Avaliado'].isin(['Gelo Pool', 'Mar de Gelo'])) & (df['Status'] == 'NOK')]
    
    if not df_gelo_nok.empty:
        # Vamos agrupar por Loja para ver quem tem mais problemas
        contagem_lojas = df_gelo_nok['Loja'].value_counts().head(10) # Top 10 lojas com problema
        
        resultado['pendencias_gelo'] = {
            "regionais": contagem_lojas.index.tolist(), # Usando 'regionais' como label genérico pro eixo X
            "valores": {
                "NOK": contagem_lojas.tolist()
            }
        }
    else:
        resultado['pendencias_gelo'] = {"regionais": [], "valores": {}}
        
    # --- 5. Dummy para 'restaurante_anual' (pois sua planilha não tem Data explícita na config atual) ---
    # Se tiver coluna de data, podemos ajustar. Por enquanto envio vazio para não quebrar.
    resultado['restaurante_anual'] = {
        "meses": ["Jan", "Fev", "Mar"], 
        "valores": {"OK": [0,0,0], "NOK": [0,0,0]}
    }

    return resultado