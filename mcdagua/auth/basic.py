from functools import wraps
from flask import session, redirect

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not session.get("logged"):
            return redirect("/login")
        return func(*args, **kwargs)
    return wrapper
