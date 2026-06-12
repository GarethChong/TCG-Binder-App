import os
import requests
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, bcrypt, User, Binder, Page, Card, DecorativeImage
from groq import Groq

POKEMON_API_KEY = os.getenv('POKEMON_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

routes = Blueprint('routes', __name__)

@routes.route('/')
def home():
    return "Welcome to the TCG Binder App!"

@routes.route('/register', methods=['POST'])
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

#POST used for security reasons to prevent sensitive information from being exposed in the URL
@routes.route('/login', methods=[ 'POST'])
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

@routes.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'User logged out successfully'})

#authentication route to ensure user is authenticated
@routes.route('/auth/check', methods=['GET'])
def authenticate():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True})
    else:
        return jsonify({'authenticated': False})


@routes.route('/cards/search', methods=['GET'])
@login_required
def card_search():
    name = request.args.get('name')
    
    #look for card based on name
    headers = {'X-Api-Key': POKEMON_API_KEY}
    response = requests.get(
        'https://api.pokemontcg.io/v2/cards',
        params={'q': f'name:{name}'},
        headers=headers
    )
    
    data = response.json()
    print(f"Searching for: {name}")
    print(f"Response: {data}")

    #if pokemon does not exist
    if not data['data']:
        return jsonify({'message': 'Pokemon does not exist'}), 404  
    
    cards = [
        {
            'name': card['name'],
            'set': card['set']['name'],
            'number': card['number'],
            'image': card['images']['small']
        }
        for card in data['data']
    ]

    return jsonify(cards)


@routes.route('/binderlist', methods=['POST'])
@login_required
def create_binder():
    #request for a name for a new binder
    data = request.get_json()
    name = data.get('name')
    size = data.get('size')
    colour = data.get('colour')

    #create a new binder and add it to the database
    if size < 2:
        return jsonify({'message': 'Size is too small!'}), 404
    
    if size > 4:
        return jsonify({'message': 'Size is too big!'}), 404
    
    new_binder = Binder(name=name, size=size, colour=colour, user_id = current_user.id)
    db.session.add(new_binder)
    db.session.commit()
    return jsonify({'id': new_binder.id, 'name': new_binder.name, 'colour': new_binder.colour})

@routes.route('/binderlist', methods=['GET'])
@login_required
def get_binders():
    #open all binders and return them as a list of dictionaries
    binders = Binder.query.filter_by(user_id = current_user.id).all()
    binder_list = [{'id': binder.id, 'name': binder.name, 'colour': binder.colour} for binder in binders]
    return jsonify(binder_list)

@routes.route('/binder/<int:id>', methods = ['GET'])
@login_required
def view_binder(id):
    #find the binder by the id
    binder = Binder.query.filter_by(id=id).first()

    #check if the binder exist and whether user is allowed access
    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404

    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403
    
    pages = Page.query.filter_by(binder_id = binder.id).all()
    page_list = [{'id': page.id, 'page_number': page.page_number, 
                  'cards': [{'slot_row': card.slot_row, 'slot_col': card.slot_col, 'name': card.name, 'id': card.id, 'image_url': card.image_url} 
                for card in Card.query.filter_by(page_id=page.id).all()],
                  'images': [{'slot_row': image.slot_row, 'slot_col': image.slot_col, 'id': image.id, 'image_url': image.image_url, 'is_primary': image.is_primary} 
                for image in DecorativeImage.query.filter_by(page_id=page.id).all()]} for page in pages]

    return jsonify({'id': binder.id, 'name': binder.name, 'size': binder.size, 'pages': page_list})

@routes.route('/binder/<int:id>', methods = ['DELETE'])
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

