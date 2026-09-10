"""
Processador de dados da planilha APPCC (HACCP - Segurança Alimentar).
Lê a aba GERAL da planilha HACCP e gera dados para 3 gráficos:
  1. Presença de Microrganismos por Equipamento
  2. Principais Pendências por Tipo
  3. Quantidade de Restaurantes por Regional
"""
import unicodedata
from collections import Counter, defaultdict


def _normalizar(texto):
    """Remove acentos, converte para lowercase e strip."""
    if not isinstance(texto, str):
        return str(texto).strip().lower()
    return (
        unicodedata.normalize('NFKD', texto)
        .encode('ASCII', 'ignore')
        .decode('utf-8')
        .strip()
        .lower()
    )



# ==============================================================================
# LEITURA TOLERANTE AO LAYOUT
# A planilha ganhou um bloco de legendas no topo (o cabecalho saiu da linha 2
# para a 7), duas colunas novas (OPCO/LICO e Regional) e passou a registrar os
# microrganismos por codigo numerico em vez de texto. As funcoes abaixo
# localizam tudo por nome / posicao relativa, de modo que os dois layouts --
# o antigo e o novo -- continuem sendo lidos pelo mesmo codigo.
# ==============================================================================

# Legenda de equipamentos/superficies da planilha nova
CODIGOS_MICRO = {
    "1": (True, False),   # mesofilos
    "2": (False, True),   # enterobacterias
    "3": (True, True),    # mesof/enterobacterias
}


def _localizar_cabecalho(ws, max_linhas=15):
    """Devolve a linha do cabecalho -- a que tem SIGLA na coluna A."""
    for r in range(1, max_linhas + 1):
        if _normalizar(str(ws.cell(r, 1).value or "")) == "sigla":
            return r
    return 2  # layout antigo


def _mapa_colunas(ws, linha_cabecalho):
    """{nome normalizado do cabecalho: indice da coluna (1-based)}"""
    mapa = {}
    for col in range(1, (ws.max_column or 1) + 1):
        valor = ws.cell(linha_cabecalho, col).value
        if valor is not None and str(valor).strip():
            mapa.setdefault(_normalizar(str(valor)), col)
    return mapa


def _coluna(mapa, *nomes):
    for nome in nomes:
        idx = mapa.get(_normalizar(nome))
        if idx:
            return idx
    return None


def _colunas_de_analise(mapa):
    """
    As colunas de equipamento/superficie sao as que ficam entre 'Manipulador' e
    'Pendencia'. Vale nos dois layouts (H..M no antigo, J..O no novo) e sobrevive
    a renomeacoes das colunas de equipamento.
    """
    ini = _coluna(mapa, "Manipulador")
    fim = _coluna(mapa, "Pendencia")
    if ini and fim and fim > ini + 1:
        return list(range(ini + 1, fim))
    conhecidas = ["Bico HT", "Fat. Tomates", "Bocal da Foamino", "Bocal da Fomino",
                  "Mesa cond.", "Pegador camara", "Pinca proteina"]
    return [i for i in (_coluna(mapa, n) for n in conhecidas) if i]


def _classificar_microorganismo(valor_celula):
    """
    Classifica o texto livre de uma célula de equipamento.
    Retorna: ('mesofilos': bool, 'enterobacterias': bool)
    
    Variações encontradas na planilha:
      - mesof/enterobactérias, mesof/ entero, mesóf/ enterobactéria → ambos
      - mesófilos, mesofilos → somente mesófilos
      - enterobacterias, enterobactérias → somente enterobactérias
      - ok → satisfatório (ignora)
      - na → não se aplica (ignora)
    """
    if not valor_celula:
        return False, False
    
    texto = _normalizar(str(valor_celula))
    
    # Ignorar valores que não são microorganismos
    if texto in ('ok', 'na', 'nan', 'none', '', 'ook'):
        return False, False

    # A planilha nova registra o resultado pelo codigo da legenda
    # (1 mesofilos, 2 enterobacterias, 3 ambos) em vez do texto.
    codigo = texto[:-2] if texto.endswith('.0') else texto
    if codigo in CODIGOS_MICRO:
        return CODIGOS_MICRO[codigo]
    
    tem_mesofilos = False
    tem_entero = False
    
    # Detecta enterobactérias (deve vir antes de mesófilos para não conflitar)
    if 'entero' in texto:
        tem_entero = True
    
    # Detecta mesófilos
    if 'mesof' in texto or 'mesof' in texto:
        tem_mesofilos = True
    
    # Se não identificou nenhum mas tem texto, pode ser algo inesperado
    # Loga para debug mas não conta
    if not tem_mesofilos and not tem_entero:
        print(f"  ⚠️ [APPCC] Valor não classificado: '{valor_celula}'")
    
    return tem_mesofilos, tem_entero


