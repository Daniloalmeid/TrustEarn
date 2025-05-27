from flask import Flask, render_template, request, jsonify, session
import sqlite3
from solders.keypair import Keypair
from solana.rpc.api import Client
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
from PIL import Image
import exifread
from transformers import pipeline
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a secure key

# Uploads directory
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Solana Devnet connection
solana_client = Client("https://api.devnet.solana.com")
system_wallet = Keypair.from_seed(b"your_seed_here")  # Replace with your seed

# SQLite database
def init_db():
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (wallet TEXT PRIMARY KEY, tokens INTEGER, valid_reviews INTEGER, pending_reviews INTEGER, rejected_reviews INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS products
                 (id INTEGER PRIMARY KEY, name TEXT, description TEXT, image TEXT, reward INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS reviews
                 (id INTEGER PRIMARY KEY, product_id INTEGER, user TEXT, review TEXT, rating INTEGER, media TEXT, status TEXT, reason TEXT)''')
    conn.commit()
    conn.close()

# Review validation
def validate_review(review_text):
    classifier = pipeline('text-classification', model='distilbert-base-uncased')
    result = classifier(review_text)
    return result[0]['label'] == 'POSITIVE'  # Adjust as needed

def validate_image(image_path):
    try:
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f)
            return 'EXIF DateTimeOriginal' in tags
    except:
        return False

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/connect_wallet', methods=['POST'])
def connect_wallet():
    wallet = request.json['wallet']
    session['wallet'] = wallet  # Store wallet in session
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (wallet, tokens, valid_reviews, pending_reviews, rejected_reviews) VALUES (?, 0, 0, 0, 0)", (wallet,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Wallet connected!'})

@app.route('/evaluate')
def evaluate():
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT * FROM products")
    products = [{'id': row[0], 'name': row[1], 'description': row[2], 'image': row[3]} for row in c.fetchall()]
    conn.close()
    return render_template('evaluate.html', products=products)

@app.route('/submit_review', methods=['POST'])
def submit_review():
    product_id = request.form['product_id']
    product = request.form['product']
    review = request.form['review']
    rating = request.form['rating']
    user = request.form.get('user', session.get('wallet', 'anonymous'))
    media = request.files.get('media')

    # Validation
    is_valid_text = validate_review(review)
    is_valid_media = True
    media_path = None
    if media:
        media_path = os.path.join(app.config['UPLOAD_FOLDER'], media.filename)
        media.save(media_path)
        is_valid_media = validate_image(media_path)

    if is_valid_text and is_valid_media:
        status = 'pending'
        reason = ''
    else:
        status = 'rejected'
        reason = 'Invalid text or media'

    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("INSERT INTO reviews (product_id, user, review, rating, media, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (product_id, user, review, rating, media_path, status, reason))
    c.execute("UPDATE users SET pending_reviews = pending_reviews + 1 WHERE wallet = ?", (user,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Review submitted! Awaiting validation.'})

@app.route('/product')
def product():
    product_id = request.args.get('id')
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = c.fetchone()
    c.execute("SELECT * FROM reviews WHERE product_id = ?", (product_id,))
    reviews = [{'user': row[2], 'review': row[3], 'rating': row[4], 'media': row[5]} for row in c.fetchall()]
    avg_rating = sum(review['rating'] for review in reviews) / len(reviews) if reviews else 0
    conn.close()
    return render_template('product.html', product={'id': product[0], 'name': product[1], 'description': product[2], 'image': product[3], 'avg_rating': avg_rating}, reviews=reviews)

@app.route('/rewards')
def rewards():
    wallet = session.get('wallet', 'anonymous')
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT wallet, valid_reviews, tokens FROM users ORDER BY valid_reviews DESC LIMIT 10")
    top_users = [{'wallet': row[0], 'valid_reviews': row[1], 'tokens': row[2]} for row in c.fetchall()]
    c.execute("SELECT tokens, valid_reviews, pending_reviews, rejected_reviews FROM users WHERE wallet = ?", (wallet,))
    user_data = c.fetchone() or (0, 0, 0, 0)
    conn.close()
    return render_template('rewards.html', top_users=top_users, user_data={'tokens': user_data[0], 'valid_reviews': user_data[1], 'pending_reviews': user_data[2], 'rejected_reviews': user_data[3]})

@app.route('/profile')
def profile():
    wallet = session.get('wallet', 'anonymous')
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT tokens FROM users WHERE wallet = ?", (wallet,))
    result = c.fetchone()
    tokens = result[0] if result else 0
    c.execute("SELECT product_id, review, rating, status, reason FROM reviews WHERE user = ?", (wallet,))
    reviews = [{'product': row[0], 'review': row[1], 'rating': row[2], 'status': row[3], 'reason': row[4]} for row in c.fetchall()]
    conn.close()
    return render_template('profile.html', user={'wallet': wallet, 'tokens': tokens, 'reviews': reviews})

@app.route('/submit_product', methods=['POST'])
def submit_product():
    name = request.form['name']
    description = request.form['description']
    reward = request.form['reward']
    image = request.files['image']
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], image.filename)
    image.save(image_path)
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("INSERT INTO products (name, description, image, reward) VALUES (?, ?, ?, ?)", (name, description, image_path, reward))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Product submitted!'})

@app.route('/approve_review', methods=['POST'])
def approve_review():
    review_id = request.json['review_id']
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT user, product_id FROM reviews WHERE id = ?", (review_id,))
    review = c.fetchone()
    user, product_id = review[0], review[1]
    c.execute("SELECT reward FROM products WHERE id = ?", (product_id,))
    reward = c.fetchone()[0]
    c.execute("UPDATE reviews SET status = 'approved' WHERE id = ?", (review_id,))
    c.execute("UPDATE users SET valid_reviews = valid_reviews + 1, tokens = tokens + ?, pending_reviews = pending_reviews - 1 WHERE wallet = ?", (reward, user))
    conn.commit()
    conn.close()
    # Send tokens via Solana
    try:
        tx = Transaction().add(transfer(TransferParams(
            from_pubkey=system_wallet.pubkey(),
            to_pubkey=Keypair.from_base58_string(user).pubkey(),
            lamports=reward * 1000000000
        )))
        solana_client.send_transaction(tx, system_wallet)
    except Exception as e:
        return jsonify({'message': f'Error sending tokens: {str(e)}'}), 500
    return jsonify({'message': 'Review approved! 5 DET sent.'})

@app.route('/reject_review', methods=['POST'])
def reject_review():
    review_id = request.json['review_id']
    reason = request.json['reason']
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("UPDATE reviews SET status = 'rejected', reason = ? WHERE id = ?", (reason, review_id))
    c.execute("UPDATE users SET pending_reviews = pending_reviews - 1, rejected_reviews = rejected_reviews + 1 WHERE wallet = (SELECT user FROM reviews WHERE id = ?)", (review_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Review rejected!'})

@app.route('/admin_dashboard')
def admin_dashboard():
    conn = sqlite3.connect('trustearn.db')
    c = conn.cursor()
    c.execute("SELECT id, product_id, user, review FROM reviews WHERE status = 'pending'")
    pending_reviews = [{'id': row[0], 'product': row[1], 'user': row[2], 'review': row[3]} for row in c.fetchall()]
    conn.close()
    return render_template('admin-dashboard.html', pending_reviews=pending_reviews)

@app.route('/how_it_works')
def how_it_works():
    return render_template('how-it-works.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True)