@routes.route('/binder/<int:id>', methods = ['POST'])
@login_required
def add_sheet(id):
    binder = Binder.query.filter_by(id=id).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403
    
    #check the length of pages
    pages = Page.query.filter_by(binder_id = binder.id).all()
    if len(pages) >= 30:
        return jsonify({'message': 'Binder full'}), 409
    
    first_new_page = Page(page_number=len(pages) + 1, sheet=len(pages)/2 + 1, binder_id=binder.id)
    second_new_page = Page(page_number=len(pages) + 2, sheet=len(pages)/2 + 1, binder_id=binder.id)
    db.session.add(first_new_page)
    db.session.add(second_new_page)
    db.session.commit()

    new_sheet = Page.query.filter_by(sheet=len(pages)/2+1).all()
    new_pages = [{'id': page.id, 'page_number': page.page_number, 'sheet': page.sheet} for page in new_sheet]
    return jsonify(new_pages)

@routes.route('/binder/<int:id>/page/<int:number>', methods = ['DELETE'])
@login_required
def delete_sheet(id, number):
    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    other_page = Page.query.filter_by(binder_id=id).filter_by(sheet=page.sheet).filter(Page.page_number != number).first()
    
    sheet_number = page.sheet

    db.session.delete(page)
    db.session.delete(other_page)
    db.session.commit()

    #filter_by only filters equal; lower all remaining pages by 1 
    larger_pages = Page.query.filter_by(binder_id=id).filter(Page.page_number > number).all()
    for page in larger_pages:
        page.page_number -= 2
    larger_sheets = Page.query.filter_by(binder_id=id).filter(Page.sheet > sheet_number).all()
    for sheet in larger_sheets:
        sheet.sheet -= 1
    db.session.commit()

    return jsonify({'message': 'Sheet successfully deleted'})


@routes.route('/binder/<int:id>/page/<int:number>', methods = ['GET'])
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
    
    #get necessary card and image details to be shown to user
    cards = [{'slot_row': card.slot_row, 'slot_col': card.slot_col, 'name': card.name, 'id': card.id, 'image_url': card.image_url} 
             for card in Card.query.filter_by(page_id=page.id).all()]
    images = [{'slot_row': image.slot_row, 'slot_col': image.slot_col, 'id': image.id, 'image_url': image.image_url, 'is_primary': image.is_primary} 
             for image in DecorativeImage.query.filter_by(page_id=page.id).all()]

    return jsonify({'binder_name': binder.name, 'page_number': page.page_number, 'size': binder.size, 'cards': cards, 'images': images})

@routes.route('/binder/<int:id>/page/<int:number>/clear', methods = ['PUT'])
@login_required
def clear_page(id, number):
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
    cards = Card.query.filter_by(page_id=page.id).all()
    images = DecorativeImage.query.filter_by(page_id=page.id).all()

    for card in cards:
        db.session.delete(card)
    for image in images:
        db.session.delete(image)
    db.session.commit()

    return jsonify({'message': 'Page has been successfully cleared'})

@routes.route('/binder/<int:id>/page/<int:number>', methods = ['POST'])
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
    image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col).filter_by(slot_row=slot_row).first()

    #check if slot is taken
    if card or image:
        return jsonify({'message': 'Slot already occupied'}), 404
    
    new_card = Card(card_number=card_number, card_set=card_set, name=name,image_url=image_url, 
                    slot_col=slot_col, slot_row=slot_row, page_id=page.id)
    db.session.add(new_card)
    db.session.commit()
    return jsonify({'id': new_card.id, 'name': new_card.name, 'slot_row': new_card.slot_row, 'slot_col': new_card.slot_col, 'image_url': new_card.image_url})

@routes.route('/binder/<int:id>/page/<int:number>/card/<card_id>', methods = ['DELETE'])
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

