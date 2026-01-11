import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

# ==============================================================================
# 1. LOADER GERAL (POTABILIDADE)
# ==============================================================================
def load_geral_dataframe():
    """
    Carrega a planilha de Potabilidade (Geral).
    Lê a configuração 'PATH_GERAL' do .env.
    """
    path = current_app.config.get("PATH_GERAL")
    
    if not path:
        print("⚠️ [LOADER] PATH_GERAL não configurado.")
        return pd.DataFrame()

    try:
        # Tenta ler a aba "GERAL" com header na linha 2 (índice 1)
        df = pd.read_excel(path, sheet_name="GERAL", header=1)
    except ValueError:
        # Fallback: Se não achar a aba "GERAL", tenta ler a primeira aba
        try:
            df = pd.read_excel(path, header=1)
        except Exception as e:
            print(f"❌ [GERAL] Erro crítico ao ler arquivo: {e}")
            return pd.DataFrame()
    except Exception as e:
        print(f"❌ [GERAL] Erro ao carregar: {e}")
        return pd.DataFrame()

    # --- LIMPEZA E PADRONIZAÇÃO ---
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

    df = df.loc[:, ~df.columns.str.contains('^unnamed')]
    df = df.dropna(how="all", axis=1)
    df = df.dropna(how="all", axis=0)
    df = df.fillna("")

    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()

    return df


# ==============================================================================
# 2. LOADER VISA (COLETA DE ALIMENTOS)
# ==============================================================================
def load_visa_dataframe():
    """
    Carrega a planilha da VISA.
    Aba esperada: 'Consolidado Coletas'
    """
    path = current_app.config.get("PATH_VISA")

    if not path:
        print("⚠️ [LOADER] PATH_VISA não configurado.")
        return pd.DataFrame()

    try:
        df = pd.read_excel(path, sheet_name="Consolidado Coletas")
        
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_")
            .str.replace("/", "_")
            .str.normalize("NFKD")
            .str.encode("ascii", errors="ignore")
            .str.decode("utf-8")
        )
        
        for col in df.columns:
            if "data" in col:
                df[col] = pd.to_datetime(df[col], errors='coerce').astype(str).replace("NaT", "")
        
        df = df.fillna("")
        
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).str.strip()
            
        return df

    except Exception as e:
        print(f"❌ [VISA] Erro ao carregar aba 'Consolidado Coletas': {e}")
        return pd.DataFrame()


# ==============================================================================
# 3. LOADER HACCP (TABELA GERAL)
# ==============================================================================
def load_haccp_dataframe():
    """
    Carrega a planilha de HACCP (Tabela de Dados).
    Aba esperada: 'GERAL' ou 'HACCP'
    """
    path = current_app.config.get("PATH_HACCP")

    if not path:
        print("⚠️ [LOADER] PATH_HACCP não configurado.")
        return pd.DataFrame()

    try:
        df = pd.read_excel(path, sheet_name="GERAL", header=1)
    except ValueError:
        try:
            print("⚠️ [HACCP] Aba 'GERAL' não encontrada, tentando 'HACCP'...")
            df = pd.read_excel(path, sheet_name="HACCP", header=1)
        except Exception as e:
            print(f"❌ [HACCP] Erro crítico: Nem aba 'GERAL' nem 'HACCP' encontradas: {e}")
            return pd.DataFrame()
    except Exception as e:
        print(f"❌ [HACCP] Erro ao ler arquivo: {e}")
        return pd.DataFrame()

    df = df.dropna(how="all", axis=1)
    df = df.dropna(how="all", axis=0)
    
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    
    df = df.fillna("")
    
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.strip()

    return df


