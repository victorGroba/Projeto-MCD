import pandas as pd

def apply_filters(df, args):
    q = args.get("q", "").lower()
    estado = args.get("estado")
    regional = args.get("regional")

    out = df.copy()

    if estado:
        out = out[out["estado"] == estado]

    if regional:
        out = out[out["regional"] == regional]

    if q:
        out = out[
            out.apply(
                lambda row: q in str(row).lower(),
                axis=1
            )
        ]

    return out
