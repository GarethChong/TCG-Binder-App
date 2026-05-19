from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from flask_bcrypt import Bcrypt

#Flask knows which module to look for resources such as templates and static files, and it also allows the application to be run directly from this file.
app = Flask(__name__)
#dictionary that holds the configuration settings for the Flask application, specifically the URI for the SQLite database. 
#tells SQLAlchemy where to find the database file (cards.db) that will be used to store and manage the card data.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cards.db'
app.config['SECRET_KEY'] = 'hello i like cards'
db = SQLAlchemy(app)

bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
#redirects unauthenticated user to login when they try to access a @login_required route
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    binders = db.relationship('Binder', backref='user', cascade='all, delete-orphan')
class Binder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    size = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    pages = db.relationship('Page', backref='binder', cascade='all, delete-orphan')

class Page(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    page_number = db.Column(db.Integer)
    binder_id = db.Column(db.Integer, db.ForeignKey('binder.id'))
    cards = db.relationship('Card', backref='page', cascade='all, delete-orphan')

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_number = db.Column(db.Integer)
    card_set = db.Column(db.String(100))
    name = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    slot_col = db.Column(db.Integer, nullable=False)
    slot_row = db.Column(db.Integer, nullable=False)
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'))

#gets the userid and returns a full user object
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

#signals frontend to redirect unauthorized user
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'message': 'Please login to continue'}), 401

@app.route('/')
def home():
    return "Welcome to the TCG Binder App!"

@app.route('/binderlist', methods=['POST'])
@login_required
def binder_list():
    #request for a name for a new binder
    data = request.get_json()
    name = data.get('name')
    size = data.get('size')

    #create a new binder and add it to the database
    if size < 2 or size > 5:
        return jsonify({'message': 'Size is too big!'}), 404
    
    new_binder = Binder(name=name, size=size, user_id = current_user.id)
    db.session.add(new_binder)
    db.session.commit()
    return jsonify({'message': 'Binder created successfully!'})

@app.route('/binderlist', methods=['GET'])
@login_required
def get_binders():
    #open all binders and return them as a list of dictionaries
    binders = Binder.query.filter_by(user_id = current_user.id).all()
    binder_list = [{'id': binder.id, 'name': binder.name} for binder in binders]
    return jsonify(binder_list)

@app.route('/binder/<int:id>', methods = ['GET'])
@login_required
def view_binder(id):
    #find the binder by the id
    binder = Binder.query.filter_by(id=id).first()

    #check if the binder exist and whether user is allowed access
    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404

    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403
    
    return jsonify({'id': binder.id, 'name': binder.name})

@app.route('/binder/<int:id>', methods = ['DELETE'])
@login_required
def delete_binder(id):
    binder = Binder.query.filter_by(id=id).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403
    
    db.session.delete(binder)
    db.session.commit()
    return jsonify({'message': 'Binder successfully deleted'})

@app.route('/binder/<int:id>', methods = ['POST'])
@login_required
def add_page(id):
    binder = Binder.query.filter_by(id=id).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403
    
    #check the length of pages
    pages = Page.query.filter_by(binder_id = binder.id).all()
    if len(pages) >= 30:
        return jsonify({'message': 'Binder full'}), 409
    
    new_page = Page(page_number=len(pages) + 1, binder_id=binder.id)
    db.session.add(new_page)
    db.session.commit()
    return jsonify({'message': 'New page created'})

@app.route('/binder/<int:id>/page/<int:number>', methods = ['GET'])
@login_required
def view_page(id, number):
    binder = Binder.query.filter_by(id=id).first()
    #find the page from binder_id and page number
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    #get necessary card details to be shown to user
    cards = [{'slot_row': card.slot_row, 'slot_col': card.slot_col, 'name': card.name} 
             for card in Card.query.filter_by(page_id=page.id).all()]

    return jsonify({'page_number': page.page_number, 'size': binder.size, 'cards': cards})

@app.route('/binder/<int:id>/page/<int:number>', methods = ['DELETE'])
@login_required
def delete_page(id, number):
    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    db.session.delete(page)
    db.session.commit()
    return jsonify({'message': 'Page successfully deleted'})

