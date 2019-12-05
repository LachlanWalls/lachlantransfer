from flask import Flask, request, render_template, send_from_directory, url_for, redirect
from pathlib import Path
from werkzeug.utils import secure_filename
import os
import time

# basic Flask setup
app = Flask(__name__, template_folder="public")
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024 # one gig max file size


# functions
@app.route('/', methods=["GET", "POST"])
def root():
    if request.method == 'POST':
        if 'file' not in request.files:
            print(request)
            return '{"error": "no file in request.files"}'

        file = request.files['file']
        if file.filename == '':
            print(request)
            return '{"error": "filename is empty"}'

        filename = int(round(time.time() * 1000)) + "__" + secure_filename(file.filename)
        file.save('/home/dynodelc/transfer.dynodel.com/uploads/' + filename)
        return '{"filename": "' + filename + '"}'

    return render_template('index.html')


@app.route('/public/<path:filename>')
def asset(filename):
	return send_from_directory('public', filename, as_attachment=True)