import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

class GraficoPendenciaLoader:

    def __init__(self, excel_path: str):
        self.path = excel_path
        # Lê sem cabeçalho para garantir acesso por índices numéricos fixos
        try:
            self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)
            print(f"✅ [LOADER] Planilha carregada. Linhas: {len(self.df)}")
        except Exception as e:
            print(f"❌ [LOADER] Erro ao abrir planilha: {e}")
            self.df = pd.DataFrame()

    def _ler_bloco_dinamico(self, linha_inicio, col_inicio, num_cols):
        """Lê o bloco de dados até encontrar linha vazia na coluna de rótulo."""
        dados = []
        linha = linha_inicio
        
        while linha < len(self.df):
            rotulo = self.df.iloc[linha, col_inicio]
            # Se o rótulo for vazio, NaN ou um número solto onde deveria ser texto, paramos (opcional)
            if pd.isna(rotulo) or str(rotulo).strip() == "":
                break
            
            # Pega os valores das colunas à direita
            valores = list(self.df.iloc[linha, col_inicio+1 : col_inicio+1+num_cols])
            dados.append([rotulo] + valores)
            linha += 1
            
        return dados

    # -------------------------------------------------------
    # 1. ANUAL
    # -------------------------------------------------------
    def load_pendencia_anual(self):
        try:
            anos = list(self.df.iloc[2, 8:11]) 
            cols = ["mes"] + [str(a) for a in anos]
            dados = self._ler_bloco_dinamico(3, 7, 3)
            return pd.DataFrame(dados, columns=cols)
        except:
            return pd.DataFrame()

    # -------------------------------------------------------
    # 2. REGIONAL (Transposto)
    # -------------------------------------------------------
    def load_pendencia_regional(self):
        try:
            regionais = []
            c = 8
            while c < len(self.df.columns) and pd.notna(self.df.iloc[21, c]):
                regionais.append(self.df.iloc[21, c])
                c += 1
            
            dados = self._ler_bloco_dinamico(22, 7, len(regionais))
            df = pd.DataFrame(dados, columns=["mes"] + [str(r) for r in regionais])

            # Transpor: Linhas=Meses -> Eixo X=Regional
            if not df.empty:
                df = df.set_index("mes").transpose().reset_index()
                df.rename(columns={"index": "regional"}, inplace=True) 
            
            return df
        except Exception as e:
            print(f"Erro Regional: {e}")
            return pd.DataFrame()

    # -------------------------------------------------------
    # 3. BACKROOM (CORRIGIDO - Lógica idêntica ao Gelo)
    # -------------------------------------------------------
    def load_backroom(self):
        try:
            # Linha 37: Cabeçalhos (Programado, Insatisfatório...)
            categorias = []
            c = 8
            while c < len(self.df.columns) and pd.notna(self.df.iloc[37, c]):
                categorias.append(self.df.iloc[37, c])
                c += 1
            
            # Linha 38: Dados (Linhas são Regionais: RSOU, BRA...)
            # IMPORTANTE: A coluna 7 (H) deve ter os nomes "BRA", "RSOU", etc.
            dados = self._ler_bloco_dinamico(38, 7, len(categorias))
            
            df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

            # Debug para garantir que leu certo antes de transpor
            # print("Dados Backroom Lidos (Antes Transpor):", df.head())

            # TRANSPOSIÇÃO:
            # 1. Define 'regional' como índice (para não perder os nomes BRA, RSOU)
            # 2. Transpõe (Regionais viram colunas, Status viram linhas)
            # 3. Renomeia o novo índice para 'status' (para o Frontend achar o Eixo X)
            if not df.empty:
                df = df.set_index("regional").transpose().reset_index()
                df.rename(columns={"index": "status"}, inplace=True) # UNIFICADO COM O GELO

            return df
        except Exception as e:
            print(f"⚠️ [LOADER] Erro Backroom: {e}")
            return pd.DataFrame()

    # -------------------------------------------------------
    # 4. GELO (Referência Correta)
    # -------------------------------------------------------
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
                df.rename(columns={"index": "status"}, inplace=True) # UNIFICADO

            return df
        except:
            return pd.DataFrame()

    # -------------------------------------------------------
    # 5. PENDÊNCIAS GELO
    # -------------------------------------------------------
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
                df.rename(columns={"index": "status"}, inplace=True) # UNIFICADO

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

# Helpers
from mcdagua.routes.api import load_geral_dataframe

def get_dataframe():
    return load_geral_dataframe()

def refresh_dataframe():
    with current_app.app_context():
        cache.clear()

def load_all_graphics():
    excel_path = current_app.config["EXCEL_PATH"]
    loader = GraficoPendenciaLoader(excel_path)
    return loader.load_all()