@app.route('/binder/<int:id>/page/<int:number>', methods = ['POST'])
@login_required
def add_card(id, number):
    #request for details to find the card to add
    data = request.get_json()
    name = data.get('name')
    card_number = data.get('card_number')
    card_set = data.get('card_set')
    image_url = data.get('image_url')
    slot_row = data.get('slot_row')
    slot_col = data.get('slot_col')

    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    #check if position is within binder dimensions
    if slot_col < 0 or slot_row < 0 or slot_col > binder.size - 1 or slot_row > binder.size - 1:
        return jsonify({'message': 'Invalid card slot'}), 404 
    
    #can only check if card exists after validating page and binder exists so as to not crash the program
    card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col).filter_by(slot_row=slot_row).first()

    #check if slot is taken
    if card:
        return jsonify({'message': 'Slot already occupied by card'}), 404
    
    new_card = Card(card_number=card_number, card_set=card_set, name=name,image_url=image_url, 
                    slot_col=slot_col, slot_row=slot_row, page_id=page.id)
    db.session.add(new_card)
    db.session.commit()
    return jsonify({'message': 'New card added'})

@app.route('/binder/<int:id>/page/<int:number>/card/<card_id>', methods = ['DELETE'])
@login_required
def delete_card(id, number, card_id):
    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    card = Card.query.filter_by(page_id=page.id).filter_by(id=card_id).first()

    if not card:
        return jsonify({'message': 'Card does not exist'}), 404 

    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card successfully deleted'})

@app.route('/register', methods=['POST'])
def register():
    #request for a username and password to create a new user account
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    #checks if the username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists!'}), 400

    #creates a new user and adds them to the database
    new_user = User(username=username, password=bcrypt.generate_password_hash(password).decode('utf-8'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'})

@app.route('/binder/<int:id>/page/<int:number>', methods = ['PUT'])
@login_required
def shift_card(id, number):
    #request for details to find the card positions to swap
    data = request.get_json()
    from_col = data.get('from_col')
    from_row = data.get('from_row')
    to_col = data.get('to_col')
    to_row = data.get('to_row')

    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    #check if position is within binder dimensions
    if from_col < 0 or from_row < 0 or from_col > binder.size - 1 or from_row > binder.size - 1:
        return jsonify({'message': 'Invalid starting card slot'}), 404 
    
    if to_col < 0 or to_row < 0 or to_col > binder.size - 1 or to_row > binder.size - 1:
        return jsonify({'message': 'Invalid ending card slot'}), 404 
    
    #obtain from and to cards
    from_card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=from_col).filter_by(slot_row=from_row).first()
    to_card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=to_col).filter_by(slot_row=to_row).first()

    #if both slots are empty return error
    if not from_card and not to_card:
        return jsonify({'message': 'Both slots are empty'}), 404
    
    #if either is empty update the non-empty card slot with the new row and columns
    if from_card and not to_card:
        from_card.slot_col = to_col
        from_card.slot_row = to_row
        db.session.commit()
        return jsonify({'message': 'Card shifted successfully'})
    
    if not from_card and to_card:
        to_card.slot_col = from_col
        to_card.slot_row = from_row
        db.session.commit()
        return jsonify({'message': 'Card shifted successfully'})

    #else update both cards with the new rows and columns
    if from_card and to_card:
        from_card.slot_col = to_col
        from_card.slot_row = to_row
        to_card.slot_col = from_col
        to_card.slot_row = from_row
        db.session.commit()
        return jsonify({'message': 'Cards shifted successfully'})


#POST used for security reasons to prevent sensitive information from being exposed in the URL
@app.route('/login', methods=[ 'POST'])
def login():
    #request for a username and password to create a new user account
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    #checks if the username exists
    if not user:
        return jsonify({'message': 'User does not exist, please create a new account'}), 400

    #checks if the password is correct
    if bcrypt.check_password_hash(user.password, password):
        login_user(user)
        return jsonify({'message': 'User logged in successfully!'})
    else:
        return jsonify({'message': 'Incorrect password!'}), 400

#application context allows full access to the database and its tables, ensuring that the necessary resources are available when creating the tables.
with app.app_context():
    db.create_all()

#only run the app if this file is executed directly, preventing it from running when imported as a module in other parts of the application.
if __name__ == '__main__':
    app.run(debug=True)
