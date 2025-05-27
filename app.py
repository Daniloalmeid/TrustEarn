# app.py
from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/index.html')
def index_html():
    return send_file('index.html')

@app.route('/evaluate')
def evaluate():
    return send_file('evaluate.html')

@app.route('/evaluate.html')
def evaluate_html():
    return send_file('evaluate.html')

@app.route('/product')
def product():
    return send_file('product.html')

@app.route('/product.html')
def product_html():
    return send_file('product.html')

@app.route('/rewards')
def rewards():
    return send_file('rewards.html')

@app.route('/rewards.html')
def rewards_html():
    return send_file('rewards.html')

@app.route('/profile')
def profile():
    return send_file('profile.html')

@app.route('/profile.html')
def profile_html():
    return send_file('profile.html')

@app.route('/submit-product')
def submit_product():
    return send_file('submit-product.html')

@app.route('/submit-product.html')
def submit_product_html():
    return send_file('submit-product.html')

@app.route('/admin-dashboard')
def admin_dashboard():
    return send_file('admin-dashboard.html')

@app.route('/admin-dashboard.html')
def admin_dashboard_html():
    return send_file('admin-dashboard.html')

@app.route('/how-it-works')
def how_it_works():
    return send_file('how-it-works.html')

@app.route('/how-it-works.html')
def how_it_works_html():
    return send_file('how-it-works.html')

@app.route('/login')
def login():
    return send_file('login.html')

@app.route('/login.html')
def login_html():
    return send_file('login.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_file(os.path.join('css', filename))

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_file(os.path.join('js', filename))

if __name__ == '__main__':
    print(f"Current directory: {os.getcwd()}")
    print(f"CSS Folder: {os.path.join(os.getcwd(), 'css')}")
    print(f"JS Folder: {os.path.join(os.getcwd(), 'js')}")
    app.run(debug=True, port=8000)