def processar_microorganismos(path):
    """
    Gráfico 1: Presença de Microrganismos no Restaurante.
    
    Lê as colunas H-M (Bico HT, Fat. Tomates, Bocal da Foamino, Mesa cond., 
    Pegador camara, Pinça proteina) da aba GERAL.
    
    Para cada equipamento, conta quantos restaurantes apresentaram:
      - Mesófilos (qualquer texto contendo 'mesof')
      - Enterobactérias (qualquer texto contendo 'entero')
      - Se contém ambos (ex: 'mesof/entero'), conta nas DUAS categorias
    
    Retorna:
    {
        "labels": ["Bico HT", "Fat. Tomates", ...],
        "mesofilos": [61, 54, ...],
        "enterobacterias": [44, 39, ...],
        "total_restaurantes": 79
    }
    """
    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb['GERAL']
        
        linha_cab = _localizar_cabecalho(ws)
        mapa = _mapa_colunas(ws, linha_cab)
        cols = _colunas_de_analise(mapa)
        if not cols:
            raise ValueError("colunas de equipamento/superficie nao localizadas")

        equipamentos = {
            col: str(ws.cell(linha_cab, col).value or f"Col {col}").strip()
            for col in cols
        }

        # Contar por equipamento
        contagem_meso = {col: 0 for col in equipamentos}
        contagem_entero = {col: 0 for col in equipamentos}
        total_restaurantes = 0

        for row in ws.iter_rows(min_row=linha_cab + 1, min_col=1, max_col=max(cols) + 1):
            sigla = row[0].value  # Col A - SIGLA
            if not sigla or str(sigla).strip().upper() in ('', 'NAN', 'NONE'):
                continue

            # A planilha ja traz as visitas programadas, ainda sem analise:
            # sem nenhum resultado preenchido, a linha nao e uma coleta realizada.
            if all(row[col - 1].value is None or str(row[col - 1].value).strip() == ''
                   for col in equipamentos):
                continue

            total_restaurantes += 1
            
            for col_idx in equipamentos:
                cell_val = row[col_idx - 1].value  # row é 0-indexed
                tem_meso, tem_entero = _classificar_microorganismo(cell_val)
                
                if tem_meso:
                    contagem_meso[col_idx] += 1
                if tem_entero:
                    contagem_entero[col_idx] += 1
        
        wb.close()
        
        # Montar resultado
        labels = [equipamentos[col] for col in sorted(equipamentos.keys())]
        mesofilos = [contagem_meso[col] for col in sorted(equipamentos.keys())]
        enterobacterias = [contagem_entero[col] for col in sorted(equipamentos.keys())]
        
        print(f"✅ [APPCC MICRO] {total_restaurantes} restaurantes processados")
        for i, label in enumerate(labels):
            print(f"   {label}: Mesófilos={mesofilos[i]}, Enterobactérias={enterobacterias[i]}")
        
        return {
            "labels": labels,
            "mesofilos": mesofilos,
            "enterobacterias": enterobacterias,
            "total_restaurantes": total_restaurantes
        }
    
    except Exception as e:
        print(f"❌ [APPCC MICRO] Erro: {e}")
        import traceback
        traceback.print_exc()
        return {
            "labels": [],
            "mesofilos": [],
            "enterobacterias": [],
            "total_restaurantes": 0
        }


