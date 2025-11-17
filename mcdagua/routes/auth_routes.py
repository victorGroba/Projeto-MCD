from flask import Blueprint, render_template, request, redirect, url_for, session
from mcdagua.config import load_config

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = request.form.get("username")
        pwd = request.form.get("password")

        app = auth_bp.server
        valid_user = app.config["APP_USERNAME"]
        valid_pwd = app.config["APP_PASSWORD"]

        if user == valid_user and pwd == valid_pwd:
            session["logged"] = True
            return redirect("/")

    return render_template("login.html")


@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect("/login")
