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
