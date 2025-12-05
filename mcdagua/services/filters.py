import pandas as pd

def apply_filters(df, args):
    # Cria uma cópia para não alterar o original
    out = df.copy()

    # Parâmetros de controle (não são colunas)
    ignore_keys = ["page", "limit", "per_page", "offset", "_", "q"]

    # 1. Filtro de Busca Geral (Texto livre)
    q = args.get("q", "").lower()
    if q:
        out = out[
            out.astype(str).apply(lambda x: x.str.lower().str.contains(q, regex=False)).any(axis=1)
        ]

    # 2. Filtros de Coluna
    for key, value in args.items():
        if key in ignore_keys or not value:
            continue
        
        if key in out.columns:
            # --- CORREÇÃO DO BUG DA VÍRGULA ---
            # Agora usamos "|" (pipe) como separador oficial de múltiplos valores.
            # Isso permite que itens como "Suco, Gelo" sejam tratados como uma única coisa.
            
            if "|" in str(value):
                # Se tiver pipe, é uma lista: "SP|RJ" -> ['sp', 'rj']
                valores_desejados = [v.strip().lower() for v in str(value).split("|")]
                out = out[out[key].astype(str).str.lower().isin(valores_desejados)]
            
            # Fallback para compatibilidade ou caso único (mesmo que tenha vírgula)
            # Ex: "torre de suco, back room" (sem pipe) cai aqui e funciona corretamente
            else:
                out = out[out[key].astype(str).str.lower() == str(value).lower()]

    return out