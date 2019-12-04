from flask import Flask, request, render_template, send_from_directory
from pathlib import Path
from werkzeug.utils import secure_filename
import os

# basic Flask setup
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024 # one gig max file size


# functions
@app.route('/', methods=["GET"])
def root():
    return '<h3 style="text-align: center">lachlantransfer is coming soon</h3>'


@app.route('/public/<path:filename>')
def asset(filename):
	return send_from_directory('public', filename, as_attachment=True)