import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

# =========================================================
#  NOVA CLASSE: Leitura dos 5 blocos da aba GRÁFICO PENDENCIA
# =========================================================

class GraficoPendenciaLoader:

    def __init__(self, excel_path: str):
        self.path = excel_path
        self.df = pd.read_excel(self.path, sheet_name="GRÁFICO PENDENCIA", header=None)

    # -------------------------------------------------------
    # BLOCO 1 — Pendência Restaurante Anual
    # -------------------------------------------------------
    def load_pendencia_anual(self):
        anos = [
            int(self.df.iloc[2, 8]),   # 2023
            int(self.df.iloc[2, 9]),   # 2024
            int(self.df.iloc[2, 10])   # 2025
        ]

        dados = []
        linha = 3  # primeira linha dos meses

        while pd.notna(self.df.iloc[linha, 7]):
            mes = self.df.iloc[linha, 7]
            valores = [
                self.df.iloc[linha, 8],
                self.df.iloc[linha, 9],
                self.df.iloc[linha, 10]
            ]
            dados.append([mes] + valores)
            linha += 1

        return pd.DataFrame(dados, columns=["mes"] + [str(a) for a in anos])

    # -------------------------------------------------------
    # BLOCO 2 — Pendência por Regional
    # -------------------------------------------------------
    def load_pendencia_regional(self):
        start = 22
        col_mes = 7
        regionais = list(self.df.iloc[21, 8:12])  # BRA, RSOU, SAO1, SAO2

        dados = []
        linha = start

        while pd.notna(self.df.iloc[linha, col_mes]):
            mes = self.df.iloc[linha, col_mes]
            valores = list(self.df.iloc[linha, 8:12])
            dados.append([mes] + valores)
            linha += 1

        return pd.DataFrame(dados, columns=["mes"] + regionais)

    # -------------------------------------------------------
    # BLOCO 3 — Backroom
    # -------------------------------------------------------
    def load_backroom(self):
        start = 38
        regionais = list(self.df.iloc[start:start+4, 7])
        colunas = list(self.df.iloc[start-1, 8:12])

        dados = []
        for i in range(len(regionais)):
            valores = list(self.df.iloc[start+i, 8:12])
            dados.append([regionais[i]] + valores)

        return pd.DataFrame(dados, columns=["regional"] + colunas)

    # -------------------------------------------------------
    # BLOCO 4 — Gelo
    # -------------------------------------------------------
    def load_gelo(self):
        start = 50
        regionais = list(self.df.iloc[start:start+4, 7])
        colunas = list(self.df.iloc[start-1, 8:12])

        dados = []
        for i in range(len(regionais)):
            valores = list(self.df.iloc[start+i, 8:12])
            dados.append([regionais[i]] + valores)

        return pd.DataFrame(dados, columns=["regional"] + colunas)

    # -------------------------------------------------------
    # BLOCO 5 — Pendências de Gelo
    # -------------------------------------------------------
    def load_pendencias_gelo(self):
        colunas = list(self.df.iloc[64, 8:11])
        regionais = list(self.df.iloc[65:69, 7])

        dados = []
        for i in range(len(regionais)):
            valores = list(self.df.iloc[65+i, 8:11])
            dados.append([regionais[i]] + valores)

        return pd.DataFrame(dados, columns=["regional"] + colunas)

    # -------------------------------------------------------
    # Retornar todos os blocos organizados em um único dicionário
    # -------------------------------------------------------
    def load_all(self):
        return {
            "pendencia_anual": self.load_pendencia_anual(),
            "pendencia_regional": self.load_pendencia_regional(),
            "backroom": self.load_backroom(),
            "gelo": self.load_gelo(),
            "pendencias_gelo": self.load_pendencias_gelo()
        }


# =========================================================
#  Funções esperadas pelo RESTO DO PROJETO (compatibilidade)
# =========================================================

from mcdagua.routes.api import load_geral_dataframe

# ---------------------------------------------------------
#  Compatibilidade: função antiga usada pelas telas antigas
# ---------------------------------------------------------
def get_dataframe():
    return load_geral_dataframe()

# ---------------------------------------------------------
#  Compatibilidade: refresh após upload da nova planilha
# ---------------------------------------------------------
def refresh_dataframe():
    """
    Apenas limpa o cache para forçar recarregamento dos dados.
    """
    cache.clear()

# ---------------------------------------------------------
#  Compatibilidade: leitor geral dos gráficos (telas antigas)
# ---------------------------------------------------------
def load_all_graphics():
    excel_path = current_app.config["EXCEL_PATH"]
    loader = GraficoPendenciaLoader(excel_path)
    return loader.load_all()
