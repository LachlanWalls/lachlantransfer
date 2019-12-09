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
        try:
            if 'file' not in request.files:
                return '{"error": "no file in request.files"}'

            file = request.files['file']
            if file.filename == '':
                return '{"error": "filename is empty"}'

            filename = str(round(time.time() * 1000)) + "__" + secure_filename(file.filename)
            file.save('/home/dynodelc/transfer.dynodel.com/uploads/' + filename)
            return '{"filename": "' + filename + '"}'
        except Exception as e:
            return str(e)

    return render_template('index.html')


@app.route('/public/<path:filename>')
def asset(filename):
	return send_from_directory('public', filename, as_attachment=True)


@app.route('/uploads/<path:filename>')
def uploads(filename):
	return send_from_directory('uploads', filename, as_attachment=True)


@app.route('/getfiles/<since>', methods=["POST"])
def getfiles(since):
    files = os.listdir("/home/dynodelc/transfer.dynodel.com/uploads")
    filessince = []

    for file in files:
        filet = int(file.split("__")[0])
        if (filet > int(since)):
            st = os.stat("/home/dynodelc/transfer.dynodel.com/uploads/" + file)
            filessince.append([file, st])

    return '{"files": ' + str(filessince).replace("'", '"') + '}'


@app.route('/<lang>', methods=["GET"])
def root_lang(lang):
    return redirect("https://transfer.dynodel.com/?lang=" + lang)