import pandas as pd
from flask import current_app

def load_graphics_sheet():
    path = current_app.config["EXCEL_PATH"]
    return pd.read_excel(path, sheet_name="gráfico-pendência", header=None)


def extract_restaurante_anual(df):
    meses = df.loc[3:14, 7].tolist()
    anos = df.loc[2, 8:10].tolist()
    valores = {
        str(df.loc[2, 8]): df.loc[3:14, 8].tolist(),
        str(df.loc[2, 9]): df.loc[3:14, 9].tolist(),
        str(df.loc[2, 10]): df.loc[3:14, 10].tolist()
    }
    return {"meses": meses, "anos": anos, "valores": valores}


def extract_restaurante_regional(df):
    meses = df.loc[21:32, 6].tolist()
    regionais = df.loc[20, 7:10].tolist()
    valores = {
        regionais[i]: df.loc[21:32, 7 + i].tolist()
        for i in range(4)
    }
    return {"meses": meses, "regionais": regionais, "valores": valores}


def extract_backroom(df):
    categorias = df.loc[38:41, 6].tolist()
    regionais = df.loc[37, 7:11].tolist()
    valores = {
        regionais[i]: df.loc[38:41, 7 + i].tolist()
        for i in range(4)
    }
    return {"categorias": categorias, "regionais": regionais, "valores": valores}


def extract_gelo(df):
    categorias = df.loc[50:53, 6].tolist()
    regionais = df.loc[49, 7:11].tolist()
    valores = {
        regionais[i]: df.loc[50:53, 7 + i].tolist()
        for i in range(4)
    }
    return {"categorias": categorias, "regionais": regionais, "valores": valores}


def extract_pendencias_gelo(df):
    regionais = df.loc[65:68, 7].tolist()
    categorias = df.loc[64, 8:11].tolist()
    valores = {
        categorias[i]: df.loc[65:68, 8 + i].tolist()
        for i in range(3)
    }
    return {"regionais": regionais, "categorias": categorias, "valores": valores}


def load_all_graphics():
    df = load_graphics_sheet()
    return {
        "restaurante_anual": extract_restaurante_anual(df),
        "restaurante_regional": extract_restaurante_regional(df),
        "backroom": extract_backroom(df),
        "gelo": extract_gelo(df),
        "pendencias_gelo": extract_pendencias_gelo(df)
    }
