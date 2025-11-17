from flask import Blueprint, render_template
from mcdagua.auth.basic import require_auth
from mcdagua.core.loader_graficos import load_all_graphics

graficos_bp = Blueprint("graficos", __name__)

@graficos_bp.route("/graficos")
@require_auth
def graficos():
    data = load_all_graphics()
    return render_template("graficos.html", data=data)
