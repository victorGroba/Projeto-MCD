import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

# ==============================================================================
# 1. LOADER GERAL (Movido de api.py para corrigir importação circular)
# ==============================================================================
def load_geral_dataframe():
    path = current_app.config["EXCEL_PATH"]

    try:
        # header=1 : Pula a primeira linha (Título) e usa a segunda como cabeçalho
        df = pd.read_excel(path, sheet_name="GERAL", header=1)
    except Exception as e:
        print(f"Erro ao ler Excel (Geral): {e}")
        return pd.DataFrame()

    # Limpeza e Padronização dos Nomes das Colunas
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

    # Remove colunas que não têm nome (geradas por células vazias no header)
    df = df.loc[:, ~df.columns.str.contains('^unnamed')]
    
    # Remove colunas/linhas que estão totalmente vazias
    df = df.dropna(how="all", axis=1)
    df = df.dropna(how="all", axis=0)

    # Preenche valores nulos com vazio para o JSON não quebrar
    df = df.fillna("")

    return df

# ==============================================================================
# 2. LOADERS DOS NOVOS MÓDULOS (VISA e HACCP)
# ==============================================================================

def load_visa_dataframe():
    """Carrega a aba 'Consolidado Coletas' da Planilha Mãe."""
    path = current_app.config["EXCEL_PATH"]
    try:
        df = pd.read_excel(path, sheet_name="Consolidado Coletas")
        
        # Limpeza de nomes das colunas
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
        
        # Converte colunas de data para texto
        for col in df.columns:
            if "data" in col:
                df[col] = df[col].astype(str).replace("NaT", "")
        
        df = df.fillna("")
        return df
    except Exception as e:
        print(f"❌ [VISA] Erro ao carregar aba 'Consolidado Coletas': {e}")
        return pd.DataFrame()

def load_haccp_dataframe():
    """Carrega a aba 'HACCP' da Planilha Mãe."""
    path = current_app.config["EXCEL_PATH"]
    try:
        # header=1 assume que a primeira linha é título e a segunda é o cabeçalho real
        df = pd.read_excel(path, sheet_name="HACCP", header=1)
        
        # Remove colunas e linhas vazias
        df = df.dropna(how="all", axis=1)
        df = df.dropna(how="all", axis=0)
        
        # Padronização de colunas
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
        
        df = df.fillna("")
        return df
    except Exception as e:
        print(f"❌ [HACCP] Erro ao carregar aba 'HACCP': {e}")
        return pd.DataFrame()

# ==============================================================================
# 3. CLASSE DE CARREGAMENTO DE GRÁFICOS (LEGADO)
# ==============================================================================
class GraficoPendenciaLoader:

    def __init__(self, excel_path: str):
        self.path = excel_path
        # Lê sem cabeçalho para garantir acesso por índices numéricos fixos (0, 1, 2...)
        try:
            self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)
            print(f"✅ [LOADER] Planilha carregada. Linhas: {len(self.df)}")
        except Exception as e:
            print(f"❌ [LOADER] Erro ao abrir planilha de gráficos: {e}")
            self.df = pd.DataFrame()

    def _ler_bloco_dinamico(self, linha_inicio, col_inicio, num_cols):
        """Lê o bloco de dados até encontrar linha vazia na coluna de rótulo."""
        dados = []
        linha = linha_inicio
        
        if linha >= len(self.df):
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
            anos = list(self.df.iloc[2, 8:11]) 
            cols = ["mes"] + [str(a) for a in anos]
            dados = self._ler_bloco_dinamico(3, 7, 3)
            return pd.DataFrame(dados, columns=cols)
        except:
            return pd.DataFrame()

    def load_pendencia_regional(self):
        try:
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
# 4. FUNÇÕES HELPER EXPORTADAS
# ==============================================================================

def get_dataframe():
    """Retorna o DataFrame da aba GERAL (usado pelo dashboard legacy)."""
    return load_geral_dataframe()

def refresh_dataframe():
    """Limpa o cache para forçar recarregamento."""
    with current_app.app_context():
        cache.clear()

def load_all_graphics():
    """Carrega todos os dados da aba GRÁFICO PENDENCIA."""
    excel_path = current_app.config["EXCEL_PATH"]
    loader = GraficoPendenciaLoader(excel_path)
    return loader.load_all()