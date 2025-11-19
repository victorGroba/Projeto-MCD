import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

class GraficoPendenciaLoader:

    def __init__(self, excel_path: str):
        self.path = excel_path
        # Lê sem cabeçalho para usarmos índices numéricos fixos
        self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)

    def _ler_bloco_dinamico(self, linha_inicio, col_inicio, num_cols):
        """Lê linhas até encontrar vazio na coluna de rótulo."""
        dados = []
        linha = linha_inicio
        while linha < len(self.df) and pd.notna(self.df.iloc[linha, col_inicio]):
            rotulo = self.df.iloc[linha, col_inicio]
            valores = list(self.df.iloc[linha, col_inicio+1 : col_inicio+1+num_cols])
            dados.append([rotulo] + valores)
            linha += 1
        return dados

    # -------------------------------------------------------
    # 1. PENDÊNCIA ANUAL (NÃO Transpor - Eixo X deve ser Mês)
    # -------------------------------------------------------
    def load_pendencia_anual(self):
        anos = list(self.df.iloc[2, 8:11]) 
        cols = ["mes"] + [str(a) for a in anos]
        dados = self._ler_bloco_dinamico(3, 7, 3)
        return pd.DataFrame(dados, columns=cols)

    # -------------------------------------------------------
    # 2. PENDÊNCIA REGIONAL (TRANSPOR - Eixo X deve ser Regional)
    # -------------------------------------------------------
    def load_pendencia_regional(self):
        # Lê cabeçalhos (Regionais)
        regionais = []
        c = 8
        while c < len(self.df.columns) and pd.notna(self.df.iloc[21, c]):
            regionais.append(self.df.iloc[21, c])
            c += 1
        
        # Lê dados (Linhas = Meses)
        dados = self._ler_bloco_dinamico(22, 7, len(regionais))
        df = pd.DataFrame(dados, columns=["mes"] + [str(r) for r in regionais])

        # ROTACIONAR A TABELA
        # Antes: Linhas=Jan,Fev... | Colunas=BRA,RSOU...
        # Depois: Linhas=BRA,RSOU... | Colunas=Jan,Fev... (Igual ao gráfico do Excel)
        df = df.set_index("mes").transpose().reset_index()
        df.columns.values[0] = "regional" # Renomeia a nova coluna de índice
        
        return df

    # -------------------------------------------------------
    # 3. BACKROOM (TRANSPOR - Eixo X deve ser Status)
    # -------------------------------------------------------
    def load_backroom(self):
        # Lê cabeçalhos (Status: Programado, Insatisfatório...)
        categorias = []
        c = 8
        while c < len(self.df.columns) and pd.notna(self.df.iloc[37, c]):
            categorias.append(self.df.iloc[37, c])
            c += 1
            
        # Lê dados (Linhas = Regionais)
        dados = self._ler_bloco_dinamico(38, 7, len(categorias))
        df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

        # ROTACIONAR A TABELA
        # Antes: Linhas=Regionais | Colunas=Status
        # Depois: Linhas=Status | Colunas=Regionais
        df = df.set_index("regional").transpose().reset_index()
        df.columns.values[0] = "status"

        return df

    # -------------------------------------------------------
    # 4. GELO (TRANSPOR - Eixo X deve ser Status)
    # -------------------------------------------------------
    def load_gelo(self):
        categorias = []
        c = 8
        while c < len(self.df.columns) and pd.notna(self.df.iloc[49, c]):
            categorias.append(self.df.iloc[49, c])
            c += 1
            
        dados = self._ler_bloco_dinamico(50, 7, len(categorias))
        df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

        # Rotacionar
        df = df.set_index("regional").transpose().reset_index()
        df.columns.values[0] = "status"

        return df

    # -------------------------------------------------------
    # 5. PENDÊNCIAS GELO (TRANSPOR - Eixo X deve ser Status)
    # -------------------------------------------------------
    def load_pendencias_gelo(self):
        categorias = []
        c = 8
        while c < len(self.df.columns) and pd.notna(self.df.iloc[64, c]):
            categorias.append(self.df.iloc[64, c])
            c += 1

        dados = self._ler_bloco_dinamico(65, 7, len(categorias))
        df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

        # Rotacionar
        df = df.set_index("regional").transpose().reset_index()
        df.columns.values[0] = "status"

        return df

    # -------------------------------------------------------
    # LOAD ALL
    # -------------------------------------------------------
    def load_all(self):
        return {
            "restaurante_anual": self.load_pendencia_anual(),
            "restaurante_regional": self.load_pendencia_regional(),
            "backroom": self.load_backroom(),
            "gelo": self.load_gelo(),
            "pendencias_gelo": self.load_pendencias_gelo()
        }

# =========================================================
#  Compatibilidade
# =========================================================
from mcdagua.routes.api import load_geral_dataframe

def get_dataframe():
    return load_geral_dataframe()

def refresh_dataframe():
    cache.clear()

def load_all_graphics():
    excel_path = current_app.config["EXCEL_PATH"]
    loader = GraficoPendenciaLoader(excel_path)
    return loader.load_all()