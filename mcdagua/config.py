import os
from dotenv import load_dotenv

def load_config(app):
    load_dotenv()

    app.config["EXCEL_PATH"] = os.getenv("EXCEL_PATH")
    app.config["APP_USERNAME"] = os.getenv("APP_USERNAME")
    app.config["APP_PASSWORD"] = os.getenv("APP_PASSWORD")
    app.config["REFRESH_INTERVAL"] = int(os.getenv("REFRESH_INTERVAL", 5))

    app.config["CACHE_TYPE"] = "SimpleCache"
    app.config["CACHE_DEFAULT_TIMEOUT"] = 300
    
    # --- NOVO: Configuração do JWT ---
    
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-this") 
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # Token expira em 1 hora