def processar_pendencias_appcc(path):
    """
    Gráfico 2: Principais Pendências encontradas no Restaurante.
    
    Lê a coluna N (Pendência) da aba GERAL.
    O texto pode conter múltiplas categorias separadas por vírgula/e:
      - "manipulador, surpeficie e equipamento" → conta 3 categorias
      - "equipamento e superficie" → conta 2 categorias
      - "ok" → categoria Ok
    
    Categorias normalizadas:
      - Equipamento: 'equipamento', 'equipamentos'
      - Superfície: 'superficie', 'superficies', 'surpeficie'  
      - Manipulador: 'manipulador'
      - Ok: 'ok'
    
    Retorna:
    {
        "labels": ["Equipamento", "Superfície", "Manipulador", "Ok"],
        "valores": [73, 39, 16, 3],
        "total_restaurantes": 79
    }
    """
    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb['GERAL']
        
        linha_cab = _localizar_cabecalho(ws)
        mapa = _mapa_colunas(ws, linha_cab)
        COL_PENDENCIA = _coluna(mapa, "Pendencia") or 14

        contagem = Counter()
        total_restaurantes = 0

        for row in ws.iter_rows(min_row=linha_cab + 1, min_col=1, max_col=COL_PENDENCIA + 1):
            sigla = row[0].value  # Col A

            if not sigla or str(sigla).strip().upper() in ('', 'NAN', 'NONE'):
                continue

            pendencia = row[COL_PENDENCIA - 1].value  # 0-indexed
            if not pendencia:
                continue  # visita programada, ainda sem coleta

            total_restaurantes += 1
            
            texto = _normalizar(str(pendencia))
            
            if texto in ('', 'nan', 'none'):
                continue
            
            if texto == 'ok':
                contagem['Ok'] += 1
                continue
            
            # Parse do texto para identificar categorias
            # Substitui separadores por vírgula para facilitar split
            texto_limpo = texto.replace(' e ', ',').replace(', ', ',')
            partes = [p.strip() for p in texto_limpo.split(',') if p.strip()]
            
            for parte in partes:
                if 'equipamento' in parte or 'equipamentos' in parte:
                    contagem['Equipamento'] += 1
                elif 'superficie' in parte or 'superficies' in parte or 'surpeficie' in parte:
                    contagem['Superfície'] += 1
                elif 'manipulador' in parte:
                    contagem['Manipulador'] += 1
                else:
                    print(f"  ⚠️ [APPCC PEND] Parte não classificada: '{parte}' (de '{pendencia}')")
        
        wb.close()
        
        # Ordenar por quantidade (decrescente), Ok no final
        categorias_ordenadas = ['Equipamento', 'Superfície', 'Manipulador', 'Ok']
        labels = [cat for cat in categorias_ordenadas if contagem.get(cat, 0) > 0]
        valores = [contagem[cat] for cat in labels]
        
        # Adicionar categorias extras que apareceram mas não são padrão
        for cat, val in contagem.most_common():
            if cat not in labels:
                labels.append(cat)
                valores.append(val)
        
        print(f"✅ [APPCC PEND] {total_restaurantes} restaurantes processados")
        for l, v in zip(labels, valores):
            print(f"   {l}: {v}")
        
        return {
            "labels": labels,
            "valores": valores,
            "total_restaurantes": total_restaurantes
        }
    
    except Exception as e:
        print(f"❌ [APPCC PEND] Erro: {e}")
        import traceback
        traceback.print_exc()
        return {
            "labels": [],
            "valores": [],
            "total_restaurantes": 0
        }


