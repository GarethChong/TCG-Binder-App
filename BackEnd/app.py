from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

#Flask knows which module to look for resources such as templates and static files, and it also allows the application to be run directly from this file.
app = Flask(__name__)
#dictionary that holds the configuration settings for the Flask application, specifically the URI for the SQLite database. 
#tells SQLAlchemy where to find the database file (cards.db) that will be used to store and manage the card data.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cards.db'
db = SQLAlchemy(app)

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

@app.route('/')
def home():
    return "Welcome to the TCG Binder App!"

@app.route('/binderlist', methods=['POST'])
def binder_list():
    #request for a name for a new binder
    data = request.get_json()
    name = data.get('name')

    #create a new binder and add it to the database
    new_binder = Binder(name=name)
    db.session.add(new_binder)
    db.session.commit()
    return jsonify({'message': 'Binder created successfully!'})

@app.route('/binderlist', methods=['GET'])
def get_binders():
    #open all binders and return them as a list of dictionaries
    binders = Binder.query.all()
    binder_list = [{'id': binder.id, 'name': binder.name} for binder in binders]
    return jsonify(binder_list)

#application context allows full access to the database and its tables, ensuring that the necessary resources are available when creating the tables.
with app.app_context():
    db.create_all()

#only run the app if this file is executed directly, preventing it from running when imported as a module in other parts of the application.
if __name__ == '__main__':
    app.run(debug=True)