@routes.route('/binder/<int:id>/page/<int:number>/image', methods=['POST'])
@login_required
def add_image(id, number):
    #request for details to find the image to add
    #no search engine for this, users should be tech savvy and creative enough to source for their own images
    data = request.get_json()
    image_url = data.get('image_url')
    slot_row = data.get('slot_row')
    slot_col = data.get('slot_col')
    width = data.get('width')

    if width < 1:
        return jsonify({'message': 'Width cannot be less than 1'}), 404

    if width > 2:
        return jsonify({'message': 'Width is too long (Max: 2)'}), 404

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
    
    card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col).filter_by(slot_row=slot_row).first()
    image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col).filter_by(slot_row=slot_row).first()

    #check if slot is taken
    if card or image:
        return jsonify({'message': 'Slot already occupied'}), 404
    
    if width == 2:
        if slot_col + 1 > binder.size - 1:
            return jsonify({'message': 'Not enough space for wide image'}), 404
    
        second_card  = Card.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col+1).filter_by(slot_row=slot_row).first()
        second_image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=slot_col+1).filter_by(slot_row=slot_row).first()

        if second_card or second_image:
            return jsonify({'message': 'Slot already occupied'}), 404
    
    new_image = DecorativeImage(image_url=image_url, slot_col=slot_col, slot_row=slot_row, width = width, page_id=page.id)
    db.session.add(new_image)

    if width == 2:
        new_image_second = DecorativeImage(image_url=image_url, slot_col=slot_col+1, slot_row=slot_row, width = width, is_primary = False,
                                            page_id=page.id)
        db.session.add(new_image_second)

    db.session.commit()
    return jsonify({'id': new_image.id, 'slot_row': new_image.slot_row, 'slot_col': new_image.slot_col, 'image_url': new_image.image_url, 
                    'width': new_image.width})

@routes.route('/binder/<int:id>/page/<int:number>/image/<image_id>', methods = ['DELETE'])
@login_required
def delete_image(id, number, image_id):
    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(id=image_id).first()

    if not image:
        return jsonify({'message': 'Image does not exist'}), 404 
    
    if image.width == 2: #need account for if user were to click the non-primary image
        if image.is_primary:
            secondary = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_row=image.slot_row).filter_by(slot_col=image.slot_col+1).first()
            if secondary:
                db.session.delete(secondary)
        else:
            primary = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_row=image.slot_row).filter_by(slot_col=image.slot_col-1).first()
            if primary:
                db.session.delete(primary)

    db.session.delete(image)
    db.session.commit()
    return jsonify({'message': 'Image successfully deleted'})