# ==============================================================================
# 4. CLASSE DE GRÁFICOS (POTABILIDADE - ABA 'GRÁFICO PENDENCIA')
# ==============================================================================
class GraficoPendenciaLoader:
    def __init__(self):
        self.path = current_app.config.get("PATH_GERAL")
        try:
            # Carrega a aba sem cabeçalho para usar índices numéricos absolutos (A=0, K=10)
            self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)
        except Exception as e:
            print(f"❌ [GRÁFICOS] Erro ao abrir aba 'GRÁFICO PENDENCIA': {e}")
            self.df = pd.DataFrame()

    def _ler_bloco(self, row_idx, col_idx, num_val_cols):
        """
        Lê um bloco de dados a partir de uma coordenada (Linha, Coluna).
        Para de ler quando encontra uma linha vazia no rótulo.
        """
        dados = []
        linha = row_idx
        
        # Proteção contra DataFrame vazio ou índices fora do limite
        if self.df.empty or linha >= len(self.df): 
            return pd.DataFrame()

        while linha < len(self.df):
            # 1. Pega o Rótulo (ex: Coluna K = Index 10)
            try:
                rotulo = self.df.iloc[linha, col_idx]
            except IndexError:
                break
            
            # Se rótulo for vazio/NaN, assume fim da tabela
            if pd.isna(rotulo) or str(rotulo).strip() == "":
                break
            
            # 2. Pega os Valores (Colunas à direita do rótulo)
            # col_fim é exclusivo no slice do Python
            col_fim = col_idx + 1 + num_val_cols
            
            # Garante que não estoure o total de colunas do Excel
            if col_fim > self.df.shape[1]:
                col_fim = self.df.shape[1]
                
            valores = list(self.df.iloc[linha, col_idx+1 : col_fim])
            
            # Preenche com 0 se faltar algum dado na direita (celula vazia no final da linha)
            while len(valores) < num_val_cols:
                valores.append(0)
                
            dados.append([rotulo] + valores)
            linha += 1
            
        # Gera nomes de colunas provisórios
        cols = ["rotulo"] + [f"val_{i}" for i in range(num_val_cols)]
        return pd.DataFrame(dados, columns=cols)

    def _processar_para_grafico(self, df):
        """
        Ajusta o DataFrame cru para o formato JSON.
        Promove a primeira linha (cabeçalho da tabela no Excel) para nome das colunas.
        """
        if df.empty: return pd.DataFrame()
        
        try:
            # A linha 0 do DataFrame contem os cabeçalhos (ex: "OK", "NOK") lidos do Excel
            df = df.set_index("rotulo") 
            
            new_header = df.iloc[0] # Pega a primeira linha de dados como Header
            df = df[1:]             # Remove essa linha dos dados
            df.columns = new_header # Aplica o Header nas colunas
            
            # Reseta o índice para que a coluna de rótulos (ex: Regional) volte a ser coluna normal
            df = df.reset_index()
            
            # Limpeza do nome do índice se ficar sujo
            df.columns.name = None
            
            return df
        except Exception:
            return pd.DataFrame()

    def load_all(self):
        """
        Lê os gráficos usando as coordenadas mapeadas:
        Coluna K = Index 10
        """
        if self.df.empty: return {}
        
        # Constante: Coluna K no Excel é índice 10 no Pandas (0-based)
        COL_K = 10 
        
        graficos = {}

        # 1. Restaurante Anual ($K$3:$N$15)
        # Linha 3 Excel = Index 2
        # Colunas L, M, N = 3 colunas de valor
        df_anual = self._ler_bloco(row_idx=2, col_idx=COL_K, num_val_cols=3)
        graficos["restaurante_anual"] = self._processar_para_grafico(df_anual)

        # 2. Regional ($K$20:$O$32)
        # Linha 20 Excel = Index 19
        # Colunas L, M, N, O = 4 colunas de valor
        df_reg = self._ler_bloco(row_idx=19, col_idx=COL_K, num_val_cols=4)
        graficos["restaurante_regional"] = self._processar_para_grafico(df_reg)

        # 3. Back Room ($K$38:$O$42)
        # Linha 38 Excel = Index 37
        # Colunas L, M, N, O = 4 colunas de valor
        df_back = self._ler_bloco(row_idx=37, col_idx=COL_K, num_val_cols=4)
        graficos["backroom"] = self._processar_para_grafico(df_back)

        # 4. Gelo ($K$50:$O$54)
        # Linha 50 Excel = Index 49
        # Colunas L, M, N, O = 4 colunas de valor
        df_gelo = self._ler_bloco(row_idx=49, col_idx=COL_K, num_val_cols=4)
        graficos["gelo"] = self._processar_para_grafico(df_gelo)

        # 5. Pendência Gelo ($K$65:$N$69)
        # Linha 65 Excel = Index 64
        # Colunas L, M, N = 3 colunas de valor
        df_pend_gelo = self._ler_bloco(row_idx=64, col_idx=COL_K, num_val_cols=3)
        graficos["pendencias_gelo"] = self._processar_para_grafico(df_pend_gelo)

        return graficos


# ==============================================================================
# 5. FUNÇÕES HELPER EXPORTADAS
# ==============================================================================

def get_dataframe():
    return load_geral_dataframe()

def refresh_dataframe():
    cache.clear()
    print("🧹 [CACHE] Cache limpo.")

def load_all_graphics():
    """Carrega todos os dados da aba GRÁFICO PENDENCIA da planilha Geral."""
    loader = GraficoPendenciaLoader()
    return loader.load_all()


# ==============================================================================
# 6. LOADER ESPECÍFICO PARA GRÁFICOS HACCP
# ==============================================================================
def load_haccp_graphics_data():
    """
    Carrega dados da aba 'GRÁFICO' do arquivo HACCP.
    """
    path = current_app.config.get("PATH_HACCP")
    if not path: return {}

    try:
        df = pd.read_excel(path, sheet_name="GRÁFICO", header=None)
        resultados = {
            "regional": {}, 
            "consultor": {},
            "nao_conformidades": {} 
        }

        # --- 1. Lógica das Tabelas Dinâmicas ---
        def extrair_tabela(start_row, start_col):
            dados = {}
            row = start_row + 1 
            while row < len(df):
                chave = df.iloc[row, start_col]
                valor = df.iloc[row, start_col + 1]
                if pd.isna(chave) or str(chave).strip() == "" or str(chave).lower() == "total geral":
                    break
                dados[str(chave).strip()] = valor
                row += 1
            return dados

        for r in range(min(20, len(df))):
            for c in range(min(20, len(df.columns))):
                cell = str(df.iloc[r, c]).strip()
                if cell == "Rótulos de Linha":
                    if c < 5: 
                        resultados["consultor"] = extrair_tabela(r, c)
                    else:
                        resultados["regional"] = extrair_tabela(r, c)

        # --- 2. Lógica da Tabela Fixa A23:J24 ---
        try:
            if len(df) >= 24:
                headers = df.iloc[22, 0:10] 
                values = df.iloc[23, 0:10]  
                for h, v in zip(headers, values):
                    if pd.notna(h) and str(h).strip() != "":
                        resultados["nao_conformidades"][str(h).strip()] = v
        except Exception as e:
            print(f"⚠️ [HACCP] Erro ao ler tabela de não conformidades: {e}")

        return resultados

    except Exception as e:
        print(f"❌ [HACCP GRAPHICS] Erro ao ler aba GRÁFICO: {e}")
        return {}