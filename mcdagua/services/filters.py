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

    # 2. Filtros de Coluna (Agora suporta MÚLTIPLOS valores separados por vírgula)
    for key, value in args.items():
        if key in ignore_keys or not value:
            continue
        
        if key in out.columns:
            # Verifica se é uma lista de valores (ex: "RIO,SAO,BRA")
            if "," in str(value):
                # Cria uma lista ['rio', 'sao', 'bra']
                valores_desejados = [v.strip().lower() for v in str(value).split(",")]
                
                # Filtra onde o valor da coluna ESTÁ NA lista (isin)
                out = out[out[key].astype(str).str.lower().isin(valores_desejados)]
            else:
                # Filtro simples (um único valor)
                out = out[out[key].astype(str).str.lower() == str(value).lower()]

    return out