from flask import Blueprint, jsonify
from mcdagua.core.loader import get_dataframe
from mcdagua.auth.basic import require_auth

api_bp = Blueprint("api", __name__)

@api_bp.route("/data")
@require_auth
def api_data():
    df = get_dataframe()
    return jsonify(df.to_dict(orient="records"))