def processar_regionais_appcc(path_haccp, path_geral):
    """
    Gráfico 3: Quantidade de Restaurantes coletados por Regional.
    
    Cruza a SIGLA do restaurante (col A da planilha HACCP) com a planilha
    de potabilidade (PATH_GERAL) que tem a coluna Regional (col C).
    
    Isso é necessário porque o mapeamento Estado→Regional não é 1:1
    (ex: SP tem restaurantes em SAO1 e SAO2).
    
    Retorna:
    {
        "labels": ["BRA", "RSOU", "SAO 1", "SAO 2"],
        "valores": [18, 21, 20, 20],
        "total_restaurantes": 79
    }
    """
    try:
        import openpyxl
        
        # 1. Construir mapa SIGLA→Regional a partir da planilha de potabilidade
        mapa_sigla_regional = {}
        
        if path_geral:
            try:
                wb_geral = openpyxl.load_workbook(path_geral, read_only=True, data_only=True)
                ws_geral = wb_geral['GERAL']
                
                for row in ws_geral.iter_rows(min_row=3, min_col=1, max_col=3):
                    sigla = row[0].value   # Col A
                    regional = row[2].value  # Col C
                    
                    if sigla and regional:
                        s = str(sigla).strip().upper()
                        r = str(regional).strip().upper()
                        if s not in ('', 'NAN', 'NONE') and r not in ('', 'NAN', 'NONE', '#N/A'):
                            mapa_sigla_regional[s] = r
                
                wb_geral.close()
                print(f"📖 [APPCC REG] Mapa de {len(mapa_sigla_regional)} SIGLAs→Regional carregado da potabilidade")
            except Exception as e:
                print(f"⚠️ [APPCC REG] Erro ao ler planilha de potabilidade: {e}")
        
        # 2. Ler SIGLAs da planilha HACCP e mapear para regional
        wb_haccp = openpyxl.load_workbook(path_haccp, read_only=True, data_only=True)
        ws_haccp = wb_haccp['GERAL']
        
        linha_cab = _localizar_cabecalho(ws_haccp)
        mapa_cols = _mapa_colunas(ws_haccp, linha_cab)
        # A planilha nova ja traz a Regional; so recorre ao cruzamento se nao tiver
        col_regional = _coluna(mapa_cols, "Regional")
        col_estado = _coluna(mapa_cols, "Estado") or 2
        col_pend = _coluna(mapa_cols, "Pendencia")
        max_col = max(x for x in (col_regional, col_estado, col_pend, 2) if x)
        if col_regional:
            print("[APPCC REG] Coluna Regional lida da propria planilha APPCC")

        contagem_regional = Counter()
        contagem_estado = Counter()
        total_restaurantes = 0
        sem_mapa = []

        for row in ws_haccp.iter_rows(min_row=linha_cab + 1, min_col=1, max_col=max_col):
            sigla = row[0].value  # Col A
            estado = row[col_estado - 1].value

            if not sigla or str(sigla).strip().upper() in ('', 'NAN', 'NONE'):
                continue

            # So conta visitas efetivamente realizadas
            if col_pend and not row[col_pend - 1].value:
                continue

            total_restaurantes += 1
            s = str(sigla).strip().upper()

            uf = str(estado).strip().upper() if estado else ''
            if uf and uf not in ('NAN', 'NONE', '#N/A'):
                contagem_estado[uf] += 1

            regional_propria = None
            if col_regional:
                bruto = row[col_regional - 1].value
                if bruto and str(bruto).strip().upper() not in ('', 'NAN', 'NONE', '#N/A'):
                    regional_propria = str(bruto).strip().upper()

            if regional_propria:
                contagem_regional[regional_propria] += 1
            elif s in mapa_sigla_regional:
                contagem_regional[mapa_sigla_regional[s]] += 1
            else:
                sem_mapa.append(s)
                # Fallback: usar estado como label
                e = uf or 'DESCONHECIDO'
                contagem_regional[f"({e})"] += 1
        
        wb_haccp.close()
        
        if sem_mapa:
            print(f"⚠️ [APPCC REG] {len(sem_mapa)} restaurantes sem mapeamento: {sem_mapa[:10]}")
        
        # Ordenar regionais
        ordem_preferencial = ['BRA', 'RSOU', 'SAO1', 'SAO2']
        labels_ordenados = []
        
        # Primeiro as regionais conhecidas
        for reg in ordem_preferencial:
            if reg in contagem_regional:
                labels_ordenados.append(reg)
        
        # Depois qualquer outra
        for reg in sorted(contagem_regional.keys()):
            if reg not in labels_ordenados:
                labels_ordenados.append(reg)
        
        # Formatar labels com espaço (SAO1 → SAO 1)
        labels_formatados = []
        for label in labels_ordenados:
            if label.startswith('SAO') and len(label) == 4 and label[3].isdigit():
                labels_formatados.append(f"SAO {label[3]}")
            else:
                labels_formatados.append(label)
        
        valores = [contagem_regional[reg] for reg in labels_ordenados]
        
        print(f"✅ [APPCC REG] {total_restaurantes} restaurantes processados")
        for l, v in zip(labels_formatados, valores):
            print(f"   {l}: {v}")
        
        # Mesmo recorte, agrupado por UF: o mapeamento Estado->Regional nao e 1:1
        # (SP se divide em SAO1 e SAO2), entao as duas visoes se complementam.
        labels_uf = sorted(contagem_estado.keys(), key=lambda uf: (-contagem_estado[uf], uf))
        valores_uf = [contagem_estado[uf] for uf in labels_uf]
        print(f"✅ [APPCC UF] {len(labels_uf)} estados: " +
              ", ".join(f"{l}={v}" for l, v in zip(labels_uf, valores_uf)))

        return {
            "labels": labels_formatados,
            "valores": valores,
            "total_restaurantes": total_restaurantes,
            "por_estado": {
                "labels": labels_uf,
                "valores": valores_uf,
                "total_restaurantes": total_restaurantes,
            },
        }
    
    except Exception as e:
        print(f"❌ [APPCC REG] Erro: {e}")
        import traceback
        traceback.print_exc()
        return {
            "labels": [],
            "valores": [],
            "total_restaurantes": 0,
            "por_estado": {"labels": [], "valores": [], "total_restaurantes": 0},
        }
