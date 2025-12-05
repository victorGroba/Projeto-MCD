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
    Lê a configuração 'PATH_VISA' do .env.
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
    Lê a configuração 'PATH_HACCP' do .env.
    Aba esperada: 'GERAL' (conforme seu arquivo 'Planilha Controle - HACCP.xlsx')
    """
    path = current_app.config.get("PATH_HACCP")

    if not path:
        print("⚠️ [LOADER] PATH_HACCP não configurado.")
        return pd.DataFrame()

    try:
        # Tenta ler a aba "GERAL" com header na linha 2 (índice 1)
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
# 4. CLASSE DE GRÁFICOS (LEGADO / GERAL)
# ==============================================================================
class GraficoPendenciaLoader:
    def __init__(self):
        # Assume-se que os gráficos gerais vêm da planilha de Potabilidade (Geral)
        self.path = current_app.config.get("PATH_GERAL")
        try:
            self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)
        except Exception as e:
            print(f"❌ [GRÁFICOS] Erro ao abrir aba 'GRÁFICO PENDENCIA' do arquivo Geral: {e}")
            self.df = pd.DataFrame()

    def _ler_bloco_dinamico(self, linha_inicio, col_inicio, num_cols):
        dados = []
        linha = linha_inicio
        
        if self.df.empty or linha >= len(self.df):
            return dados
        
        while linha < len(self.df):
            rotulo = self.df.iloc[linha, col_inicio]
            if pd.isna(rotulo) or str(rotulo).strip() == "":
                break
            
            valores = list(self.df.iloc[linha, col_inicio+1 : col_inicio+1+num_cols])
            dados.append([rotulo] + valores)
            linha += 1
            
        return dados

    def load_pendencia_anual(self):
        try:
            if self.df.empty: return pd.DataFrame()
            anos = list(self.df.iloc[2, 8:11]) 
            cols = ["mes"] + [str(a) for a in anos]
            dados = self._ler_bloco_dinamico(3, 7, 3)
            return pd.DataFrame(dados, columns=cols)
        except:
            return pd.DataFrame()

    def load_pendencia_regional(self):
        try:
            if self.df.empty: return pd.DataFrame()
            ROW_HEADER = 20
            ROW_DATA   = 21
            COL_NAMES  = 6
            COL_START  = 7

            regionais = []
            c = COL_START
            while c < len(self.df.columns):
                val = self.df.iloc[ROW_HEADER, c]
                if pd.isna(val) or str(val).strip() == "":
                    break
                regionais.append(val)
                c += 1
            
            dados = self._ler_bloco_dinamico(ROW_DATA, COL_NAMES, len(regionais))
            df = pd.DataFrame(dados, columns=["mes"] + [str(r) for r in regionais])

            if not df.empty:
                df = df.set_index("mes").transpose().reset_index()
                df.rename(columns={"index": "regional"}, inplace=True) 
            
            return df
        except:
            return pd.DataFrame()

    def load_backroom(self):
        try:
            if self.df.empty: return pd.DataFrame()
            ROW_HEADER = 35
            ROW_DATA   = 36
            COL_NAMES  = 6
            COL_START  = 7
            
            categorias = []
            c = COL_START
            while c < len(self.df.columns):
                val = self.df.iloc[ROW_HEADER, c]
                if pd.isna(val) or str(val).strip() == "":
                    break
                categorias.append(val)
                c += 1
            
            dados = self._ler_bloco_dinamico(ROW_DATA, COL_NAMES, len(categorias))
            df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

            if not df.empty:
                df = df.set_index("regional").transpose().reset_index()
                df.rename(columns={"index": "status"}, inplace=True)

            return df
        except:
            return pd.DataFrame()

    def load_gelo(self):
        try:
            if self.df.empty: return pd.DataFrame()
            categorias = []
            c = 8
            while c < len(self.df.columns) and pd.notna(self.df.iloc[49, c]):
                categorias.append(self.df.iloc[49, c])
                c += 1
                
            dados = self._ler_bloco_dinamico(50, 7, len(categorias))
            df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

            if not df.empty:
                df = df.set_index("regional").transpose().reset_index()
                df.rename(columns={"index": "status"}, inplace=True)

            return df
        except:
            return pd.DataFrame()

    def load_pendencias_gelo(self):
        try:
            if self.df.empty: return pd.DataFrame()
            categorias = []
            c = 8
            while c < len(self.df.columns) and pd.notna(self.df.iloc[64, c]):
                categorias.append(self.df.iloc[64, c])
                c += 1

            dados = self._ler_bloco_dinamico(65, 7, len(categorias))
            df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

            if not df.empty:
                df = df.set_index("regional").transpose().reset_index()
                df.rename(columns={"index": "status"}, inplace=True)

            return df
        except:
            return pd.DataFrame()

    def load_all(self):
        return {
            "restaurante_anual": self.load_pendencia_anual(),
            "restaurante_regional": self.load_pendencia_regional(),
            "backroom": self.load_backroom(),
            "gelo": self.load_gelo(),
            "pendencias_gelo": self.load_pendencias_gelo()
        }


# ==============================================================================
# 5. FUNÇÕES HELPER EXPORTADAS
# ==============================================================================

def get_dataframe():
    """Retorna o DataFrame da aba GERAL (usado pelo dashboard legacy)."""
    return load_geral_dataframe()

def refresh_dataframe():
    """Limpa o cache para forçar recarregamento."""
    cache.clear()
    print("🧹 [CACHE] Cache limpo. Próxima requisição recarregará os arquivos.")

def load_all_graphics():
    """Carrega todos os dados da aba GRÁFICO PENDENCIA da planilha Geral."""
    loader = GraficoPendenciaLoader()
    return loader.load_all()


# ==============================================================================
# 6. LOADER ESPECÍFICO PARA GRÁFICOS HACCP (CORREÇÃO: 10 COLUNAS A-J)
# ==============================================================================
def load_haccp_graphics_data():
    """
    Carrega dados da aba 'GRÁFICO' do arquivo HACCP.
    Inclui: Tabelas dinâmicas e tabela fixa de Não Conformidades (A23:J24).
    """
    path = current_app.config.get("PATH_HACCP")
    if not path: return {}

    try:
        # Lê a aba GRÁFICO sem cabeçalho para mapear posições
        df = pd.read_excel(path, sheet_name="GRÁFICO", header=None)
        
        resultados = {
            "regional": {}, 
            "consultor": {},
            "nao_conformidades": {} 
        }

        # --- 1. Lógica das Tabelas Dinâmicas (Regional e Consultor) ---
        def extrair_tabela(start_row, start_col):
            dados = {}
            row = start_row + 1 
            while row < len(df):
                chave = df.iloc[row, start_col]
                valor = df.iloc[row, start_col + 1]
                # Para quando acabar os dados ou chegar no Total Geral
                if pd.isna(chave) or str(chave).strip() == "" or str(chave).lower() == "total geral":
                    break
                dados[str(chave).strip()] = valor
                row += 1
            return dados

        # Procura "Rótulos de Linha" nas primeiras 20x20 células
        for r in range(min(20, len(df))):
            for c in range(min(20, len(df.columns))):
                cell = str(df.iloc[r, c]).strip()
                if cell == "Rótulos de Linha":
                    # Se estiver na esquerda (coluna < 5), assume Consultor
                    if c < 5: 
                        resultados["consultor"] = extrair_tabela(r, c)
                    else:
                        resultados["regional"] = extrair_tabela(r, c)

        # --- 2. Lógica da Tabela Fixa A23:J24 (Não Conformidades - 10 colunas) ---
        try:
            # Verifica se existem linhas suficientes para acessar a linha 24 (índice 23)
            if len(df) >= 24:
                # Linha 23 (índice 22) = Cabeçalhos
                # Linha 24 (índice 23) = Valores
                
                # Lê das colunas A (0) até J (9) = 10 colunas no total
                # Slice [22, 0:10]
                headers = df.iloc[22, 0:10] 
                values = df.iloc[23, 0:10]  
                
                for h, v in zip(headers, values):
                    if pd.notna(h) and str(h).strip() != "":
                        resultados["nao_conformidades"][str(h).strip()] = v
        except Exception as e:
            print(f"⚠️ [HACCP] Erro ao ler tabela de não conformidades (A23:J24): {e}")

        return resultados

    except Exception as e:
        print(f"❌ [HACCP GRAPHICS] Erro ao ler aba GRÁFICO: {e}")
        return {}