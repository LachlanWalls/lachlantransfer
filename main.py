from flask import Flask, request, render_template
from pathlib import Path
from werkzeug.utils import secure_filename
import os

# basic Flask setup
app = Flask(__name__)

app.secret_key = 'plznohackme'
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024 # one gig max file size


# functions
@app.route('/', methods=["GET"])
def root():
    return '<h3 style="text-align: center">lachlantransfer is coming soon</h3>'