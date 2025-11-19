from flask_caching import Cache
from flask_apscheduler import APScheduler
from flask_jwt_extended import JWTManager # <--- NOVO

cache = Cache()
scheduler = APScheduler()
jwt = JWTManager() # <--- NOVO