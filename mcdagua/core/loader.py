import pandas as pd
from flask import current_app
from mcdagua.extensions import cache

class GraficoPendenciaLoader:

    def __init__(self, excel_path: str):
        self.path = excel_path
        # Lê sem cabeçalho para garantir acesso por índices numéricos fixos (0, 1, 2...)
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
        
        # Verifica se a linha inicial está dentro do limite antes de começar
        if linha >= len(self.df):
            return dados
        
        while linha < len(self.df):
            rotulo = self.df.iloc[linha, col_inicio]
            # Se o rótulo for vazio, NaN ou string vazia, paramos
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
    # -------------------------------------------------------
    # 2. REGIONAL (CORRIGIDO PELO PRINT)
    # -------------------------------------------------------
    # -------------------------------------------------------
    # 2. REGIONAL (CORRIGIDO PELO PRINT)
    # -------------------------------------------------------
    def load_pendencia_regional(self):
        try:
            # ================= CONFIGURAÇÃO EXATA (BASEADA NO PRINT) =================
            # A imagem mostra que:
            # - Os cabeçalhos (BRA, RSOU, SAO1...) estão na linha 21 do Excel.
            # - Os dados (janeiro, fevereiro...) começam na linha 22 do Excel.
            # - Os nomes dos meses estão na Coluna G.
            # - Os números começam na Coluna H.
            
            ROW_HEADER = 20  # Linha 21 do Excel (índice 20)
            ROW_DATA   = 21  # Linha 22 do Excel (índice 21)
            COL_NAMES  = 6   # Coluna G (índice 6)
            COL_START  = 7   # Coluna H (índice 7)
            # =========================================================================

            if not self.df.empty:
                print(f"\n🔍 [DEBUG REGIONAL] Validando coordenadas:")
                if len(self.df) > ROW_DATA and len(self.df.columns) > COL_START:
                    txt_header = self.df.iloc[ROW_HEADER, COL_START] # Esperado: "BRA" (ou similar)
                    txt_dado   = self.df.iloc[ROW_DATA, COL_NAMES]   # Esperado: "janeiro"
                    print(f"   -> Header (L21/Col H): '{txt_header}'")
                    print(f"   -> Dado   (L22/Col G): '{txt_dado}'")

            regionais = []
            c = COL_START
            # Lê as colunas de cabeçalho (Regionais) até acabar
            while c < len(self.df.columns):
                val = self.df.iloc[ROW_HEADER, c]
                if pd.isna(val) or str(val).strip() == "":
                    break
                regionais.append(val)
                c += 1
            
            # Lê as linhas de dados (Meses)
            dados = self._ler_bloco_dinamico(ROW_DATA, COL_NAMES, len(regionais))
            
            # Cria o DataFrame na ordem exata da planilha (Janeiro, Fevereiro...)
            df = pd.DataFrame(dados, columns=["mes"] + [str(r) for r in regionais])

            # TRANSPOSIÇÃO: 
            # O Excel tem Meses nas linhas e Regionais nas colunas.
            # O gráfico precisa de Regionais no Eixo X. Por isso transpomos.
            # A ordem das colunas (Meses) será preservada.
            if not df.empty:
                df = df.set_index("mes").transpose().reset_index()
                df.rename(columns={"index": "regional"}, inplace=True) 
            
            return df
        except Exception as e:
            print(f"⚠️ [LOADER] Erro Regional: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
    # -------------------------------------------------------
    # 3. BACKROOM (COM DEBUG ATIVO)
    # -------------------------------------------------------
    # -------------------------------------------------------
    # 3. BACKROOM (CORRIGIDO PELO PRINT)
    # -------------------------------------------------------
    def load_backroom(self):
        try:
            # ================= CONFIGURAÇÃO EXATA (BASEADA NO PRINT) =================
            # Excel Linha 36 -> Python 35
            # Excel Coluna G -> Python 6
            
            ROW_HEADER = 35  # Linha 36 do Excel ("Programado", "Insatisfatório"...)
            ROW_DATA   = 36  # Linha 37 do Excel (Começa "RSOU"...)
            COL_NAMES  = 6   # Coluna G (Onde estão os nomes RSOU, BRA...)
            COL_START  = 7   # Coluna H (Onde começam os números)
            # =========================================================================

            # DEBUG: Confirma no terminal se pegou o texto certo
            if not self.df.empty:
                print(f"\n🔍 [DEBUG BACKROOM] Validando coordenadas:")
                # Proteção de índice
                if len(self.df) > ROW_DATA and len(self.df.columns) > COL_START:
                    txt_header = self.df.iloc[ROW_HEADER, COL_START] # Esperado: "Programado"
                    txt_dado   = self.df.iloc[ROW_DATA, COL_NAMES]   # Esperado: "RSOU"
                    print(f"   -> Header (L36/Col H): '{txt_header}'")
                    print(f"   -> Dado   (L37/Col G): '{txt_dado}'")
                else:
                    print("   -> ❌ Índices fora do limite da planilha.")

            categorias = []
            c = COL_START
            # Lê os cabeçalhos até acabar ou encontrar vazio
            while c < len(self.df.columns):
                val = self.df.iloc[ROW_HEADER, c]
                if pd.isna(val) or str(val).strip() == "":
                    break
                categorias.append(val)
                c += 1
            
            # Lê os dados (Regionais e valores)
            dados = self._ler_bloco_dinamico(ROW_DATA, COL_NAMES, len(categorias))
            
            df = pd.DataFrame(dados, columns=["regional"] + [str(cat) for cat in categorias])

            # TRANSPOSIÇÃO (Pivotar a tabela para o formato do gráfico)
            if not df.empty:
                df = df.set_index("regional").transpose().reset_index()
                df.rename(columns={"index": "status"}, inplace=True)

            return df
        except Exception as e:
            print(f"⚠️ [LOADER] Erro Backroom: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()

    # -------------------------------------------------------
    # 4. GELO
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
                df.rename(columns={"index": "status"}, inplace=True)

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