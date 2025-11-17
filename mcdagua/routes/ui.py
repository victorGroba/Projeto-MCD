from flask import Blueprint, render_template, request
from mcdagua.core.loader import get_dataframe
from mcdagua.services.filters import apply_filters
from mcdagua.services.kpis import calculate_kpis
from mcdagua.auth.basic import require_auth

ui_bp = Blueprint("ui", __name__)

@ui_bp.route("/")
@require_auth
def dashboard():
    df = get_dataframe()
    filtered = apply_filters(df, request.args)
    kpis = calculate_kpis(filtered)

    return render_template(
        "dashboard.html",
        df=filtered.to_dict(orient="records"),
        columns=filtered.columns,
        kpis=kpis,
        args=request.args
    )
