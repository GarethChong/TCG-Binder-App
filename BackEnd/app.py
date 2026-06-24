import os
from flask import Flask, jsonify
from flask_login import LoginManager
from models import db, bcrypt, User
from routes import routes as routes_blueprint
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

#Flask knows which module to look for resources such as templates and static files, and it also allows the application to be run directly from this file.
app = Flask(__name__)
#dictionary that holds the configuration settings for the Flask application, specifically the URI for the SQLite database. 
#tells SQLAlchemy where to find the database file (cards.db) that will be used to store and manage the card data.
#included SQLite in case PostgreSQL fails
database_url = os.getenv('DATABASE_URL', 'sqlite:///cards.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url  
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

#allows cookies to be sent cross-origin over HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

#debug
print(f"Database URL being used: {database_url[:30]}...")

#Cross-Origin Resource Sharing; allows front end access to back end data
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "https://tcg-binder-app.vercel.app",
    "https://tcg-binder-app-git-main-garethchong12.vercel.app"
])

#initialise the app
db.init_app(app)
bcrypt.init_app(app)

#connects the routes to the app
app.register_blueprint(routes_blueprint)

login_manager = LoginManager(app)
#redirects unauthenticated user to login when they try to access a @login_required route
login_manager.login_view = 'login'

#gets the userid and returns a full user object
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

#signals frontend to redirect unauthorized user
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'message': 'Please login to continue'}), 401

#application context allows full access to the database and its tables, ensuring that the necessary resources are available when creating the tables.
with app.app_context():
    db.create_all()

#only run the app if this file is executed directly, preventing it from running when imported as a module in other parts of the application.
if __name__ == '__main__':
    app.run(debug=True)