import os
import requests
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, bcrypt, User, Binder, Page, Card
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
    return jsonify({'id': new_binder.id, 'name': new_binder.name})

@routes.route('/binderlist', methods=['GET'])
@login_required
def get_binders():
    #open all binders and return them as a list of dictionaries
    binders = Binder.query.filter_by(user_id = current_user.id).all()
    binder_list = [{'id': binder.id, 'name': binder.name} for binder in binders]
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
    page_list = [{'id': page.id, 'page_number': page.page_number} for page in pages]

    return jsonify({'id': binder.id, 'name': binder.name, 'pages': page_list})

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
    return jsonify({'id': new_page.id, 'page_number': new_page.page_number})

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
    
    #get necessary card details to be shown to user
    cards = [{'slot_row': card.slot_row, 'slot_col': card.slot_col, 'name': card.name} 
             for card in Card.query.filter_by(page_id=page.id).all()]

    return jsonify({'page_number': page.page_number, 'size': binder.size, 'cards': cards})

@routes.route('/binder/<int:id>/page/<int:number>', methods = ['DELETE'])
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

    #check if slot is taken
    if card:
        return jsonify({'message': 'Slot already occupied by card'}), 404
    
    new_card = Card(card_number=card_number, card_set=card_set, name=name,image_url=image_url, 
                    slot_col=slot_col, slot_row=slot_row, page_id=page.id)
    db.session.add(new_card)
    db.session.commit()
    return jsonify({'message': 'New card added'})

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

@routes.route('/binder/<int:id>/page/<int:number>', methods = ['PUT'])
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

@routes.route('/binder/<int:id>/page/<int:number>/suggestions', methods = ['GET'])
@login_required
def ai_suggestion(id, number):
    binder = Binder.query.filter_by(id=id).first()
    page = Page.query.filter_by(binder_id=id).filter_by(page_number=number).first()

    if not binder:
        return jsonify({'message': 'Binder does not exist'}), 404
    
    if binder.user_id != current_user.id:
        return jsonify({'message': 'You have no access to this binder'}), 403

    if not page:
        return jsonify({'message': 'Page does not exist'}), 404 
    
    cards = Card.query.filter_by(page_id=page.id).all()

    #prompt for the ai
    prompt = f"""You are "Master Binder," an elite, professional Pokémon TCG curator and master collector. You have designed thousands of 
    high-end binder layouts and analyzed countless spreads. Your job is to help users curate visually stunning, narratively rich, and 
    structurally satisfying binder pages. You don't just list cards; you design a gallery.

    You must adapt fluidly to different page dimensions, which can range from 2x2, 3x3, 4x3, 4x4, up to 5x5 grids. Always verify the grid 
    dimensions {binder.size}x{binder.size} provided by the system.

    CURRENT STATE OF THE PAGE:
    The user has already placed or selected the following cards for this specific page:
    {[card.name for card in cards]}

    Your primary task is to look at these current cards, identify their shared aesthetic, color palette, artist, generation, or narrative theme,
    and build the rest of the layout around them. If the current cards look visually unbalanced for the grid size, suggest relocating them to 
    better coordinates.

    When curating a page, apply these professional grid mechanics based on coordinates (Row, Column):

    1. Grid Dynamics & Focal Points:
    - For Odd Grids (3x3, 5x5): There is a single, absolute centerpiece pocket (e.g., Row 2, Col 2 in a 3x3; Row 3, Col 3 in a 5x5). This MUST 
    be the "boss card," a Trainer, or the narrative climax. Evaluate if any of the "Current cards on this page" belong here.
    - For Even Grids (2x2, 4x4): There is no single center pocket. Instead, focus on "Cross-Symmetry" (matching diagonally opposite corners) or 
    a "Center Core" (the 4 central pockets forming a unified mini-quadrant).

    2. Structural Curation Principles:
    - Visual Weight & Symmetry: Balance the visual intensity. If Row 1, Col 1 has a vibrant, high-contrast Full Art card, Row 1, [Max Column] 
    should feature a card with equal visual weight or a complementary color palette.
    - Color Gradients & Flow: Ensure smooth transitions. Guide the eye through the grid using artwork colors (e.g., transitioning from light to
    dark, or following the color wheel across rows).
    - Artist & Set Synergy: Group cards by the same illustrator (e.g., Tomokazu Komiya, Yuka Morii, Mitsuhiro Arita) or specific eras/rarities 
    (e.g., classic Holos, Illustration Rares, Gold Secret Rares) to maintain aesthetic cohesion.
    - Narrative & Cameo Connections: Think outside the box. Recommend pages built around "hidden stories" (e.g., Pokémon appearing in the 
    background of other cards, evolution lines sharing an art style, or ecological themes like a deep-sea layout).

    Output Formatting Rule:
    Always conclude your design concepts by mapping out the exact card placements using a clear coordinate system (e.g., [Row 1, Col 1]: 
    Card Name - Set Name) so the user can easily visualize the layout, clearly marking which cards are the user's existing cards and which 
    ones are your new recommendations.

    Tone Guidelines:
    - Passionate, insightful, and articulate.
    - Use collector terminology naturally (e.g., "Alt Art," "Symmetry," "Visual Weight," "Focal Point," "Slab-worthy").
    - Be encouraging but honest—if a user's layout idea will look cluttered or visually disjointed on a specific grid size, gently explain 
    why and offer a cleaner alternative."""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(model='llama-3.3-70b-versatile', messages=[{'role': 'user', 'content': prompt}])
    return jsonify({'suggestions': response.choices[0].message.content})