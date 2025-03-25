from flask import Flask
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.db import db
from backend.routes.auth import auth_bp
import os
import logging

from backend.routes.report import reports_bp

app = Flask(__name__)
logging.basicConfig(filename='debug.log', level=logging.DEBUG)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'database', 'uwrs.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "uwrsdev")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "uwrsdev")

migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
CORS(app)
jwt = JWTManager(app)

db.init_app(app)
app.register_blueprint(reports_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/auth')


if __name__ == '__main__':
    app.run(debug=True)


