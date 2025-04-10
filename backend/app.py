from flask import Flask
from flask_mail import Mail
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from backend.db import db
from backend.routes.auth import auth_bp
from dotenv import load_dotenv
import os
import logging

from backend.routes.volunteer import volunteer_bp
from backend.routes.report import reports_bp


app = Flask(__name__)
logging.basicConfig(filename='debug.log', level=logging.DEBUG)

load_dotenv()

app.config.update(
    MAIL_SERVER='smtp.sendgrid.net',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='apikey',
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER='info.uwrs@gmail.com'
)
mail = Mail(app)

app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'database', 'uwrs.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "uwrsdev")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "uwrsdev")


migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
CORS(app,
     resources={
         r"/auth/*": {
             "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type"]
         }
     },
     supports_credentials=True)
jwt = JWTManager(app)

db.init_app(app)
app.register_blueprint(reports_bp, url_prefix='/api')
app.register_blueprint(volunteer_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/auth')


if __name__ == '__main__':
    app.run(debug=True)


