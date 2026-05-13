from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cards.db'
db = SQLAlchemy(app)

@app.route('/')
def home():
    return "Welcome to the TCG Binder App!"


class Binder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))

class Page(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    page_number = db.Column(db.Integer)
    page_size = db.Column(db.Integer)
    binder_id = db.Column(db.Integer, db.ForeignKey('binder.id'))

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_number = db.Column(db.Integer)
    card_set = db.Column(db.String(100))
    name = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'))

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)