@routes.route('/binder/<int:id>/page/<int:number>', methods = ['PUT'])
@login_required
def shift(id, number):
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
    
    from_slot = None
    to_slot = None

    #obtain from and to cards
    from_card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=from_col).filter_by(slot_row=from_row).first()
    from_image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=from_col).filter_by(slot_row=from_row).first()
    to_card = Card.query.filter_by(page_id=page.id).filter_by(slot_col=to_col).filter_by(slot_row=to_row).first()
    to_image = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=to_col).filter_by(slot_row=to_row).first()

     #if both slots are empty return error
    if not from_card and not from_image and not to_card and not to_image:
        return jsonify({'message': 'Both slots are empty'}), 404

    if from_card or from_image:
        if from_card:
            from_slot = from_card
        else:
            from_slot = from_image

    if to_card or to_image:
        if to_card:
            to_slot = to_card
        else:
            to_slot = to_image
    
    if isinstance(from_slot, DecorativeImage) and from_slot.width == 2 and not from_slot.is_primary:
            from_slot = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=from_col-1).filter_by(slot_row=from_row).first()

    if isinstance(to_slot, DecorativeImage) and to_slot.width == 2 and not to_slot.is_primary:
            to_slot = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=to_col-1).filter_by(slot_row=to_row).first()

    if from_slot and to_slot: #if both are occupied
        if isinstance(from_slot, DecorativeImage) and from_slot.width == 2 and (not isinstance(to_slot, DecorativeImage) or to_slot.width != 2):
            return jsonify({'message': 'Cant swap lateral image with a single slot card / image'}), 404

        if isinstance(to_slot, DecorativeImage) and to_slot.width == 2 and (not isinstance(from_slot, DecorativeImage) or from_slot.width != 2):
            return jsonify({'message': 'Cant swap lateral image with a single slot card / image'}), 404
            
        elif from_slot.width and from_slot.width == 2 and to_slot.width and to_slot.width == 2: #2 width 2 swaps
            from_slot_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=from_col+1).filter_by(slot_row=from_row).first()
            to_slot_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=to_col+1).filter_by(slot_row=to_row).first()
            temp_col = from_slot.slot_col
            temp_row = from_slot.slot_row

            from_slot.slot_col = to_slot.slot_col
            from_slot.slot_row = to_slot.slot_row
            from_slot_second.slot_col = to_slot_second.slot_col 
            from_slot_second.slot_row = to_slot_second.slot_row 

            to_slot.slot_col = temp_col
            to_slot.slot_row = temp_row
            to_slot_second.slot_col = temp_col + 1
            to_slot_second.slot_row = temp_row

            db.session.commit()
            return jsonify({'message': 'Shifted successfully'})
        
        else: #2 width 1 swaps
            temp_col = from_slot.slot_col
            temp_row = from_slot.slot_row

            from_slot.slot_col = to_slot.slot_col
            from_slot.slot_row = to_slot.slot_row

            to_slot.slot_col = temp_col
            to_slot.slot_row = temp_row

            db.session.commit()
            return jsonify({'message': 'Shifted successfully'})

    else: #if either is occupied
        if (isinstance(from_slot, DecorativeImage) and from_slot.width == 2) or (isinstance(to_slot, DecorativeImage) and to_slot.width == 2):
            if (from_slot and from_slot.slot_col + 1 > binder.size - 1) or (to_slot and to_slot.slot_col + 1 > binder.size - 1):
                return jsonify({'message': 'Binder slot out of position'}), 404
            
            if from_slot and not to_slot:
                to_card_second = Card.query.filter_by(page_id=page.id).filter_by(slot_col=to_col+1).filter_by(slot_row=to_row).first()
                to_image_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=to_col+1).filter_by(slot_row=to_row).first()
                if to_card_second or to_image_second:
                    return jsonify({'message': 'Image cannot be shifted (obstructed path)'}), 404

            if not from_slot and to_slot:
                from_card_second = Card.query.filter_by(page_id=page.id).filter_by(slot_col=from_col+1).filter_by(slot_row=from_row).first()
                from_image_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=from_col+1).filter_by(slot_row=from_row).first()
                if from_card_second or from_image_second:
                    return jsonify({'message': 'Image cannot be shifted (obstructed path)'}), 404

            if from_slot and not to_slot:
                from_slot_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=from_col+1).filter_by(slot_row=from_row).first()

                from_slot.slot_col = to_col
                from_slot.slot_row = to_row
                from_slot_second.slot_col = from_slot.slot_col + 1
                from_slot_second.slot_row = from_slot.slot_row
                db.session.commit()
                return jsonify({'message': 'Shifted successfully'})
            
            if not from_slot and to_slot:
                to_slot_second = DecorativeImage.query.filter_by(page_id=page.id).filter_by(slot_col=to_col+1).filter_by(slot_row=to_row).first()

                to_slot.slot_col = from_col
                to_slot.slot_row = from_row
                to_slot_second.slot_col = to_slot.slot_col + 1
                to_slot_second.slot_row = to_slot.slot_row
                db.session.commit()
                return jsonify({'message': 'Shifted successfully'})
        else:
            if from_slot and not to_slot:
                from_slot.slot_col = to_col
                from_slot.slot_row = to_row
                db.session.commit()
                return jsonify({'message': 'Shifted successfully'})
            
            if not from_slot and to_slot:
                to_slot.slot_col = from_col
                to_slot.slot_row = from_row
                db.session.commit()
                return jsonify({'message': 'Shifted successfully'})

