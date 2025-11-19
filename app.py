from flask import Flask
from flask_cors import CORS  # <--- 1. FALTAVA ESSA IMPORTAÇÃO
from mcdagua.config import load_config
from mcdagua.extensions import cache, scheduler, jwt
from mcdagua.routes.ui import ui_bp
from mcdagua.routes.api import api_bp
from mcdagua.routes.upload import upload_bp
from mcdagua.routes.graficos import graficos_bp
from mcdagua.routes.auth_routes import auth_bp
from mcdagua.tasks.refresh import scheduled_refresh

def create_app():
    app = Flask(__name__)
    app.secret_key = "super-secure-key"

    load_config(app)
    
    # <--- 2. FALTAVA ATIVAR AQUI
    # Permite que o React (porta 5173) fale com o Flask (porta 8000)
    CORS(app, resources={r"/*": {"origins": "*"}}) 

    cache.init_app(app)
    scheduler.start()
    jwt.init_app(app)

    auth_bp.server = app
    app.register_blueprint(auth_bp)
    app.register_blueprint(ui_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(upload_bp)
    app.register_blueprint(graficos_bp)

    scheduler.add_job(
        func=scheduled_refresh,
        trigger="interval",
        minutes=app.config["REFRESH_INTERVAL"],
        id="refresh_job",
        replace_existing=True
    )

    return app

app = create_app()

if __name__ == "__main__":
    print("Iniciando servidor...")
    app.run(debug=True, host="0.0.0.0", port=8000)