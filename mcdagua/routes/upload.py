import os
from flask import Blueprint, request, render_template_string, redirect, url_for, current_app
from werkzeug.utils import secure_filename
from mcdagua.auth.basic import require_auth
from mcdagua.core.loader import refresh_dataframe

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@upload_bp.route("/upload", methods=["GET", "POST"])
@require_auth
def upload_file():
    if request.method == "POST":
        if "file" not in request.files:
            return "Nenhum arquivo enviado.", 400

        file = request.files["file"]

        if file.filename == "":
            return "Nenhum arquivo selecionado.", 400

        if not allowed_file(file.filename):
            return "Formato inválido. Envie um arquivo .xlsx", 400

        # Caminho configurado no .env
        save_path = current_app.config["EXCEL_PATH"]

        # Salvar sobre o arquivo atual
        file.save(save_path)

        # Recarregar planilha imediatamente
        refresh_dataframe()

        return redirect(url_for("ui.dashboard"))

    # Tela HTML simples
    html = """
    <h2 style='font-family:Arial;margin-top:30px;'>Upload da Planilha</h2>
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="file" accept=".xlsx" required>
        <br><br>
        <button style="padding:8px 18px;">Enviar</button>
    </form>
    <br>
    <a href="/">Voltar ao Dashboard</a>
    """

    return render_template_string(html)
