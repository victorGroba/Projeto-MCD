import os
from dotenv import load_dotenv

def load_config(app):
    load_dotenv()

    # --- CAMINHOS DOS ARQUIVOS (Agora separados) ---
    # O r antes das aspas ajuda o Windows a entender as barras invertidas \
    
    app.config["PATH_GERAL"] = os.getenv("PATH_GERAL", r"F:\Projeto MCD\Planilhamcd.xlsx")
    app.config["PATH_VISA"]  = os.getenv("PATH_VISA",  r"F:\Projeto MCD\Coleta de Alimentos VISA - 2025.xlsx")
    app.config["PATH_HACCP"] = os.getenv("PATH_HACCP", r"F:\Projeto MCD\Planilha Controle - HACCP.xlsx")

    # --- CONFIGURAÇÕES ANTIGAS (Mantidas) ---
    # Mantemos EXCEL_PATH por segurança para códigos antigos, apontando para o Geral
    app.config["EXCEL_PATH"] = app.config["PATH_GERAL"] 

    app.config["APP_USERNAME"] = os.getenv("APP_USERNAME")
    app.config["APP_PASSWORD"] = os.getenv("APP_PASSWORD")
    
    # Tratamento de erro caso o valor não seja um número
    try:
        app.config["REFRESH_INTERVAL"] = int(os.getenv("REFRESH_INTERVAL", 5))
    except ValueError:
        app.config["REFRESH_INTERVAL"] = 5

    app.config["CACHE_TYPE"] = "SimpleCache"
    app.config["CACHE_DEFAULT_TIMEOUT"] = 300
    
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-this") 
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600