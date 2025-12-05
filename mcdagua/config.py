import os
from dotenv import load_dotenv

def load_config(app):
    load_dotenv()

    # 1. Define a pasta raiz do projeto automaticamente
    # (Sobe dois níveis a partir de mcdagua/config.py)
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    # 2. Define uma pasta para armazenar as planilhas (cria se não existir)
    FILES_DIR = os.path.join(BASE_DIR, "arquivos_sistema")
    os.makedirs(FILES_DIR, exist_ok=True)

    # 3. Configura os caminhos dinamicamente
    # Se não houver variável no .env, usa esses caminhos padrão dentro da pasta do projeto
    app.config["PATH_GERAL"] = os.getenv("PATH_GERAL", os.path.join(FILES_DIR, "Planilha_Potabilidade.xlsx"))
    app.config["PATH_VISA"]  = os.getenv("PATH_VISA",  os.path.join(FILES_DIR, "Planilha_VISA.xlsx"))
    app.config["PATH_HACCP"] = os.getenv("PATH_HACCP", os.path.join(FILES_DIR, "Planilha_HACCP.xlsx"))

    # Mantemos EXCEL_PATH por compatibilidade com códigos antigos
    app.config["EXCEL_PATH"] = app.config["PATH_GERAL"]

    # Configurações de Segurança e Cache
    app.config["APP_USERNAME"] = os.getenv("APP_USERNAME")
    app.config["APP_PASSWORD"] = os.getenv("APP_PASSWORD")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "chave-secreta-padrao-mude-em-producao") 
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600
    app.config["CACHE_TYPE"] = "SimpleCache"
    app.config["CACHE_DEFAULT_TIMEOUT"] = 300
    
    try:
        app.config["REFRESH_INTERVAL"] = int(os.getenv("REFRESH_INTERVAL", 5))
    except ValueError:
        app.config["REFRESH_INTERVAL"] = 5

    print(f"✅ [CONFIG] Diretório de Arquivos: {FILES_DIR}")