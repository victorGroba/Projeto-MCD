import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

# --- FUNÇÕES GERAIS (QUE ESTAVAM FALTANDO) ---

def refresh_dataframe():
    """Limpa o cache para forçar o recarregamento dos dados."""
    cache.clear()

@cache.cached(timeout=300, key_prefix='main_dataframe')
def get_dataframe():
    """
    Lê a aba principal para a tabela de dados (Dashboard Operacional/Geral).
    Lê a primeira aba por padrão ou uma específica se necessário.
    """
    path = current_app.config["EXCEL_PATH"]
    try:
        # Lê a primeira aba do Excel para a tabela geral
        # Se precisar de uma aba específica, use: sheet_name="NomeDaAba"
        df = pd.read_excel(path)
        df = df.fillna("") # Remove valores vazios para não quebrar o JSON
        return df
    except Exception as e:
        print(f"Erro ao ler tabela principal: {e}")
        return pd.DataFrame()

# --- LÓGICA DOS GRÁFICOS (CORRIGIDA) ---

def load_graphics_sheet():
    path = current_app.config["EXCEL_PATH"]
    try:
        xls = pd.ExcelFile(path)
        
        # Procura a aba correta de gráficos
        nomes_possiveis = [
            "GRÁFICO PENDENCIA", "GRÁFICO PENDÊNCIA", 
            "GRAFICO PENDENCIA", "gráfico pendencia"
        ]
        
        sheet_name = None
        for nome in nomes_possiveis:
            if nome in xls.sheet_names:
                sheet_name = nome
                break
        
        if not sheet_name:
            print(f"ERRO: Aba de gráficos não encontrada. Abas: {xls.sheet_names}")
            return pd.DataFrame()

        print(f"Carregando gráficos da aba: {sheet_name}")
        return pd.read_excel(path, sheet_name=sheet_name, header=None)
    
    except Exception as e:
        print(f"Erro ao ler Excel de gráficos: {e}")
        return pd.DataFrame()

def find_table_start(df, termo_busca):
    """Retorna (linha, coluna) onde o texto foi encontrado."""
    for col in df.columns:
        matches = df[df[col].astype(str).str.contains(termo_busca, na=False, case=False, regex=False)]
        if not matches.empty:
            return matches.index[0], col
    return None, None

# --- EXTRATORES ---

def extract_restaurante_anual(df):
    if df.empty: return {}
    try:
        row, col = find_table_start(df, "Pendência restaurante Anual")
        if row is None: return {}

        # Ajuste: Meses na col anterior (H/7), Título na I/8
        col_meses = col - 1  
        col_anos_start = col 
        data_start_row = row + 2
        
        meses = df.loc[data_start_row : data_start_row + 11, col_meses].tolist()
        anos = df.loc[row + 1, col_anos_start : col_anos_start + 2].tolist()
        
        valores = {}
        for i, ano in enumerate(anos):
            valores[str(ano)] = df.loc[data_start_row : data_start_row + 11, col_anos_start + i].tolist()
            
        return {"meses": meses, "anos": anos, "valores": valores}
    except Exception:
        return {}

def extract_restaurante_regional(df):
    if df.empty: return {}
    try:
        row, col = find_table_start(df, "Pendência restaurante por regional")
        if row is None: return {}
        
        col_meses = col 
        col_dados = col + 1
        data_start_row = row + 2
        
        meses = df.loc[data_start_row : data_start_row + 11, col_meses].tolist()
        regionais = df.loc[row + 1, col_dados : col_dados + 3].tolist()
        
        valores = {}
        for i, reg in enumerate(regionais):
            if pd.isna(reg): continue
            vals = df.loc[data_start_row : data_start_row + 11, col_dados + i].tolist()
            valores[reg] = vals
            
        return {"meses": meses, "regionais": regionais, "valores": valores}
    except Exception:
        return {}

def extract_backroom(df):
    if df.empty: return {}
    try:
        row, col = find_table_start(df, "Back room")
        if row is None: return {}

        col_nomes = col
        col_dados = col + 1
        data_start_row = row + 2
        
        categorias = df.loc[row + 1, col_dados : col_dados + 3].tolist()
        regionais = df.loc[data_start_row : data_start_row + 3, col_nomes].tolist()
        
        valores_invertidos = {}
        for i, reg in enumerate(regionais):
            if pd.isna(reg): continue
            vals = df.loc[data_start_row + i, col_dados : col_dados + 3].tolist()
            valores_invertidos[reg] = vals

        return {"categorias": categorias, "regionais": regionais, "valores": valores_invertidos}
    except Exception:
        return {}

def extract_gelo(df):
    if df.empty: return {}
    try:
        row, col = find_table_start(df, "Gelo")
        if row is None: return {}
        
        col_nomes = col
        col_dados = col + 1
        data_start_row = row + 2
        
        categorias = df.loc[row + 1, col_dados : col_dados + 3].tolist()
        regionais = df.loc[data_start_row : data_start_row + 3, col_nomes].tolist()
        
        valores_invertidos = {}
        for i, reg in enumerate(regionais):
            vals = df.loc[data_start_row + i, col_dados : col_dados + 3].tolist()
            valores_invertidos[reg] = vals

        return {"categorias": categorias, "regionais": regionais, "valores": valores_invertidos}
    except Exception:
        return {}

def extract_pendencias_gelo(df):
    if df.empty: return {}
    try:
        row, col = find_table_start(df, "Pendências de Gelo")
        if row is None: return {}

        col_nomes = col - 1 
        col_dados = col 
        data_start_row = row + 2
        
        categorias = df.loc[row + 1, col_dados : col_dados + 2].tolist()
        regionais = df.loc[data_start_row : data_start_row + 3, col_nomes].tolist()
        
        valores_invertidos = {}
        for i, reg in enumerate(regionais):
            vals = df.loc[data_start_row + i, col_dados : col_dados + 2].tolist()
            valores_invertidos[reg] = vals

        return {"regionais": regionais, "categorias": categorias, "valores": valores_invertidos}
    except Exception:
        return {}

def load_all_graphics():
    df = load_graphics_sheet()
    return {
        "restaurante_anual": extract_restaurante_anual(df),
        "restaurante_regional": extract_restaurante_regional(df),
        "backroom": extract_backroom(df),
        "gelo": extract_gelo(df),
        "pendencias_gelo": extract_pendencias_gelo(df)
    }