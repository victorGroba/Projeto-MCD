from apscheduler.schedulers.background import BackgroundScheduler
from flask_caching import Cache

cache = Cache()
scheduler = BackgroundScheduler()
