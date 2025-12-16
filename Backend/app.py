import config
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from routes.leranmate_routes import chatbot

# 🔹 Tell Flask where frontend is located
app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)

CORS(app)

# 🔹 Register AI APIs
app.register_blueprint(chatbot, url_prefix="/api")

# 🔹 Notes directory
NOTES_DIR = os.path.join(app.static_folder, "notes")

# 🔹 Render frontend
@app.route("/")
def index():
    return render_template("index.html")

# 🔹 Download notes
@app.route("/download/<subject>")
def download_notes(subject):
    files = {
        "dsa": "DSA_Notes.pdf",
        "dbms": "DBMS_Notes.pdf",
        "ai": "AI_Notes.pdf"
    }

    if subject in files:
        return send_from_directory(NOTES_DIR, files[subject], as_attachment=True)

    return "Notes not found", 404


if __name__ == "__main__":
    app.run(debug=True)