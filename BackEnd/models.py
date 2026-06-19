from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    binders = db.relationship('Binder', backref='user', cascade='all, delete-orphan')
class Binder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    size = db.Column(db.Integer)
    colour = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    pages = db.relationship('Page', backref='binder', cascade='all, delete-orphan')

class Page(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    page_number = db.Column(db.Integer)
    sheet = db.Column(db.Integer, nullable =False)
    binder_id = db.Column(db.Integer, db.ForeignKey('binder.id'))
    cards = db.relationship('Card', backref='page', cascade='all, delete-orphan')
    images = db.relationship('DecorativeImage', backref='page', cascade='all, delete-orphan')

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.String(100), nullable=False)
    card_number = db.Column(db.Integer)
    card_set = db.Column(db.String(100))
    name = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    slot_col = db.Column(db.Integer, nullable=False)
    slot_row = db.Column(db.Integer, nullable=False)
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'))

#needed to allow for michi method of binder expression
class DecorativeImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(500))
    slot_col = db.Column(db.Integer, nullable=False)
    slot_row = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Integer, default=1)
    is_primary = db.Column(db.Boolean, default=True) #this is for lateral spanning images
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'))