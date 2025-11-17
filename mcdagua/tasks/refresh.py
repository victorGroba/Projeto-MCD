from mcdagua.core.loader import refresh_dataframe

def scheduled_refresh():
    refresh_dataframe()
    print("Planilha recarregada automaticamente.")