@routes.route('/binder/<int:id>/page/<int:number>/card/<card_id>/price', methods = ['GET'])
@login_required
def check_price(id, number, card_id):
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

    #look for card based on name, card set and card number
    headers = {'X-Api-Key': POKEMON_API_KEY}
    response = requests.get(
        'https://api.pokemontcg.io/v2/cards',
        params={'q': f'name:{card.name} number:{card.card_number}'},
        headers=headers
    )

    data = response.json()

    #if card data cannot be extracted
    if not data['data']:
        return jsonify({'message': 'Card does not exist'}), 404  

    #check if price does not exist, before accessing and returning the card price value
    if 'tcgplayer' not in data['data'][0]:
        return jsonify({'message': 'No pricing available for this card'}), 404
    
    price = data['data'][0]['tcgplayer']['prices']
    return jsonify(price)

@routes.route('/binder/<int:id>/page/<int:number>/suggestions', methods = ['POST'])
@login_required
def ai_suggestion(id, number):
    data = request.get_json()
    user_prompt = data.get('user_prompt')
    style = data.get('style') #michi method or traditional method

    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    cards = Card.query.filter_by(page_id=page.id).all()
    images = DecorativeImage.query.filter_by(page_id=page.id).all()

    if style == "michi":
        #prompt for the ai
        prompt = f"""You are "Master Binder," an elite, professional Pokémon TCG curator and master collector. You have designed thousands of high-end 
        binder layouts, specialising in cutting-edge display art styles like the Michi Method. Your job is to help users curate visually stunning, 
        narratively rich, and structurally satisfying binder layouts. You don't just list cards; you design a gallery.

        You must adapt fluidly to different page dimensions, which can range from 2x2, 3x3, 4x3, 4x4, up to 5x5 grids. Always verify the grid dimensions
        [Rows x Columns] provided in the session context.

        =========================================
        SESSION CONTEXT:
        - Grid Size: {binder.size}
        - Current Cards on Page: {[{'name': card.name, 'set': card.card_set, 'number': card.card_number, 'row': card.slot_row, 'col': card.slot_col}
                                    for card in cards]}
        - Current Images on Page: {[{'row': image.slot_row, 'col': image.slot_col, 'width': image.width} for image in images if image.is_primary]}
        - Display Style Preference: [Michi Method Art-Inserts]
        =========================================

        YOUR MISSION:
        Analyze the "Current Cards on Page" to deduce their shared aesthetic, color palette, artist, or generation. Then, read the "User Prompt" below.
        Your goal is to fulfill the user's specific request, using your elite curation knowledge to fill empty slots, rearrange existing cards for 
        better symmetry, or introduce completely unexpected, high-concept layouts that match their requested vibe and selected Display Style.

        CORE CURATION STYLES:

        Michi Method Style (Art-Inserts & Multi-Pocket Landscapes):
        - Treat the grid like a custom canvas. Do not fill every pocket with cards. 
        - Strategically substitute card pockets with "Custom Art Inserts" or "Negative Space Fillers" to frame the active cards beautifully.
        - Master the multi-pocket crop: Suggest large, cohesive background illustrations or extended landscapes that span across multiple adjacent slots
        (e.g., an illustration that stretches across Row 1 Col 1 and Row 1 Col 2 as a seamless 1x2 banner) to bridge the physical gaps between card 
        slots.
        - Design custom aesthetic backdrops (like botanical motifs, type-matching textures, character field guides, or minimalist block gradients) that 
        accentuate the artwork of the active cards.

        OUTPUT FORMATTING RULES:
        You must provide your final layout configuration using a strict coordinate mapping. Every single entry in the layout must include specific 
        metadata so the application can render the visual layout automatically:

        For Card Entries, you MUST provide:
        - The exact [Row, Column] coordinates.
        - [Card Type]: Mark as "User Existing Card" or "AI Recommendation".
        - [Card Details]: Exact Pokémon Name and exact Expansion/Set Name.
        - [Visual Search Asset]: A descriptive visual search string for the app to fetch the card image.

        For Michi Method Art Inserts, you MUST provide:
        - The exact coordinate span (e.g., [Row 1, Col 1 to Row 1, Col 2] for a 1x2 banner).
        - [Card Type]: Mark as "Michi Method Art Insert".
        - [Asset Description]: A detailed visual/thematic description of what the art filler looks like.
        - [Image Prompt]: A highly detailed text-to-image prompt to allow the app to generate or fetch a fitting graphic background for this pocket 
        span.

        Tone Guidelines:
        - Passionate, insightful, and articulate. Use collector terminology naturally (e.g., "Alt Art," "Visual Weight," "Negative Space," "Multi-Slot 
        Crop," "Michi Insert").
        - Be encouraging but honest—if the user's prompt request will clash visually with their current cards, gently explain why and offer a cleaner 
        alternative.

        =========================================
        USER PROMPT:
        {user_prompt}
        ========================================="""
    else:
        prompt = f"""You are "Master Binder," an elite, professional Pokémon TCG curator and master collector. You have designed thousands of high-end 
        binder layouts, specialising in traditional set organization. Your job is to help users curate visually stunning, narratively rich, and 
        structurally satisfying binder layouts. You don't just list cards; you design a gallery.

        You must adapt fluidly to different page dimensions, which can range from 2x2, 3x3, 4x3, 4x4, up to 5x5 grids. Always verify the grid dimensions
        [Rows x Columns] provided in the session context.

        =========================================
        SESSION CONTEXT:
        - Grid Size: {binder.size}
        - Current Cards on Page: {[{'name': card.name, 'set': card.card_set, 'number': card.card_number, 'row': card.slot_row, 'col': card.slot_col}
                                    for card in cards]}
        - Current Images on Page: {[{'row': image.slot_row, 'col': image.slot_col, 'width': image.width} for image in images if image.is_primary]}
        - Display Style Preference: [Traditional Card-Only]
        =========================================

        YOUR MISSION:
        Analyze the "Current Cards on Page" to deduce their shared aesthetic, color palette, artist, or generation. Then, read the "User Prompt" below.
        Your goal is to fulfill the user's specific request, using your elite curation knowledge to fill empty slots, rearrange existing cards for 
        better symmetry, or introduce completely unexpected, high-concept layouts that match their requested vibe and selected Display Style.

        CORE CURATION STYLES:

        Traditional Style (Card-Only):
        - Every pocket is meant to hold an individual Pokémon card. 
        - Focus on visual weight, color gradients, and structural symmetry across the coordinates. Use clear focal points (like the center of odd grids,
        or the core quad of even grids).

        OUTPUT FORMATTING RULES:
        You must provide your final layout configuration using a strict coordinate mapping. Every single entry in the layout must include specific 
        metadata so the application can render the visual layout automatically:

        For Card Entries, you MUST provide:
        - The exact [Row, Column] coordinates.
        - [Card Type]: Mark as "User Existing Card" or "AI Recommendation".
        - [Card Details]: Exact Pokémon Name and exact Expansion/Set Name.
        - [Visual Search Asset]: A descriptive visual search string for the app to fetch the card image.

        Tone Guidelines:
        - Passionate, insightful, and articulate. Use collector terminology naturally (e.g., "Alt Art," "Visual Weight," "Negative Space," "Multi-Slot 
        Crop,").
        - Be encouraging but honest—if the user's prompt request will clash visually with their current cards, gently explain why and offer a cleaner 
        alternative.

    =========================================
    USER PROMPT:
    {user_prompt}
    ========================================="""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(model='llama-3.3-70b-versatile', messages=[{'role': 'user', 'content': prompt}])
    return jsonify({'suggestions': response.choices[0].message.content})